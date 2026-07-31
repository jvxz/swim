use crate::error::{emit_error, Error, Result};
use crate::playback::{StreamAction, StreamStatus};
use cpal::traits::{DeviceTrait, HostTrait};
use cpal::StreamError;
use kira::backend::cpal::CpalBackendSettings;
use kira::sound::static_sound::{StaticSoundData, StaticSoundHandle};
use kira::sound::streaming::{StreamingSoundHandle, StreamingSoundSettings};
use kira::sound::{FromFileError, PlaybackPosition, Region};
use kira::{
  self, sound::streaming::StreamingSoundData, AudioManager, AudioManagerSettings, DefaultBackend,
};
use kira::{Decibels, Easing, StartTime, Tween, Value};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::{mpsc, oneshot};

#[derive(Serialize, Clone, Deserialize, Type, Debug)]
pub struct AudioDeviceInfo {
  pub name: String,
  pub is_default: bool,
}

fn device_name(device: &cpal::Device) -> Option<String> {
  device.description().ok().map(|d| d.name().to_string())
}

#[tauri::command]
#[specta::specta]
pub fn list_output_devices() -> Result<Vec<AudioDeviceInfo>> {
  let host = cpal::default_host();
  let default_name = host.default_output_device().and_then(|d| device_name(&d));

  let devices = host
    .output_devices()
    .map_err(|e| Error::Audio(format!("failed to enumerate output devices: {e}")))?;

  Ok(
    devices
      .filter_map(|d| device_name(&d))
      .map(|name| {
        let is_default = default_name.as_deref() == Some(name.as_str());
        AudioDeviceInfo { name, is_default }
      })
      .collect(),
  )
}

fn find_device_by_name(name: &str) -> Option<cpal::Device> {
  cpal::default_host()
    .output_devices()
    .ok()?
    .find(|d| device_name(d).is_some_and(|n| n == name))
}

/// Creates an audio manager targeting the named output device, falling back
/// to the system default if no device name is given. Errors (without
/// creating a manager) if a specific device was requested but isn't
/// currently present.
fn create_audio_manager(device_name: Option<&str>) -> Result<(AudioManager<DefaultBackend>, bool)> {
  let device = match device_name {
    Some(name) => Some(
      find_device_by_name(name)
        .ok_or_else(|| Error::Audio(format!("output device \"{name}\" not found")))?,
    ),
    None => None,
  };
  let used_custom_device = device.is_some();

  let manager = AudioManager::new(AudioManagerSettings {
    internal_buffer_size: 256,
    backend_settings: CpalBackendSettings {
      device,
      ..Default::default()
    },
    ..Default::default()
  })
  .map_err(|_| Error::Audio("failed to create audio manager".to_string()))?;

  Ok((manager, used_custom_device))
}

/// Recreates the current handle on a freshly (re)created audio manager,
/// resuming at the same track/position/volume/loop state. If the track
/// has since disappeared from disk, resets playback state instead of
/// silently dropping the handle so the frontend doesn't show a phantom
/// "playing" track with no audio.
fn reload_handle(
  audio_manager: &mut AudioManager<DefaultBackend>,
  state: &mut StreamStatus,
  loader_tx: &std::sync::mpsc::Sender<(i32, String)>,
  static_sound_id: &mut i32,
) -> Result<CurrentHandle> {
  let Some(path) = state.path.clone() else {
    return Ok(CurrentHandle::None);
  };
  if !std::path::Path::new(&path).is_file() {
    state.path = None;
    state.is_playing = false;
    state.duration = 0.0;
    state.position = 0.0;
    return Ok(CurrentHandle::None);
  }

  *static_sound_id += 1;
  let _ = loader_tx.send((*static_sound_id, path.clone()));

  let new_sound_data = load_streaming_data(path.clone())
    .map_err(|e| Error::Audio(format!("failed to create streaming sound data: {}", e)))?;

  let mut new_handle = audio_manager
    .play(new_sound_data.with_settings(StreamingSoundSettings {
      loop_region: if state.is_looping {
        Some(Region::from(0.0..))
      } else {
        None
      },
      volume: Value::from(Decibels::from(state.volume)),
      start_position: PlaybackPosition::Seconds(state.position),
      ..Default::default()
    }))
    .map_err(|_| Error::Audio("failed to play sound via stream".to_string()))?;

  if !state.is_playing {
    new_handle.pause(TWEEN);
  }

  let mut handle = CurrentHandle::Streaming(new_handle);
  handle.set_volume(state.volume, state.is_muted);
  Ok(handle)
}

