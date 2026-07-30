<script lang="ts" setup>
import type { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

let unlisten: UnlistenFn | undefined
onMounted(async () => {
  const window = getCurrentWebviewWindow()
  if (HOT_LOADED_WINDOWS.includes(window.label)) {
    unlisten = await window.onCloseRequested((e) => {
      e.preventDefault()
      window.hide()
    })
  } else window.show()
})

onUnmounted(() => unlisten?.())
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ModalItemSearch />
  <ModalSmartPlaylistEditor />
  <DevOnly>
    <DebugDetails />
  </DevOnly>
</template>
