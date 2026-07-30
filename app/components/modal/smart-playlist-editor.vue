<script lang="ts" setup>
const { editingPlaylistId, isOpen } = useSmartPlaylistEditor()
const { renamePlaylist } = useUserPlaylists()
const { createSmartPlaylist, parseSmartPlaylistRules, updateSmartPlaylistRules } =
  useSmartPlaylists()

const name = shallowRef('New smart playlist')
const match = shallowRef<'all' | 'any'>('all')
const rules = ref<SmartPlaylistRule[]>([])

// guards against a slow load for one playlist landing after the dialog has
// already been reopened for another (or closed and reopened for "new")
let loadToken = 0

watch(isOpen, async (open) => {
  if (!open) return

  const token = ++loadToken
  const playlistId = editingPlaylistId.value

  if (playlistId === null) {
    name.value = 'New smart playlist'
    match.value = 'all'
    rules.value = []
    return
  }

  const playlist = await $db()
    .selectFrom('playlists')
    .where('id', '=', playlistId)
    .select(['name', 'rules'])
    .executeTakeFirst()

  if (!playlist || token !== loadToken) return

  const group = parseSmartPlaylistRules(playlist.rules)
  name.value = playlist.name
  match.value = group.match
  rules.value = group.items.filter((item) => item.type === 'rule')
})

function addRule() {
  rules.value = [...rules.value, createEmptySmartPlaylistRule()]
}

function removeRule(index: number) {
  rules.value = rules.value.filter((_, i) => i !== index)
}

async function save() {
  const group: SmartPlaylistGroup = { items: rules.value, match: match.value, type: 'group' }

  if (editingPlaylistId.value === null) {
    await createSmartPlaylist({ name: name.value, rules: group })
  } else {
    await updateSmartPlaylistRules(editingPlaylistId.value, group)
    await renamePlaylist(editingPlaylistId.value, name.value)
  }

  isOpen.value = false
}
</script>

<template>
  <UDialogRoot v-model:open="isOpen">
    <UDialogScrollContent class="sm:max-w-2xl">
      <UDialogHeader>
        <UDialogTitle>
          {{ editingPlaylistId === null ? 'New smart playlist' : 'Edit smart playlist' }}
        </UDialogTitle>
      </UDialogHeader>

      <div class="flex flex-col gap-4">
        <FormPrimitive label="Name">
          <UInput v-model="name" />
        </FormPrimitive>

        <div class="text-sm flex gap-2 items-center">
          <span>Match</span>
          <USelectRoot v-model:model-value="match">
            <USelectTrigger class="w-24">
              <USelectValue>{{ match === 'all' ? 'all' : 'any' }}</USelectValue>
            </USelectTrigger>
            <USelectContent>
              <USelectItem value="all">
                <USelectItemText>all</USelectItemText>
              </USelectItem>
              <USelectItem value="any">
                <USelectItemText>any</USelectItemText>
              </USelectItem>
            </USelectContent>
          </USelectRoot>
          <span>of the following rules:</span>
        </div>

        <div class="flex flex-col gap-2">
          <SmartPlaylistRuleRow
            v-for="(_, index) in rules"
            :key="index"
            v-model="rules[index]!"
            @remove="removeRule(index)"
          />

          <p
            v-if="rules.length === 0"
            class="text-sm text-muted-foreground"
          >
            No rules yet — this playlist won't match any tracks.
          </p>
        </div>

        <UButton
          variant="outline"
          class="self-start"
          @click="addRule"
        >
          <Icon
            name="tabler:plus"
            class="size-3.5!"
          />
          Add rule
        </UButton>
      </div>

      <UDialogFooter>
        <UDialogClose as-child>
          <UButton variant="soft"> Cancel </UButton>
        </UDialogClose>
        <UButton
          :disabled="!name.trim()"
          @click="save"
        >
          Save
        </UButton>
      </UDialogFooter>
    </UDialogScrollContent>
  </UDialogRoot>
</template>
