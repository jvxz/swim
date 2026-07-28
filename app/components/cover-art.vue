<script lang="ts" setup>
import type { ImgHTMLAttributes } from 'vue'

type ClassAttributeNames = 'img' | 'noCoverText' | 'root'

const props = defineProps<{
  noCoverText?: string
  classes?: Partial<Record<ClassAttributeNames, string | string[]>>
  img?: ImgHTMLAttributes
  track?: TrackListEntry | null
}>()

const { currentTrack } = usePlayback()
const track = computed(() => props.track ?? currentTrack.value)
</script>

<template>
  <div
    :class="cn('flex size-full items-center justify-center overflow-hidden', props.classes?.root)"
  >
    <img
      v-if="track && track.tags.APIC"
      v-bind="img"
      :src="track?.full_uri"
      :class="cn('h-full object-contain', props.classes?.img)"
    />
    <div
      v-else
      :class="
        cn(
          'grid aspect-square size-full place-items-center text-sm text-muted-foreground',
          props.classes?.noCoverText,
        )
      "
    >
      {{ noCoverText ?? 'no cover' }}
    </div>
  </div>
</template>
