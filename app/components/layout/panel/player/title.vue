<script lang="ts" setup>
const props = defineProps<{
  currentTrack: CurrentPlayingTrack | null
}>()

const { startDrag } = useDrag()

async function handleDragStart() {
  if (!props.currentTrack) return

  await startDrag(
    {
      data: {
        entries: [props.currentTrack],
      },
      key: 'track-list-entry',
    },
    {
      item: [props.currentTrack.path],
    },
  )
}

const [DefineMarquee, ReuseMarquee] = createReusableTemplate()
</script>

<template>
  <DefineMarquee v-slot="{ $slots }">
    <UMarquee
      v-if="$settings.layout.element.player.marqueeText"
      :key="currentTrack?.tags.TIT2 ?? currentTrack?.name"
      :title="currentTrack?.tags.TIT2 ?? currentTrack?.name"
      :animate-on-overflow-only="true"
      :delay="2"
      gap="0.5rem"
      :pause-on-hover="true"
      class="max-w-2xl w-fit!"
    >
      <component :is="$slots.default" />
    </UMarquee>
    <component
      :is="$slots.default"
      v-else
    />
  </DefineMarquee>

  <div
    :data-position="$settings.layout.element.player.titlePosition"
    class="group flex flex-col h-full cursor-default self-center justify-center data-[position=center]:h-9 data-[position=center]:items-center"
    draggable="true"
    @dragstart.prevent="handleDragStart"
  >
    <ReuseMarquee>
      <p
        :title="currentTrack?.tags.TIT2 ?? currentTrack?.name"
        class="font-medium truncate group-data-[position=center]:text-sm"
        :class="{
          'max-w-2xl': !$settings.layout.element.player.marqueeText,
        }"
      >
        {{ currentTrack?.tags.TIT2 ?? currentTrack?.name }}
      </p>
    </ReuseMarquee>
    <ReuseMarquee>
      <p
        :title="currentTrack?.tags.TPE1"
        class="text-sm text-muted-foreground truncate group-data-[position=center]:text-xs"
        :class="{
          'max-w-2xl': !$settings.layout.element.player.marqueeText,
        }"
      >
        {{ currentTrack?.tags.TPE1 }}
      </p>
    </ReuseMarquee>
  </div>
</template>