/// Switches the active output device, preserving current playback state
/// (including live position, so switching mid-playback doesn't rewind).
/// Leaves the existing manager/handle/state untouched if the switch fails,
/// so a bad selection doesn't interrupt whatever is already playing.
/// Updates `state.output_device` to the device actually applied on success.
fn switch_output_device(
  audio_manager: &mut AudioManager<DefaultBackend>,
  audio_handle: &mut CurrentHandle,
  device_name: Option<&str>,
  state: &mut StreamStatus,
  loader_tx: &std::sync::mpsc::Sender<(i32, String)>,
  static_sound_id: &mut i32,
) -> Result<bool> {
  let (mut new_manager, used_custom_device) = create_audio_manager(device_name)?;

  let live_position = audio_handle.position();
  let mut new_state = state.clone();
  new_state.position = live_position;

  let new_handle = reload_handle(&mut new_manager, &mut new_state, loader_tx, static_sound_id)?;

  new_state.output_device = if used_custom_device {
    device_name.map(str::to_string)
  } else {
    None
  };

  *audio_manager = new_manager;
  *audio_handle = new_handle;
  *state = new_state;

  Ok(used_custom_device)
}

const TWEEN: Tween = Tween {
  duration: Duration::from_millis(0),
  easing: Easing::Linear,
  start_time: StartTime::Immediate,
};

enum InternalEvent {
  Command(StreamAction, oneshot::Sender<StreamStatus>),
  LoadFinished {
    id: i32,
    data: Option<StaticSoundData>,
  },
  CheckDeviceHealth,
}

enum CurrentHandle {
  None,
  Streaming(StreamingSoundHandle<FromFileError>),
  Static(StaticSoundHandle),
}

impl CurrentHandle {
  fn stop(&mut self) {
    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => h.stop(TWEEN),
      CurrentHandle::Static(h) => h.stop(TWEEN),
    }
  }

  fn pause(&mut self) {
    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => h.pause(TWEEN),
      CurrentHandle::Static(h) => h.pause(TWEEN),
    }
  }

  fn resume(&mut self) {
    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => h.resume(TWEEN),
      CurrentHandle::Static(h) => h.resume(TWEEN),
    }
  }

  fn seek_to(&mut self, to: f64) {
    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => h.seek_to(to),
      CurrentHandle::Static(h) => h.seek_to(to),
    }
  }

  fn position(&self) -> f64 {
    match self {
      CurrentHandle::None => 0.0,
      CurrentHandle::Streaming(h) => h.position(),
      CurrentHandle::Static(h) => h.position(),
    }
  }

  fn set_volume(&mut self, mut volume: f32, is_muted: bool) {
    if is_muted {
      volume = -60.0;
    }

    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => h.set_volume(Decibels::from(volume), TWEEN),
      CurrentHandle::Static(h) => h.set_volume(Decibels::from(volume), TWEEN),
    }
  }

  fn set_loop(&mut self, should_loop: bool) {
    match self {
      CurrentHandle::None => {}
      CurrentHandle::Streaming(h) => {
        if should_loop {
          h.set_loop_region(0.0..);
        } else {
          h.set_loop_region(None);
        }
      }
      CurrentHandle::Static(h) => {
        if should_loop {
          h.set_loop_region(0.0..);
        } else {
          h.set_loop_region(None);
        }
      }
    }
  }
}

