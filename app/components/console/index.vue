<script lang="ts" setup>
import type { Error } from '~/types/tauri-bindings'

const consoleStore = useConsole()

const sourceColorMap: Record<Error['type'], string> = {
  Audio: 'text-primary',
  Backend: 'text-blue-500',
  FileSystem: 'text-yellow-500',
  Id3: 'text-green-500',
  LastFm: 'text-red-500',
  Other: 'text-muted-foreground',
  Sql: 'text-pink-500',
  Store: 'text-teal-500',
  Stronghold: 'text-indigo-500',
  Waveform: 'text-red-500',
}

const container = useTemplateRef<HTMLDivElement>('container')
let pinnedToBottom = true
watch(
  () => consoleStore.consoleMessages.length,
  async () => {
    const containerEl = unrefElement(container)
    if (!containerEl) return

    await nextTick()

    const lastChild = containerEl.lastElementChild
    if (!lastChild) return

    if (pinnedToBottom) lastChild.scrollIntoView({ block: 'start' })
  },
)

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  pinnedToBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 10
}
</script>

<template>
  <LayoutPanelLayout
    ref="container"
    class="text-sm p-2 flex size-full"
    @scroll.passive="handleScroll"
  >
    <div
      v-for="message in consoleStore.consoleMessages"
      :key="message.timestamp"
      class="shrink-0 *:pr-1.5 *:select-auto"
    >
      <span
        class="text-muted-foreground"
        :class="{
          'font-mono': $settings.layout.element.console.timestampMono,
        }"
      >
        {{
          $dayjs(message.timestamp).format(
            $settings.layout.element.console.timestamp24Hr ? 'HH:mm' : 'hh:mm',
          )
        }}
      </span>
      <span
        v-if="message.source"
        class="font-medium"
        :class="[
          sourceColorMap[message.source],
          {
            'font-mono': $settings.layout.element.console.messageMono,
          },
        ]"
      >
        {{ message.source }}
      </span>
      <span
        :class="{
          'font-mono': $settings.layout.element.console.messageMono,
          'text-nowrap': !$settings.layout.element.console.wrapText,
        }"
      >
        {{ message.text }}
      </span>
    </div>
  </LayoutPanelLayout>
</template>
