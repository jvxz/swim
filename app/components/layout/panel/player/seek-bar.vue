<script lang="ts" setup>
type ClassAttributeOptions = 'container' | 'thumb'

withDefaults(
  defineProps<{
    classes?: Partial<Record<ClassAttributeOptions, string>>
    showDuration?: 'top-right' | 'top-left' | 'both-sides' | false
  }>(),
  {
    showDuration: 'both-sides',
  },
)

const { hasPendingDownload, isAwaitingDownload, playbackStatus, seekCurrentTrack } = usePlayback()

const isChangingPosition = shallowRef(false)
const localPosition = shallowRef([playbackStatus.value?.position ?? 0])

watch(
  () => playbackStatus.value?.position,
  (pos) => {
    if (isChangingPosition.value || pos === undefined) return
    localPosition.value = [pos]
  },
)

function handlePointer(type: 'up' | 'down') {
  if (type === 'up') {
    isChangingPosition.value = false

    const [to] = localPosition.value
    if (to === undefined) return

    seekCurrentTrack(to)
  } else isChangingPosition.value = true
}

// a placeholder's duration isn't known until the file is on disk, and the
// reported position still belongs to the previous track — so show neither
const computedDuration = computed(() =>
  hasPendingDownload.value ? '-:--' : formatDuration(playbackStatus.value?.duration ?? 0, 's'),
)
const computedPosition = computed(() =>
  hasPendingDownload.value ? '-:--' : formatDuration(playbackStatus.value?.position ?? 0, 's'),
)
</script>

<template>
  <div
    :class="
      cn(
        'relative flex w-[45%] grow -translate-y-3 flex-col items-center gap-1 *:shrink-0',
        classes?.container,
      )
    "
  >
    <p
      v-if="showDuration && ['top-right', 'top-left'].includes(showDuration)"
      :class="
        cn(
          'absolute right-0 bottom-0 text-xs text-muted-foreground',
          showDuration === 'top-right' ? 'right-0' : 'left-0',
        )
      "
    >
      {{ computedPosition }} / {{ computedDuration }}
    </p>
    <div class="flex gap-4 w-full items-center">
      <!-- width is reserved rather than fitted, so swapping a real timestamp
           for the placeholder can't nudge the bar -->
      <p
        v-if="showDuration === 'both-sides'"
        class="text-xs text-muted-foreground text-right min-w-[5ch] tabular-nums"
      >
        {{ computedPosition }}
      </p>
      <!-- nothing to seek through until the file lands: the channel keeps its
           geometry but carries the download instead of a playhead -->
      <div
        v-if="hasPendingDownload"
        class="flex grow h-4 w-full relative"
        role="progressbar"
        :aria-label="isAwaitingDownload ? 'Downloading track' : 'Download paused'"
      >
        <div class="bg-muted h-2 w-full top-1/2 absolute overflow-hidden -translate-y-1/2">
          <div
            :class="
              isAwaitingDownload
                ? 'animate-seek-sweep bg-primary/40 h-full'
                : 'bg-muted-foreground/15 h-full w-full'
            "
          />
        </div>
      </div>
      <SliderRoot
        v-else
        v-model:model-value="localPosition"
        :max="playbackStatus?.duration ?? 0"
        class="flex grow h-4 w-full relative"
        :step="0.01"
        @pointerdown="handlePointer('down')"
        @pointerup="handlePointer('up')"
      >
        <SliderTrack class="bg-muted grow h-2 w-full top-1/2 absolute -translate-y-1/2">
          <SliderRange class="bg-primary/25 h-2 top-1/2 absolute -translate-y-1/2" />
        </SliderTrack>
        <SliderThumb
          :class="
            cn(
              'absolute top-1/2 h-2 w-4 -translate-y-1/2 bg-primary outline-none focus-visible:ring-0',
              classes?.thumb,
            )
          "
          @pointerdown="handlePointer('down')"
          @pointerup="handlePointer('up')"
        />
      </SliderRoot>
      <p
        v-if="showDuration === 'both-sides'"
        class="text-xs text-muted-foreground text-left min-w-[5ch] tabular-nums"
      >
        {{ computedDuration }}
      </p>
    </div>
  </div>
</template>
