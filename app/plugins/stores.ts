import { join } from '@tauri-apps/api/path'
import { createPlugin, getStoreCollectionPath } from '@tauri-store/pinia'
import type { Pinia } from 'pinia'

export default defineNuxtPlugin({
  name: 'stores',
  setup: async ({ $pinia }) => {
    ;($pinia as Pinia).use(createPlugin())

    await cleanupConsoleFiles()

    const stores = [useSettings, useConsole]
    for (const store of stores) {
      const instance = store()
      await instance.$tauri.start()
    }
  },
})

async function cleanupConsoleFiles() {
  const storeCollectionPath = await getStoreCollectionPath()
  await useTauriFsRemove(await join(storeCollectionPath, 'console.json')).catch(() => {})
  await useTauriFsRemove(await join(storeCollectionPath, 'console.dev.json')).catch(() => {})
}
