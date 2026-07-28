<script lang="ts" setup>
const router = useRouter()
const tauri = useTauri()

onBeforeMount(async () => {
  const lastUrl = await tauri.store.get<string>('last-url')

  if (lastUrl) router.push(lastUrl)

  router.afterEach((to) => {
    if (to.fullPath === '/playground') return

    tauri.store.set('last-url', to.fullPath)
  })
})

const { handlePanelSizeChange } = useLayout()
const settings = useSettings()

const visiblePanels = computed(() => {
  const panels: LayoutPanelKey[] = []
  if (settings.layout.panel.left.elements.length) panels.push('left')
  if (settings.layout.panel.main.elements.length) panels.push('main')
  if (settings.layout.panel.right.elements.length) panels.push('right')
  return panels
})
</script>

<template>
  <NuxtLayout name="default">
    <div class="flex flex-col h-screen">
      <LayoutTopBar v-if="settings.layout.panel.top.elements.length" />
      <SplitterGroup
        :key="visiblePanels.join('-')"
        direction="horizontal"
        class="flex flex-1 size-full"
        @layout="(sizes) => handlePanelSizeChange(['left', 'main', 'right'], sizes)"
      >
        <template v-if="settings.layout.panel.left.elements.length">
          <SplitterPanel
            v-if="settings.layout.panel.left.elements.length"
            key="left"
            :max-size="35"
            :min-size="12.5"
            class="border-r flex shrink-0 flex-col"
            :default-size="settings.layout.panel.left.size"
          >
            <LayoutSidebarLeft />
          </SplitterPanel>
          <SplitterResizeHandle :disabled="!settings.layout.allowResizing" />
        </template>
        <SplitterPanel
          v-if="settings.layout.panel.main.elements.length"
          key="main"
          class="flex flex-1 flex-col h-full"
          :default-size="settings.layout.panel.main.size"
        >
          <slot />
        </SplitterPanel>
        <template v-if="settings.layout.panel.right.elements.length">
          <SplitterResizeHandle :disabled="!settings.layout.allowResizing" />
          <SplitterPanel
            key="right"
            :max-size="35"
            :min-size="12.5"
            :default-size="settings.layout.panel.right.size"
            class="border-l shrink-0"
          >
            <LayoutSidebarRight />
          </SplitterPanel>
        </template>
      </SplitterGroup>
      <LayoutBottomBar v-if="settings.layout.panel.bottom.elements.length" />
      <!-- <LayoutStatusBar /> -->
    </div>
  </NuxtLayout>
</template>
