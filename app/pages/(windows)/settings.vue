<script lang="ts" setup>
import type { VNode } from 'vue'

const { tab } = useSettingsWindow()

const components = Object.fromEntries(
  SETTINGS_WINDOW_TABS.map((t) => [
    t,
    defineAsyncComponent<VNode>(async () => {
      const filename = kebabCase(t)
      try {
        const component = await import(`~/components/window/settings/content/${filename}.vue`)
        return component
      } catch {
        return h('div', {
          innerHTML: `Please create ~/components/window/settings/content/${filename}.vue`,
        })
      }
    }),
  ]),
)
</script>

<template>
  <TabsRoot
    v-model:model-value="tab"
    orientation="vertical"
    class="flex size-full *:p-4"
  >
    <TabsList class="border-r flex shrink-0 flex-col gap-0.5 w-[225px] *:justify-start">
      <TabsTrigger
        v-for="tab in SETTINGS_WINDOW_TABS"
        :key="tab"
        :value="tab"
        as-child
      >
        <UButton
          variant="ghost"
          class="data-[state=active]:ghost-button-active w-full justify-start"
        >
          {{ tab === 'lastFm' ? 'Last.fm' : upperFirst(tab) }}
        </UButton>
      </TabsTrigger>
    </TabsList>
    <TabsContent
      v-for="tab in SETTINGS_WINDOW_TABS"
      :key="tab"
      :value="tab"
      class="w-full overflow-y-auto"
    >
      <component :is="components[tab]" />
    </TabsContent>
  </TabsRoot>
  <div class="p-4 border-t">
    <UButton
      disabled
      variant="soft"
    >
      Apply
    </UButton>
    <UButton variant="soft"> Close </UButton>
  </div>
</template>