pub fn spawn_audio_thread(
  mut ui_rx: mpsc::Receiver<(StreamAction, oneshot::Sender<StreamStatus>)>,
  initial_state: Option<StreamStatus>,
  initial_device: Option<String>,
  app_handle: AppHandle<tauri::Wry>,
) -> Result<()> {
  let (event_tx, mut event_rx) = mpsc::channel::<InternalEvent>(32);

  let event_tx_clone = event_tx.clone();

  // ui event loop
  thread::spawn(move || {
    while let Some(msg) = ui_rx.blocking_recv() {
      let res = event_tx_clone.try_send(InternalEvent::Command(msg.0, msg.1));

      if let Err(e) = res {
        log::error!("failed to send command to audio thread: {e}");
      }
    }
  });

  // device health watchdog: kira only auto-recovers to the *default* device
  // on disconnect, so we poll for stream errors ourselves to detect when a
  // user-selected device disappears and fall back gracefully
  let health_check_tx = event_tx.clone();
  thread::spawn(move || loop {
    thread::sleep(Duration::from_secs(1));
    if health_check_tx
      .blocking_send(InternalEvent::CheckDeviceHealth)
      .is_err()
    {
      break;
    }
  });

  let (mut audio_manager, mut using_custom_device) =
    match create_audio_manager(initial_device.as_deref()) {
      Ok(result) => result,
      Err(e) => {
        // no listener can reliably be registered on the frontend this early
        // (the webview may not have loaded yet), so correctness here comes
        // from `state.output_device` below plus the `GetStatus` query the
        // frontend runs on mount — not from a fire-and-forget event
        emit_error(app_handle.clone(), e);
        (create_audio_manager(None)?.0, false)
      }
    };

  let mut pending_static_data: Option<StaticSoundData> = None;
  let mut audio_handle: CurrentHandle = CurrentHandle::None;

  let (loader_tx, loader_rx) = std::sync::mpsc::channel::<(i32, String)>();
  let mut static_sound_id: i32 = 0;
  let loader_event_tx = event_tx.clone();

  // static loader thread
  thread::spawn(move || {
    while let Ok((id, path)) = loader_rx.recv() {
      let sound = StaticSoundData::from_file(&path).ok();

      let res = loader_event_tx.try_send(InternalEvent::LoadFinished { id, data: sound });
      if let Err(e) = res {
        log::error!("failed to send load finished event: {e}");
      }
    }
  });

  let mut state = initial_state.unwrap_or(StreamStatus {
    is_playing: false,
    position: 0.0,
    duration: 0.0,
    is_looping: false,
    path: None,
    volume: -10.0,
    is_muted: false,
    output_device: None,
  });
  // authoritative: reflects the device actually applied above, clearing out
  // a stale/unavailable selection rather than trusting the persisted value
  state.output_device = if using_custom_device {
    initial_device.clone()
  } else {
    None
  };

  // load track if initial state has path. restoring is best-effort: a persisted
  // path that no longer decodes (unsupported format, cloud file with no bytes
  // yet) must not propagate out of here, or the thread dies before the event
  // loop starts and every later command hits a dropped receiver. same caveat as
  // the audio-manager fallback above — the webview may not have loaded yet, so
  // correctness comes from `state` plus the frontend's `GetStatus` on mount,
  // which is why `handle_action_error` clearing `state.path` matters
  if let Some(path) = state.path.clone() {
    if std::path::Path::new(&path).is_file() {
      static_sound_id += 1;
      pending_static_data = None;
      let _ = loader_tx.send((static_sound_id, path.clone()));

      match load_streaming_data(path) {
        Ok(new_sound_data) => {
          match audio_manager.play(new_sound_data.with_settings(StreamingSoundSettings {
            loop_region: if state.is_looping {
              Some(Region::from(0.0..))
            } else {
              None
            },
            volume: Value::from(Decibels::from(state.volume)),
            start_position: PlaybackPosition::Seconds(state.position),
            ..Default::default()
          })) {
            Ok(mut new_handle) => {
              new_handle.pause(TWEEN);
              audio_handle = CurrentHandle::Streaming(new_handle);
            }
            Err(_) => handle_action_error(
              &app_handle,
              &mut state,
              Error::Audio("failed to play sound via stream".to_string()),
            ),
          }
        }
        Err(e) => handle_action_error(
          &app_handle,
          &mut state,
          Error::Audio(format!("failed to create streaming sound data: {}", e)),
        ),
      }
    } else {
      // the persisted file has since been moved or deleted; clear it for the
      // same reason as above, so `GetStatus` doesn't report a track that isn't
      // there. matches the `StreamAction::Play` branch's wording
      handle_action_error(
        &app_handle,
        &mut state,
        Error::Audio("File does not exist".to_string()),
      );
    }
  }

  // main event loop
  while let Some(event) = event_rx.blocking_recv() {
    match event {
      InternalEvent::Command(action, response_tx) => {
        match action {
          StreamAction::Play(path) => {
            // stop previous track
            audio_handle.stop();

            // increment static sound id to load new static sound data
            // without dealing with race conditions
            static_sound_id += 1;
            // reset existing static sound data to prepare for new load
            pending_static_data = None;

            // trigger static sound data loader
            if loader_tx.send((static_sound_id, path.clone())).is_err() {
              handle_action_error(
                &app_handle,
                &mut state,
                Error::Audio("failed to send load finished event".to_string()),
              );
              let _ = response_tx.send(state.clone());
              continue;
            }

            // check if file exists/is valid
            if !std::path::Path::new(&path).is_file() {
              handle_action_error(
                &app_handle,
                &mut state,
                Error::Audio("File does not exist".to_string()),
              );
              let _ = response_tx.send(state.clone());
              continue;
            }

            let new_sound_data = match load_streaming_data(path.clone()) {
              Ok(data) => data,
              Err(_) => {
                handle_action_error(
                  &app_handle,
                  &mut state,
                  Error::Audio(
                    "Failed to load file. Please ensure it is well-formed and readable".to_string(),
                  ),
                );
                let _ = response_tx.send(state.clone());
                continue;
              }
            };
            let duration = new_sound_data.duration().as_secs_f64();
            let new_handle = match audio_manager.play(new_sound_data) {
              Ok(handle) => handle,
              Err(_) => {
                handle_action_error(
                  &app_handle,
                  &mut state,
                  Error::Audio("failed to play streaming sound".to_string()),
                );
                let _ = response_tx.send(state.clone());
                continue;
              }
            };

            // set to streaming sound handle for instant playback
            audio_handle = CurrentHandle::Streaming(new_handle);

            audio_handle.set_loop(state.is_looping);
            audio_handle.set_volume(state.volume, state.is_muted);

            state.duration = duration;
            state.is_playing = true;
            state.path = Some(path.clone());
            state.position = 0.0;

            let _ = response_tx.send(state.clone());
          }
          StreamAction::SetLoop(should_loop) => {
            audio_handle.set_loop(should_loop);

            state.is_looping = should_loop;

            let _ = response_tx.send(state.clone());
          }
          StreamAction::Pause => {
            audio_handle.pause();

            state.is_playing = false;
            state.position = audio_handle.position();

            let _ = response_tx.send(state.clone());
          }
          StreamAction::Resume => {
            audio_handle.resume();

            state.is_playing = true;

            let _ = response_tx.send(state.clone());
          }
          StreamAction::Seek(to) => {
            if let Some(static_data) = pending_static_data.as_ref() {
              match audio_handle {
                CurrentHandle::None => {}
                CurrentHandle::Streaming(ref mut streaming_sound_handle) => {
                  // stop streaming sound
                  streaming_sound_handle.stop(TWEEN);

                  let volume = if state.is_muted { -60.0 } else { state.volume };

                  // swap to static sound data
                  let mut new_handle: StaticSoundHandle =
                    match audio_manager.play(static_data.clone().volume(volume)) {
                      Ok(handle) => handle,
                      Err(_) => {
                        handle_action_error(
                          &app_handle,
                          &mut state,
                          Error::Audio("failed to play static sound".to_string()),
                        );
                        let _ = response_tx.send(state.clone());
                        continue;
                      }
                    };

                  new_handle.seek_to(to);
                  if !state.is_playing {
                    new_handle.pause(TWEEN);
                  }

                  // retain looping state
                  if state.is_looping {
                    new_handle.set_loop_region(0.0..);
                  }

                  // swap to static sound handle
                  audio_handle = CurrentHandle::Static(new_handle);
                }
                CurrentHandle::Static(ref mut static_sound_handle) => {
                  static_sound_handle.seek_to(to);
                }
              };
            }

            audio_handle.seek_to(to);

            state.position = to;

            let _ = response_tx.send(state.clone());
          }
          StreamAction::SetVolume(volume) => {
            audio_handle.set_volume(volume, state.is_muted);

            state.volume = volume;
            let _ = response_tx.send(state.clone());
          }
          StreamAction::ToggleMute => {
            state.is_muted = !state.is_muted;

            audio_handle.set_volume(state.volume, state.is_muted);

            let _ = response_tx.send(state.clone());
          }
          StreamAction::Reset => {
            audio_handle.stop();
            state.path = None;
            state.duration = 0.0;
            state.position = 0.0;
            state.is_playing = false;

            let _ = response_tx.send(state.clone());
          }
          StreamAction::SetOutputDevice(device_name) => {
            match switch_output_device(
              &mut audio_manager,
              &mut audio_handle,
              device_name.as_deref(),
              &mut state,
              &loader_tx,
              &mut static_sound_id,
            ) {
              Ok(used_custom_device) => using_custom_device = used_custom_device,
              Err(e) => emit_error(app_handle.clone(), e),
            }

            let _ = response_tx.send(state.clone());
          }
          StreamAction::GetStatus => {
            let _ = response_tx.send(state.clone());
          }
        }
      }
      InternalEvent::LoadFinished { id, data } => {
        // validate static sound id before updating pending static data
        if id == static_sound_id {
          pending_static_data = data;
        }
      }
      InternalEvent::CheckDeviceHealth => {
        if using_custom_device {
          let mut lost_device = false;
          while let Some(err) = audio_manager.backend_mut().pop_error() {
            if matches!(
              err,
              StreamError::DeviceNotAvailable | StreamError::StreamInvalidated
            ) {
              lost_device = true;
            }
          }

          if lost_device {
            using_custom_device = false;
            state.output_device = None;
            log::warn!("output device disconnected, reverted to system default");
            let _ = app_handle.emit("output-device-fallback", ());
          }
        }
      }
    }
  }

  log::info!("audio thread exiting");
  Ok(())
}

