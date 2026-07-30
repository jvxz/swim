import { emit } from '@tauri-apps/api/event'

export interface ScanProgress {
  label: string
  current: number
  total: number
}

export const SCAN_PROGRESS_CHANGED_EVENT = 'scan-progress-changed'

/** Shared across windows: app/plugins/scan-progress.ts relays the emitted event into this
 * state in every window, since a scan started from Settings should update the main window's
 * status bar too. */
export function useScanProgress() {
  return useState<ScanProgress | null>('scan-progress', () => null)
}

/** Only emits - app/plugins/scan-progress.ts is the single place that writes to the shared
 * state, in every window including the sender, so there's one update path instead of two. */
export async function reportScanProgress(progress: ScanProgress | null) {
  await emit(SCAN_PROGRESS_CHANGED_EVENT, progress)
}
