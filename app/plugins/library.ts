import { listen } from '@tauri-apps/api/event'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: () => {
    void listen(LIBRARY_FOLDERS_CHANGED_EVENT, () => {
      refreshLibraryFolders()
    })
  },
})
