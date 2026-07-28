import { invoke } from '@tauri-apps/api/core'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    // provide the invoke function to the window object
    // for e2e tests to use
    ;(window as any).__TAURI_INVOKE__ = invoke
  },
})
