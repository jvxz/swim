<script lang="ts" setup>
import type { SplitterPanelEmits, SplitterPanelProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'

const props = withDefaults(
  defineProps<
    {
      element: LayoutElementKey
      asSplitterPanel?: boolean
      withResizeHandle?: boolean
    } & SplitterPanelProps
  >(),
  {
    asSplitterPanel: true,
    minSize: 7.5,
  },
)

const emits = defineEmits<SplitterPanelEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const [DefinePanels, ReusePanels] = createReusableTemplate()

const settings = useSettings()
</script>

<template>
  <DefinePanels>
    <LayoutPanelPlayer v-if="element === 'player'" />
    <LayoutPanelCoverArt v-if="element === 'coverArt'" />
    <LayoutPanelConsole v-if="element === 'console'" />
    <LayoutPanelMetadata v-if="element === 'metadataView'" />
    <LayoutPanelLibrary v-if="element === 'libraryView'" />
  </DefinePanels>

  <template v-if="asSplitterPanel">
    <SplitterPanel
      v-bind="forwarded"
      class="flex flex-1 flex-col h-full"
    >
      <ReusePanels />
    </SplitterPanel>
    <SplitterResizeHandle
      v-if="withResizeHandle"
      :disabled="!settings.layout.allowResizing"
      class="bg-border data-[orientation=horizontal]:h-full data-[orientation=horizontal]:w-px data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full"
    />
  </template>
  <template v-else>
    <ReusePanels />
  </template>
</template>
