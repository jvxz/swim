<script lang="ts" setup>
defineProps<{
  entry: TrackListEntry
  isSelected: boolean
  isPlaying: boolean
  isEven: boolean
  isUpdatingPlayCount: boolean
  columns: TrackListColumn[]
}>()

const emits = defineEmits<{
  playTrack: [track: TrackListEntry]
  rowDragStart: [e: DragEvent]
  textDragStart: [e: DragEvent]
}>()

const classes = 'flex items-center'

function getCellContent(entry: TrackListEntry, frame: Id3FrameId | undefined) {
  if (frame === 'TIT2') {
    if (entry.valid) return entry.tags[frame] ?? entry.name

    return entry.path
  }

  if (entry.valid && frame) return entry.tags[frame]

  return ''
}
</script>

<template>
  <div
    class="grid col-span-full grid-cols-subgrid group-data-[row-style=bordered]:not-last:border-b group-data-[row-style=alternating]:data-[is-even]:bg-muted/25 group-data-[row-style=bordered]:not-last:gap-0"
    :class="{
      'border-transparent bg-primary/25!': isSelected,
      'bg-danger/20': !entry.valid,
    }"
    v-bind="$attrs"
    :data-is-even="isEven ? '' : undefined"
    @dblclick.left="emits('playTrack', entry)"
    @dragstart="emits('rowDragStart', $event)"
  >
    <template
      v-for="col in columns"
      :key="col.key"
    >
      <!-- cover column -->
      <template v-if="col.key === 'APIC'">
        <div
          v-if="entry.download_status && entry.download_status !== 'Local'"
          class="mx-auto justify-center"
          :class="classes"
          @dragstart="emits('textDragStart', $event)"
        >
          <DownloadIndicator :entry="entry" />
        </div>
        <div
          v-else-if="!entry.valid || !entry.tags.APIC"
          class="mx-auto justify-center"
          :class="classes"
          @dragstart="emits('textDragStart', $event)"
        >
          {{ PLACEHOLDER_CHAR }}
        </div>
        <img
          v-else
          :src="entry.thumbnail_uri"
          :alt="entry.name"
          :width="TRACK_LIST_ITEM_HEIGHT"
          :height="TRACK_LIST_ITEM_HEIGHT"
          class="mx-auto h-full"
          @dragstart="emits('textDragStart', $event)"
        />
      </template>
      <!-- TYER column -->
      <p
        v-else-if="col.key === 'TYER'"
        :class="classes"
        class="text-sm px-1 truncate"
        :title="getTrackYear(entry, $settings.layout.element.trackList.deriveYearFromTDRC)"
        @dragstart="emits('textDragStart', $event)"
      >
        {{ getTrackYear(entry, $settings.layout.element.trackList.deriveYearFromTDRC) }}
      </p>
      <!-- playing column -->
      <div
        v-else-if="col.key === 'CURRENTLY_PLAYING'"
        :class="classes"
        class="justify-center"
        @dragstart="emits('textDragStart', $event)"
      >
        <Icon
          v-if="isPlaying"
          name="tabler:player-play-filled"
          class="size-3!"
        />
      </div>
      <!-- duration column -->
      <div
        v-else-if="col.key === 'DURATION'"
        :class="classes"
        class="text-sm px-1 truncate duration-150"
        @dragstart="emits('textDragStart', $event)"
      >
        {{ formatDuration(entry.duration, 'seconds') }}
      </div>
      <!-- play count column -->
      <div
        v-else-if="col.key === 'PLAY_COUNT'"
        :class="[
          classes,
          {
            'font-medium': entry.play_count === -1,
            'animate-pulse': isUpdatingPlayCount,
          },
        ]"
        class="text-sm px-1 truncate duration-150"
        @dragstart="emits('textDragStart', $event)"
      >
        {{ entry.play_count === -1 ? PLACEHOLDER_CHAR : entry.play_count }}
      </div>
      <!-- date added / last played columns -->
      <p
        v-else-if="col.key === 'DATE_ADDED' || col.key === 'LAST_PLAYED'"
        :class="classes"
        class="text-sm px-1 truncate"
        :title="formatTrackDate(col.key === 'DATE_ADDED' ? entry.date_added : entry.last_played)"
        @dragstart="emits('textDragStart', $event)"
      >
        {{ formatTrackDate(col.key === 'DATE_ADDED' ? entry.date_added : entry.last_played) }}
      </p>
      <!-- other columns -->
      <p
        v-else
        :class="classes"
        class="text-sm px-1 truncate"
        :title="getCellContent(entry, col.id3)"
        @dragstart="emits('textDragStart', $event)"
      >
        {{ getCellContent(entry, col.id3) }}
      </p>
    </template>
  </div>
</template>
