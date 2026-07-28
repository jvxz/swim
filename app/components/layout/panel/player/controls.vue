<script lang="ts" setup>
const props = defineProps<{
  class?: string
}>()

const { hasNextTrack, hasPreviousTrack, playbackStatus, playPauseCurrentTrack, skipTrack } =
  usePlayback()
</script>

<template>
  <div :class="cn('flex items-center justify-center gap-3', props.class)">
    <!-- shuffle -->
    <LayoutPanelPlayerButton>
      <Icon
        name="tabler:arrows-shuffle"
        class="size-5!"
      />
    </LayoutPanelPlayerButton>
    <!-- skip back -->
    <LayoutPanelPlayerButton
      :disabled="!hasPreviousTrack"
      aria-label="Previous track"
      @click="skipTrack(-1)"
    >
      <Icon
        name="tabler:player-skip-back-filled"
        class="size-5!"
      />
    </LayoutPanelPlayerButton>
    <!-- play/pause -->
    <LayoutPanelPlayerButton
      variant="main"
      @click="playPauseCurrentTrack()"
    >
      <Icon
        :name="
          playbackStatus?.is_playing ? 'tabler:player-pause-filled' : 'tabler:player-play-filled'
        "
        class="text-background size-6!"
      />
    </LayoutPanelPlayerButton>
    <!-- skip forward -->
    <LayoutPanelPlayerButton
      :disabled="!hasNextTrack"
      aria-label="Next track"
      @click="skipTrack(1)"
    >
      <Icon
        name="tabler:player-skip-forward-filled"
        class="size-5!"
      />
    </LayoutPanelPlayerButton>
    <!-- repeat -->
    <LayoutPanelPlayerButton>
      <Icon
        name="tabler:repeat"
        class="size-5!"
      />
    </LayoutPanelPlayerButton>
  </div>
</template>
