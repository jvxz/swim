import { listen } from '@tauri-apps/api/event'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    void listen<ScanProgress | null>(SCAN_PROGRESS_CHANGED_EVENT, (event) => {
      useScanProgress().value = event.payload
    })
  },
})
