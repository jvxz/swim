use crate::diesel_schema::track_play_count::dsl::*;
use crate::error::Error;
use crate::error::Result;
use crate::id3::TagTypeArg;
use crate::utils::get_track_identity_key;
use crate::DbPool;
use dashmap::DashMap;
use diesel::query_dsl::methods::FilterDsl;
use diesel::query_dsl::methods::SelectDsl;
use diesel::ExpressionMethods;
use diesel::OptionalExtension;
use diesel::RunQueryDsl;
use id3::v1v2::read_from_path;
use id3::ErrorKind;
use id3::Tag;
use serde::Serialize;
use specta::Type;
use std::collections::HashMap;
use std::fs::read_dir;
use std::fs::File;
use std::path::Path;
use std::path::PathBuf;
use std::sync::{Arc, LazyLock};
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::async_runtime::spawn_blocking;
use tauri::AppHandle;
use tauri::Manager;

pub type SerializableTagMap = HashMap<String, String>;

#[derive(Serialize, Type, Clone)]
pub struct FileEntry {
  pub path: String,
  pub name: String,
  pub filename: String,
  pub tags: SerializableTagMap,
  pub thumbnail_uri: String,
  pub full_uri: String,
  pub is_playlist_track: bool,
  pub valid: bool,
  pub primary_tag: Option<TagTypeArg>,
  pub extension: String,
  pub duration: f64,
  pub play_count: i32,
  pub date_added: Option<String>,
  pub last_played: Option<String>,
}

pub static FOLDER_CACHE: LazyLock<DashMap<String, Arc<Vec<String>>>> = LazyLock::new(DashMap::new);
pub static TRACK_CACHE: LazyLock<DashMap<String, FileEntry>> = LazyLock::new(DashMap::new);

#[tauri::command]
#[specta::specta]
pub async fn read_folder(
  app_handle: AppHandle<tauri::Wry>,
  path: String,
) -> Result<Arc<Vec<FileEntry>>> {
  spawn_blocking(move || {
    if let Some(cached_dir) = FOLDER_CACHE.get(&path) {
      let paths = cached_dir.value();
      let file_entries = paths
        .iter()
        .map(|path| get_track_data_core(app_handle.clone(), path.clone(), None))
        .collect::<Result<Vec<FileEntry>>>()?;

      return Ok(Arc::new(file_entries));
    };

    let entries = read_dir(&path).map_err(|e| Error::FileSystem(e.to_string()))?;

    let file_entries = entries
      .filter_map(|result| result.ok())
      .filter(|dir_entry| dir_entry.path().is_file())
      .filter(|dir_entry| is_supported(dir_entry.path()))
      .map(|dir_entry| file_entry_from_path(app_handle.clone(), dir_entry.path()))
      .collect::<Result<Vec<FileEntry>>>()?;

    let data = Arc::new(file_entries.clone());
    let paths = file_entries
      .iter()
      .map(|entry| entry.path.clone())
      .collect::<Vec<String>>();

    FOLDER_CACHE.insert(path, Arc::new(paths));

    return Ok(data);
  })
  .await
  .map_err(|e| Error::FileSystem(e.to_string()))?
}

#[tauri::command]
#[specta::specta]
pub async fn get_folder_track_paths(path: String, deep: Option<bool>) -> Result<Vec<String>> {
  spawn_blocking(move || {
    if !deep.unwrap_or(false) {
      let paths = read_dir(&path)
        .map_err(|e| Error::FileSystem(e.to_string()))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_file())
        .filter(|entry| is_supported(entry.path()))
        .map(|entry| entry.path().to_string_lossy().to_string())
        .collect::<Vec<String>>();

      return Ok(paths);
    }

    let paths = jwalk::WalkDir::new(&path)
      .into_iter()
      .filter_map(|entry| entry.ok())
      .filter(|entry| entry.path().is_file())
      .filter(|entry| is_supported(entry.path()))
      .map(|entry| entry.path().to_string_lossy().to_string())
      .collect::<Vec<String>>();

    return Ok(paths);
  })
  .await
  .map_err(|e| Error::FileSystem(e.to_string()))?
}

#[tauri::command]
#[specta::specta]
pub async fn get_canonical_path(path: String) -> Result<String> {
  spawn_blocking(move || {
    std::fs::canonicalize(path)
      .map(|p| p.to_string_lossy().to_string())
      .map_err(|e| Error::Other(e.to_string()))
  })
  .await
  .map_err(|e| Error::Other(e.to_string()))?
}

