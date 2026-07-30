<script lang="ts" setup>
const props = defineProps<{
  class?: string
}>()

const {
  hasNextTrack,
  hasPreviousTrack,
  isAwaitingDownload,
  isShuffled,
  playbackStatus,
  playPauseCurrentTrack,
  skipTrack,
  toggleShuffle,
} = usePlayback()

// a track waiting on its download is on its way to playing, so the button
// offers the same thing it would mid-playback: stop it from continuing
const isPlaying = computed(() => isAwaitingDownload.value || !!playbackStatus.value?.is_playing)
</script>

<template>
  <div :class="cn('flex items-center justify-center gap-3', props.class)">
    <!-- shuffle -->
    <LayoutPanelPlayerButton
      :aria-pressed="isShuffled"
      aria-label="Shuffle"
      @click="toggleShuffle()"
    >
      <Icon
        name="tabler:arrows-shuffle"
        :class="cn('size-5!', isShuffled && 'text-primary')"
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
        :name="isPlaying ? 'tabler:player-pause-filled' : 'tabler:player-play-filled'"
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
