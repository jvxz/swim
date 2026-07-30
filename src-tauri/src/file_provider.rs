use crate::error::Result;
use crate::read::TRACK_CACHE;
use serde::Serialize;
use specta::Type;
use std::path::Path;
use tauri::AppHandle;
use tauri::Emitter;

#[derive(Serialize, Type, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DownloadStatus {
  /// Fully present on disk, or on a platform/volume without a File Provider.
  Local,
  NotDownloaded,
  Downloading,
  DownloadFailed,
}

impl DownloadStatus {
  pub fn is_terminal(self) -> bool {
    matches!(self, Self::Local | Self::DownloadFailed)
  }
}

#[derive(Serialize, Type, Clone)]
pub struct DownloadProgressEvent {
  pub path: String,
  pub status: DownloadStatus,
  /// `None` when the provider doesn't report a percentage — render an
  /// indeterminate bar rather than pretending we know.
  pub percent: Option<f64>,
}

/// Make *any* read of an unmaterialized placeholder fail with an error instead
/// of silently materializing it. Without this a single stray tag or duration
/// read downloads the whole file: measured against a Google Drive item, a 4KB
/// read pulled all 2.79MB, because the provider has no partial-fetch support.
///
/// Explicit downloads are unaffected — `startDownloadingUbiquitousItem` is a
/// provider request, not a VFS read.
pub fn disable_dataless_materialization() {
  #[cfg(target_os = "macos")]
  macos::disable_dataless_materialization();
}

/// Download status plus percentage, in one FFI round-trip.
pub fn probe(path: &Path) -> (DownloadStatus, Option<f64>) {
  #[cfg(target_os = "macos")]
  return macos::probe(path);

  #[cfg(not(target_os = "macos"))]
  {
    let _ = path;
    (DownloadStatus::Local, None)
  }
}

pub fn get_download_status(path: &Path) -> DownloadStatus {
  probe(path).0
}

const POLL_INTERVAL_MS: u64 = 300;
/// Stall guard: a path the provider never picks up would otherwise be polled
/// forever. Reset on every tick that reports `Downloading`, so a slow-but-live
/// download is never cancelled — only a genuinely idle one (~60s) is.
const MAX_IDLE_TICKS: u32 = 200;

/// Materialize File Provider placeholders, emitting progress per path until
/// every one reaches a terminal state. Callers wanting fire-and-forget simply
/// don't await the invoke promise.
#[tauri::command]
#[specta::specta]
pub async fn download_tracks(app_handle: AppHandle<tauri::Wry>, paths: Vec<String>) -> Result<()> {
  let mut pending: Vec<(String, u32)> = Vec::new();

  for path in paths {
    let (status, _) = probe(Path::new(&path));
    if status.is_terminal() {
      // Already materialized (or unreachable) — nothing to ask the provider for.
      emit_progress(&app_handle, &path, status, None);
      continue;
    }

    match start_download(Path::new(&path)) {
      // The provider only flips `IsDownloading` a beat later; report the
      // intent now so the row shows a bar immediately rather than flickering
      // through another `NotDownloaded` tick first.
      Ok(()) => {
        emit_progress(&app_handle, &path, DownloadStatus::Downloading, None);
        pending.push((path, 0));
      }
      Err(()) => emit_progress(&app_handle, &path, DownloadStatus::DownloadFailed, None),
    }
  }

  while !pending.is_empty() {
    tokio::time::sleep(std::time::Duration::from_millis(POLL_INTERVAL_MS)).await;

    pending.retain_mut(|(path, idle_ticks)| {
      let (status, percent) = probe(Path::new(path));
      emit_progress(&app_handle, path, status, percent);

      if status.is_terminal() {
        // Drop the stale entry so the next `get_track_data` reads real tags
        // off the now-materialized file.
        TRACK_CACHE.remove(path);
        return false;
      }

      if status == DownloadStatus::Downloading {
        *idle_ticks = 0;
        return true;
      }

      *idle_ticks += 1;
      if *idle_ticks >= MAX_IDLE_TICKS {
        emit_progress(&app_handle, path, DownloadStatus::DownloadFailed, None);
        return false;
      }

      true
    });
  }

  Ok(())
}

fn emit_progress(
  app_handle: &AppHandle<tauri::Wry>,
  path: &str,
  status: DownloadStatus,
  percent: Option<f64>,
) {
  let _ = app_handle.emit(
    "file-provider-download-progress",
    DownloadProgressEvent {
      path: path.to_string(),
      status,
      percent,
    },
  );
}

/// Ask the provider to materialize `path`. Verified to drive both iCloud and
/// third-party File Provider extensions (tested against Google Drive).
fn start_download(path: &Path) -> std::result::Result<(), ()> {
  #[cfg(target_os = "macos")]
  return macos::start_downloading(path).map_err(|_| ());

  #[cfg(not(target_os = "macos"))]
  {
    let _ = path;
    Ok(())
  }
}

