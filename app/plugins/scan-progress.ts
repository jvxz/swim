import { listen } from '@tauri-apps/api/event'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    void listen<ScanProgressChangedPayload>(SCAN_PROGRESS_CHANGED_EVENT, (event) => {
      const state = useScanProgress()
      const { id, progress } = event.payload

      if (progress) {
        state.value = { ...state.value, [id]: progress }
        return
      }

      const { [id]: _removed, ...rest } = state.value
      state.value = rest
    })
  },
})