fn handle_action_error(
  app_handle: &AppHandle<tauri::Wry>,
  status: &mut StreamStatus,
  error: Error,
) {
  emit_error(app_handle.clone(), error);

  status.is_playing = false;
  status.path = None;
  status.duration = 0.0;
  status.position = 0.0;
}

fn load_streaming_data(path: String) -> Result<StreamingSoundData<FromFileError>> {
  let (tx, rx) = std::sync::mpsc::channel();

  std::thread::spawn(move || {
    let res = StreamingSoundData::from_file(&path);

    let _ = tx.send(res);
  });

  match rx.recv_timeout(Duration::from_secs(3)) {
    Ok(res) => match res {
      Ok(data) => Ok(data),
      Err(err) => match err {
        FromFileError::NoDefaultTrack => Err(Error::Audio("No default track".to_string())),
        FromFileError::UnknownSampleRate => Err(Error::Audio("Unknown sample rate".to_string())),
        FromFileError::UnknownDuration => Err(Error::Audio("Unknown duration".to_string())),
        FromFileError::UnsupportedChannelConfiguration => Err(Error::Audio(
          "Unsupported channel configuration".to_string(),
        )),
        FromFileError::IoError(error) => Err(Error::Audio(format!("IO error: {}", error))),
        FromFileError::SymphoniaError(error) => {
          Err(Error::Audio(format!("Symphonia error: {}", error)))
        }
      },
    },
    Err(err) => match err {
      std::sync::mpsc::RecvTimeoutError::Timeout => {
        Err(Error::Audio("Stream decode timed out".to_string()))
      }
      std::sync::mpsc::RecvTimeoutError::Disconnected => Err(Error::Audio(
        "Stream decode worker disconnected".to_string(),
      )),
    },
  }
}