#[cfg(target_os = "macos")]
mod macos {
  use super::DownloadStatus;
  use objc2_foundation::NSArray;
  use objc2_foundation::NSFileManager;
  use objc2_foundation::NSNumber;
  use objc2_foundation::NSString;
  use objc2_foundation::NSURL;
  use objc2_foundation::NSURLIsUbiquitousItemKey;
  use objc2_foundation::NSURLUbiquitousItemDownloadingErrorKey;
  use objc2_foundation::NSURLUbiquitousItemDownloadingStatusCurrent;
  use objc2_foundation::NSURLUbiquitousItemDownloadingStatusDownloaded;
  use objc2_foundation::NSURLUbiquitousItemDownloadingStatusKey;
  use objc2_foundation::NSURLUbiquitousItemIsDownloadingKey;
  use std::path::Path;

  /// Values from the macOS SDK's `<sys/resource.h>`. Not exposed by the `libc`
  /// crate (0.2.182), so the symbol is declared directly.
  pub fn disable_dataless_materialization() {
    const IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES: i32 = 3;
    const IOPOL_SCOPE_PROCESS: i32 = 0;
    const IOPOL_MATERIALIZE_DATALESS_FILES_OFF: i32 = 1;

    unsafe extern "C" {
      fn setiopolicy_np(iotype: i32, scope: i32, policy: i32) -> i32;
    }

    let rc = unsafe {
      setiopolicy_np(
        IOPOL_TYPE_VFS_MATERIALIZE_DATALESS_FILES,
        IOPOL_SCOPE_PROCESS,
        IOPOL_MATERIALIZE_DATALESS_FILES_OFF,
      )
    };

    if rc != 0 {
      // Non-fatal: placeholders then behave as they did before, downloading on
      // read. Worth knowing about, not worth refusing to start over.
      eprintln!("failed to disable dataless materialization (setiopolicy_np returned {rc})");
    }
  }

  fn file_url(path: &Path) -> objc2::rc::Retained<NSURL> {
    let path = NSString::from_str(&path.to_string_lossy());
    NSURL::fileURLWithPath(&path)
  }

  pub fn start_downloading(path: &Path) -> Result<(), String> {
    let url = file_url(path);
    NSFileManager::defaultManager()
      .startDownloadingUbiquitousItemAtURL_error(&url)
      .map_err(|err| err.localizedDescription().to_string())
  }

  pub fn probe(path: &Path) -> (DownloadStatus, Option<f64>) {
    let url = file_url(path);

    // `NSURLUbiquitousItemPercentDownloadedKey` is deprecated in favour of the
    // NSMetadataQuery equivalent, but it still reports and needs a fraction of
    // the FFI surface. Fall back to an indeterminate bar when it's absent.
    #[allow(deprecated)]
    let percent_key = unsafe { objc2_foundation::NSURLUbiquitousItemPercentDownloadedKey };

    let keys = NSArray::from_slice(unsafe {
      &[
        NSURLIsUbiquitousItemKey,
        NSURLUbiquitousItemDownloadingStatusKey,
        NSURLUbiquitousItemIsDownloadingKey,
        NSURLUbiquitousItemDownloadingErrorKey,
        percent_key,
      ]
    });

    let Ok(values) = url.resourceValuesForKeys_error(&keys) else {
      // Not a ubiquitous item, or the URL isn't readable — either way this is
      // not a placeholder we can act on. `valid` already covers missing files.
      return (DownloadStatus::Local, None);
    };

    let is_ubiquitous = unsafe { values.objectForKey(NSURLIsUbiquitousItemKey) }
      .and_then(|value| value.downcast_ref::<NSNumber>().map(NSNumber::as_bool))
      .unwrap_or(false);

    if !is_ubiquitous {
      return (DownloadStatus::Local, None);
    }

    let percent = values
      .objectForKey(percent_key)
      .and_then(|value| value.downcast_ref::<NSNumber>().map(NSNumber::as_f64));

    if unsafe { values.objectForKey(NSURLUbiquitousItemDownloadingErrorKey) }.is_some() {
      return (DownloadStatus::DownloadFailed, percent);
    }

    let status = unsafe { values.objectForKey(NSURLUbiquitousItemDownloadingStatusKey) }
      .and_then(|value| value.downcast_ref::<NSString>().map(NSString::to_string));

    let downloaded = unsafe {
      [
        NSURLUbiquitousItemDownloadingStatusDownloaded.to_string(),
        NSURLUbiquitousItemDownloadingStatusCurrent.to_string(),
      ]
    };

    match status {
      // A ubiquitous item with no status key at all is materialized.
      None => (DownloadStatus::Local, None),
      Some(status) if downloaded.contains(&status) => (DownloadStatus::Local, None),
      Some(_) => {
        let is_downloading = unsafe { values.objectForKey(NSURLUbiquitousItemIsDownloadingKey) }
          .and_then(|value| value.downcast_ref::<NSNumber>().map(NSNumber::as_bool))
          .unwrap_or(false);

        if is_downloading {
          (DownloadStatus::Downloading, percent)
        } else {
          (DownloadStatus::NotDownloaded, percent)
        }
      }
    }
  }
}
