<script lang="ts" setup>
import { dirname } from '@tauri-apps/api/path'
import { confirm } from '@tauri-apps/plugin-dialog'
import { revealItemInDir } from '@tauri-apps/plugin-opener'

const { entries } = defineProps<{
  entries: TrackListEntry[] | null
}>()

const { addToPlaylist, playlists, removeFromPlaylist } = useUserPlaylists()
const trackListInput = useTrackListInput()
const { updatePlayCount } = usePlayCount()
const { lastFmProfile, lastFmProfilePending } = useLastFm()

async function handleReveal() {
  if (!entries) return

  let confirmation = true
  if (entries.length >= 5) {
    confirmation = await confirm(`You are attempting to reveal ${entries.length} items. Continue?`)
    if (!confirmation) return
  }

  revealItemInDir(entries.map((entry) => entry.path))
}

async function handleRemove() {
  if (!entries) return

  if (entries.some((entry) => !entry.is_playlist_track)) {
    return emitError({
      data: 'Attempted to remove non-playlist tracks from a playlist',
      type: 'Other',
    })
  }

  let confirmation = true
  if (entries.length >= 5) {
    confirmation = await confirm(`You are attempting to remove ${entries.length} items. Continue?`)
    if (!confirmation) return
  }

  await removeFromPlaylist(entries.filter((entry) => entry.is_playlist_track))
}

async function handleViewContainingFolder() {
  if (!entries || !entries[0]) return

  navigateTo({
    name: 'folder-path',
    params: {
      path: await dirname(entries[0].path),
    },
  })
}
</script>

<template>
  <UContextMenuContent
    v-if="entries"
    class="w-52"
  >
    <UContextMenuSub>
      <UContextMenuSubTrigger> Add to playlist </UContextMenuSubTrigger>
      <UContextMenuSubContent>
        <UContextMenuItem
          v-for="playlist in playlists"
          :key="playlist.id"
          :disabled="entries.some((e) => !e.valid)"
          @click="() => addToPlaylist(playlist.id, entries)"
        >
          {{ playlist.name }}
        </UContextMenuItem>
      </UContextMenuSubContent>
    </UContextMenuSub>
    <UContextMenuItem
      v-if="trackListInput.type === 'playlist'"
      @click="handleRemove"
    >
      Remove from playlist
    </UContextMenuItem>
    <UContextMenuItem @click="handleReveal"> Reveal in file explorer </UContextMenuItem>
    <UContextMenuItem
      :disabled="entries.length !== 1"
      @click="handleViewContainingFolder"
    >
      View containing folder
    </UContextMenuItem>
    <UContextMenuSub>
      <UContextMenuSubTrigger :disabled="!lastFmProfile || lastFmProfilePending">
        Last.fm
      </UContextMenuSubTrigger>
      <UContextMenuSubContent>
        <UContextMenuItem @click="updatePlayCount(entries, true)">
          Force update play count
        </UContextMenuItem>
      </UContextMenuSubContent>
    </UContextMenuSub>
  </UContextMenuContent>
</template>