#[tauri::command]
#[specta::specta]
pub async fn get_tracks_data(
  app_handle: AppHandle<tauri::Wry>,
  paths: Vec<String>,
  refresh: Option<bool>,
) -> Result<Vec<FileEntry>> {
  spawn_blocking(move || {
    paths
      .into_iter()
      .filter_map(|path| get_track_data_core(app_handle.clone(), path, refresh).ok())
      .collect()
  })
  .await
  .map_err(|e| Error::FileSystem(e.to_string()))
}

#[tauri::command]
#[specta::specta]
pub async fn get_track_data(
  app_handle: AppHandle<tauri::Wry>,
  path_string: String,
  refresh: Option<bool>,
) -> Result<FileEntry> {
  spawn_blocking(move || get_track_data_core(app_handle, path_string, refresh))
    .await
    .map_err(|e| Error::FileSystem(e.to_string()))?
}

fn get_track_data_core(
  app_handle: AppHandle<tauri::Wry>,
  path_string: String,
  refresh: Option<bool>,
) -> Result<FileEntry> {
  if !refresh.unwrap_or(false) {
    if let Some(cached_track) = TRACK_CACHE.get(&path_string) {
      return Ok(cached_track.value().clone());
    }
  }

  let path = PathBuf::from(&path_string);
  let file_entry = file_entry_from_path(app_handle, path)?;

  TRACK_CACHE.insert(path_string, file_entry.clone());

  return Ok(file_entry);
}

fn file_entry_from_path(app_handle: AppHandle<tauri::Wry>, path: PathBuf) -> Result<FileEntry> {
  if !path.is_file() {
    return Ok(FileEntry {
      filename: path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or("Unknown filename".to_string()),
      tags: SerializableTagMap::new(),
      full_uri: String::new(),
      thumbnail_uri: String::new(),
      path: path.to_string_lossy().to_string(),
      name: path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or("Unknown title".to_string()),
      is_playlist_track: false,
      valid: false,
      primary_tag: None,
      extension: String::new(),
      duration: -1.0,
      play_count: 0,
      date_added: None,
      last_played: None,
    });
  }

  let primary_tag = get_primary_tag(&path)?;
  let tag_map = get_tag_map(primary_tag.clone())?;
  let full_uri = build_cover_uri(path.to_string_lossy().as_ref(), "full");
  let thumbnail_uri = build_cover_uri(path.to_string_lossy().as_ref(), "thumbnail");
  let duration = get_duration(&path)?;
  let name = path
    .file_name()
    .map(|n| n.to_string_lossy().to_string())
    .unwrap_or("Unknown title".to_string());
  let filename = path
    .file_name()
    .map(|n| n.to_string_lossy().to_string())
    .unwrap_or("Unknown filename".to_string());
  let extension = path
    .extension()
    .map(|n| n.to_string_lossy().to_string())
    .unwrap_or("Unknown extension".to_string());
  let play_count_res = get_play_count(app_handle.clone(), &tag_map)?;
  let (date_added_res, last_played_res) =
    get_library_dates(app_handle, path.to_string_lossy().as_ref())?;

  return Ok(FileEntry {
    filename,
    tags: tag_map,
    full_uri,
    thumbnail_uri,
    path: path.to_string_lossy().to_string(),
    name,
    is_playlist_track: false,
    valid: true,
    primary_tag: get_primary_tag_version(primary_tag),
    extension,
    duration,
    play_count: play_count_res.unwrap_or(-1),
    date_added: date_added_res,
    last_played: last_played_res,
  });
}

fn get_tag_map(tag: Option<Tag>) -> Result<SerializableTagMap> {
  return match tag {
    Some(tag) => {
      let tag_map: SerializableTagMap = HashMap::from_iter(
        tag
          .frames()
          .map(|f| (f.id().to_string(), f.content().to_string())),
      );

      return Ok(tag_map);
    }
    None => Ok(SerializableTagMap::new()),
  };
}

fn get_play_count(
  app_handle: AppHandle<tauri::Wry>,
  tag_map: &SerializableTagMap,
) -> Result<Option<i32>> {
  let mut conn = app_handle
    .state::<DbPool>()
    .get()
    .map_err(|e| Error::LastFm(e.to_string()))?;

  let title = match tag_map.get("TIT2").map(String::as_str) {
    Some(title) => title,
    None => return Ok(None),
  };
  let artist = match tag_map.get("TPE1").map(String::as_str) {
    Some(artist) => artist,
    None => return Ok(None),
  };

  let id_hash_res = get_track_identity_key(Some(title), Some(artist));

  let play_count_res = track_play_count
    .filter(id_hash.eq(&id_hash_res))
    .select(play_count)
    .first(&mut conn)
    .optional()
    .map_err(|e| {
      // handle errors in CI environments where the table may not be present yet
      if e.to_string().contains("no such table: track_play_count") {
        return Error::Other("__missing_track_play_count_table__".to_string());
      }
      Error::LastFm(e.to_string())
    });

  let play_count_res = match play_count_res {
    Ok(value) => value,
    Err(Error::Other(marker)) if marker == "__missing_track_play_count_table__" => return Ok(None),
    Err(error) => return Err(error),
  };

  return Ok(play_count_res);
}

