use tauri::{Window, WindowEvent};
use tauri_plugin_store::StoreExt;

use crate::playback::StreamStatus;

pub fn handle_window_event(window: &Window, event: &WindowEvent) {
  if let WindowEvent::CloseRequested { .. } = event {
    if let Ok(store) = window.store("prefs.json") {
      if let Some(Ok(mut playback_status)) = store
        .get("playback-status")
        .map(|v| serde_json::from_value::<StreamStatus>(v))
      {
        playback_status.is_playing = false;

        if let Ok(value) = serde_json::to_value(playback_status) {
          store.set("playback-status", value);
        }
      }
    }
  }
}
