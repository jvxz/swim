#![deny(clippy::unwrap_used, clippy::expect_used)]
use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Manager};
use tokio::sync::{mpsc, oneshot};

pub struct AudioHandle {
  pub tx: mpsc::Sender<(StreamAction, oneshot::Sender<StreamStatus>)>,
}

#[derive(Serialize, Clone, Deserialize, Type, Debug)]
pub enum StreamAction {
  Play(String),
  Pause,
  Resume,
  Seek(f64),
  SetLoop(bool),
  SetVolume(f32),
  ToggleMute,
  Reset,
  SetOutputDevice(Option<String>),
  /// Query-only: returns current state without changing anything. Since
  /// this round-trips through the same channel the audio thread's startup
  /// logic runs on before it starts servicing requests, the response is
  /// guaranteed to reflect e.g. a startup device fallback already applied
  /// on this thread — unlike a fire-and-forget event, which can fire before
  /// a listener has been registered.
  GetStatus,
}

#[derive(Serialize, Clone, Deserialize, Type, Debug)]
pub struct StreamStatus {
  pub is_playing: bool,
  pub position: f64,
  pub duration: f64,
  pub is_looping: bool,
  pub path: Option<String>,
  pub volume: f32,
  pub is_muted: bool,
  /// The currently-active output device, or `None` for the system default.
  /// Authoritative: only ever set to the device that's actually in use.
  /// `#[serde(default)]` so playback state persisted before this field
  /// existed still deserializes instead of being discarded wholesale.
  #[serde(default)]
  pub output_device: Option<String>,
}

#[tauri::command]
#[specta::specta]
pub async fn control_playback(
  app_handle: AppHandle<tauri::Wry>,
  action: StreamAction,
) -> Result<StreamStatus> {
  let audio_handle = app_handle.state::<AudioHandle>();

  let (response_tx, response_rx) = oneshot::channel::<StreamStatus>();

  audio_handle
    .tx
    .send((action, response_tx))
    .await
    .map_err(|_| Error::Other("audio thread disconnected".to_string()))?;

  let response = response_rx
    .await
    .map_err(|_| Error::Other("failed to get response from audio thread".to_string()))?;

  return Ok(response);
}
