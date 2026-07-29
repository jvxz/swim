<script lang="ts" setup>
import { readFile } from '@tauri-apps/plugin-fs'

definePageMeta({ layout: 'main' })

type Strategy = 'metadata' | 'duration' | 'hash'

const { getLibraryTracks } = useLibrary()
const { playTrack } = usePlayback()

const strategy = ref<Strategy>('metadata')
const isScanning = ref(false)
const groups = shallowRef<DuplicateGroup[] | null>(null)

const dupeCount = computed(() =>
  (groups.value ?? []).reduce((total, group) => total + group.tracks.length, 0),
)

/** Hash file contents with bounded concurrency so a large library can't exhaust file handles. */
async function hashKeys(tracks: FileEntry[]) {
  const hash = await getHasher()
  const keys = new Map<string, string>()
  const BATCH = 8

  for (let i = 0; i < tracks.length; i += BATCH) {
    await Promise.all(
      tracks.slice(i, i + BATCH).map(async (track) => {
        try {
          keys.set(track.path, String(hash(await readFile(track.path))))
        } catch {
          // unreadable file → no key, excluded from grouping
        }
      }),
    )
  }

  return keys
}

async function scan() {
  isScanning.value = true
  try {
    const tracks = await getLibraryTracks()

    if (strategy.value === 'hash') {
      const keys = await hashKeys(tracks)
      groups.value = groupDuplicates(tracks, (track) => keys.get(track.path) ?? '')
    } else {
      groups.value = groupDuplicates(
        tracks,
        strategy.value === 'duration' ? durationKey : metadataKey,
      )
    }
  } finally {
    isScanning.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col h-full overflow-hidden">
    <div class="p-4 border-b flex shrink-0 flex-wrap gap-3 items-end">
      <FormSelect
        v-model="strategy"
        label="Match by"
        :values="['metadata', 'duration', 'hash']"
        :disabled="isScanning"
      />
      <UButton
        :is-loading="isScanning"
        @click="scan"
      >
        {{ isScanning ? 'Scanning…' : 'Find duplicates' }}
      </UButton>
      <p
        v-if="groups"
        class="text-sm text-muted-foreground"
      >
        {{ dupeCount }} {{ checkPlural(dupeCount, 'tracks') }} in {{ groups.length }}
        {{ checkPlural(groups.length, 'groups') }}
      </p>
    </div>

    <div class="p-4 flex flex-1 flex-col gap-4 overflow-y-auto">
      <p
        v-if="groups && !groups.length"
        class="text-sm text-muted-foreground"
      >
        No duplicates found.
      </p>

      <UCard
        v-for="group in groups"
        :key="group.key"
        class="gap-2"
      >
        <div
          v-for="track in group.tracks"
          :key="track.path"
          class="group/row flex gap-3 items-center"
        >
          <CoverArt
            :track
            no-cover-text="♪"
            class="rounded shrink-0 size-10"
          />
          <div class="flex flex-1 flex-col min-w-0">
            <span class="text-sm truncate">{{ getTrackTitle(track) }}</span>
            <span class="text-xs text-muted-foreground truncate">
              {{ track.tags.TPE1 ?? 'Unknown artist' }} · {{ track.path }}
            </span>
          </div>
          <span class="text-xs text-muted-foreground shrink-0 tabular-nums">
            {{ formatDuration(track.duration) }}
          </span>
          <UButton
            variant="ghost"
            size="icon"
            class="opacity-0 group-hover/row:opacity-100"
            @click="playTrack(track, group.tracks)"
          >
            <Icon
              name="tabler:player-play-filled"
              class="size-4"
            />
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
