<script lang="ts" setup>
const { currentTrack } = usePlayback()

const { createSettingsWindow } = useSettingsWindow()
const { startDrag } = useDrag()

async function handleDragStart() {
  if (!currentTrack.value) return

  await startDrag(
    {
      data: {
        entries: [currentTrack.value],
      },
      key: 'track-list-entry',
    },
    {
      item: [currentTrack.value.path],
    },
  )
}
</script>

<template>
  <LayoutPanelLayout class="flex flex-row gap-4 items-center justify-between">
    <div class="flex flex-1 h-full items-center">
      <div class="flex gap-4 h-full items-start">
        <LayoutPanelCoverArt
          v-if="$settings.layout.element.player.showTrackCover"
          :key="$settings.layout.element.player.titlePosition"
          no-cover-text=""
          :classes="{
            noCoverText: 'border border-dashed border-primary',
            img: $settings.layout.element.player.roundTrackCover ? 'rounded' : '',
            root: 'aspect-square shrink-0 h-full flex w-fit',
          }"
          @dragstart="handleDragStart"
        />
        <LayoutPanelPlayerTitle
          v-if="$settings.layout.element.player.titlePosition === 'left'"
          :current-track
        />
      </div>
      <LayoutPanelPlayerControls
        v-if="$settings.layout.element.player.controlsPosition === 'left'"
        class="mx-auto"
      />
    </div>

    <div class="flex shrink-0 flex-col gap-4 w-[45%] items-center justify-center">
      <LayoutPanelPlayerTitle
        v-if="$settings.layout.element.player.titlePosition === 'center'"
        :current-track
      />
      <LayoutPanelPlayerControls
        v-if="$settings.layout.element.player.controlsPosition === 'center'"
        class="mx-auto"
      />
      <LayoutPanelPlayerSeekBar
        show-duration="both-sides"
        :show-title="false"
        :classes="{
          container: 'w-full h-fit grow-0 translate-y-0',
          thumb: 'size-4 rounded-full',
        }"
      />
    </div>
    <div class="flex flex-1 gap-4 justify-end">
      <LayoutPanelPlayerVolume class="translate-y-0" />
      <div class="flex gap-2 items-center">
        <UButton
          variant="ghost"
          size="icon"
          @click="createSettingsWindow()"
        >
          <Icon
            name="tabler:settings"
            class="size-4!"
          />
        </UButton>
      </div>
    </div>
  </LayoutPanelLayout>
</template>