/// Returns `(date_added, last_played)` for a track, or `(None, None)` when the track
/// isn't in the library — folder browsing works on files that were never added.
fn get_library_dates(
  app_handle: AppHandle<tauri::Wry>,
  track_path: &str,
) -> Result<(Option<String>, Option<String>)> {
  use crate::diesel_schema::library_tracks;

  let mut conn = app_handle
    .state::<DbPool>()
    .get()
    .map_err(|e| Error::Other(e.to_string()))?;

  let row = library_tracks::table
    .filter(library_tracks::path.eq(track_path))
    .select((library_tracks::date_added, library_tracks::last_played))
    .first::<(Option<String>, Option<String>)>(&mut conn)
    .optional();

  return match row {
    Ok(value) => Ok(value.unwrap_or((None, None))),
    // handle errors in CI environments where the table may not be present yet
    Err(e) if e.to_string().contains("no such table") => Ok((None, None)),
    Err(e) => Err(Error::Other(e.to_string())),
  };
}

fn get_primary_tag(path: impl AsRef<Path>) -> Result<Option<Tag>> {
  let path = path.as_ref();
  return Ok(match read_from_path(path) {
    Ok(tag) => Some(tag),
    Err(err) => {
      if matches!(err.kind, ErrorKind::NoTag) {
        return Ok(None);
      }

      return Err(Error::Id3(err.to_string()));
    }
  });
}

fn get_primary_tag_version(tag: Option<Tag>) -> Option<TagTypeArg> {
  return match tag {
    Some(tag) => {
      return match tag.version() {
        id3::Version::Id3v22 => Some(TagTypeArg::Id3v22),
        id3::Version::Id3v23 => Some(TagTypeArg::Id3v23),
        id3::Version::Id3v24 => Some(TagTypeArg::Id3v24),
      };
    }
    None => None,
  };
}

fn get_duration(path: impl AsRef<Path>) -> Result<f64> {
  let path = path.as_ref();
  let file = File::open(path).map_err(|e| Error::FileSystem(e.to_string()))?;
  let mss = MediaSourceStream::new(Box::new(file), Default::default());

  let extension = match path.extension().and_then(|ext| ext.to_str()) {
    Some(ext) => ext,
    None => return Ok(-1.0),
  };

  let probe = symphonia::default::get_probe()
    .format(
      Hint::new().with_extension(extension),
      mss,
      &FormatOptions::default(),
      &MetadataOptions::default(),
    )
    .map_err(|e| Error::Audio(e.to_string()))?;

  let format = probe.format;
  let track = match format.tracks().first() {
    Some(track) => track,
    None => {
      println!("no track found for path: {}", path.to_string_lossy());
      return Ok(-1.0);
    }
  };

  let time_base = match track.codec_params.time_base {
    Some(time_base) => time_base,
    None => {
      println!("no time_base found for path: {}", path.to_string_lossy());
      return Ok(-1.0);
    }
  };

  match track.codec_params.n_frames {
    Some(n_frames) => {
      let duration = (n_frames as f64 * time_base.numer as f64) / time_base.denom as f64;

      return Ok(duration);
    }
    None => {
      println!("no n_frames found for path: {}", path.to_string_lossy());
      return Ok(-1.0);
    }
  }
}

fn is_supported(path: impl AsRef<Path>) -> bool {
  let supported = [
    // "mp3", "mp2", "mp1", "flac", "wav", "ogg", "oga", "m4a", "mp4", "aac", "mkv", "mka", "webm",
    "mp3", "mp2", "mp1", "flac", "wav", "ogg", "oga", "m4a", "aac",
  ];

  path
    .as_ref()
    .extension()
    .and_then(|ext| ext.to_str())
    .map(|ext| supported.contains(&ext.to_lowercase().as_str()))
    .unwrap_or(false)
}

fn build_cover_uri(path: impl AsRef<str>, mode: impl AsRef<str>) -> String {
  return format!("cover-{}://localhost/{}", mode.as_ref(), path.as_ref());
}
