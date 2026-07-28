<script lang="ts" setup>
import type { AcceptableValue } from 'reka-ui'

const open = ref(false)
const input = ref('')
const listBoxHighlightedItem = ref<{ ref: HTMLElement; value: AcceptableValue } | undefined>()
const commandRootValue = ref<AcceptableValue | AcceptableValue[] | undefined>()

const { store } = useTauri()

onKeyStrokeSafe(
  'meta_p',
  () => {
    open.value = !open.value
  },
  {
    ignore: ['[data-slot="command-input"]', '#track-list-search-input'],
  },
)

watch(open, () => {
  // ensure active element is blurred when dialog is closed
  if (!open.value) {
    const activeElement = document.activeElement as HTMLElement

    if (activeElement && activeElement !== document.body) activeElement.blur()
  }
})

const {
  execute: reloadRecents,
  isReady: isRecentsReady,
  state: recents,
} = useAsyncState(async () => store.get<string[]>('modal-folder-select-recents'), [])

const { execute: checkPathExists, state: pathExists } = useAsyncState(
  () => useTauriFsExists(input.value),
  false,
  { immediate: false },
)

const inputType = computed(() => getInputType(input.value))
watch(input, () => input.value && inputType.value !== 'query' && checkPathExists())

async function handleEnter(manualInput?: string) {
  const rawInput = manualInput ?? input.value
  const inputToUse = await $invoke(commands.getCanonicalPath, rawInput)

  if (inputToUse) {
    open.value = false

    const newRecents = recents.value ?? []

    if (
      !isRecentsReady.value ||
      recents.value?.some((i) => i.toLowerCase() === inputToUse.toLowerCase())
    ) {
      const index = newRecents.indexOf(inputToUse)
      newRecents.splice(index, 1)
    }

    if (newRecents.length >= 6) newRecents.pop()

    newRecents.unshift(inputToUse)

    store.set('modal-folder-select-recents', newRecents)
    reloadRecents()

    pathExists.value = false

    return navigateTo({
      name: 'folder-path',
      params: {
        path: encodeURIComponent(inputToUse),
      },
    })
  }
}

function getInputType(path: string) {
  if (!path.includes('/') && !path.includes('\\')) return 'query'

  const fileIdx = path.lastIndexOf('.')
  const folderIdx = path.lastIndexOf('/')
  return fileIdx > folderIdx ? 'file' : 'folder'
}

function handleKeyDownRight() {
  if (!input.value && listBoxHighlightedItem.value?.value)
    input.value = listBoxHighlightedItem.value.value.toString()
}

function handleCmdItemMount(item: VNode) {
  const cmdItemId: string | undefined = item.el?.id
  if (cmdItemId) commandRootValue.value = cmdItemId
}
</script>

<template>
  <UCommandDialog
    :open="open"
    @update:open="open = $event"
  >
    <UCommandRoot
      v-model:model-value="commandRootValue"
      class="size-full relative"
      @highlight="listBoxHighlightedItem = $event"
    >
      <UCommandInput
        v-model="input"
        class="border-0"
        @focus="(e: FocusEvent) => (e.target as HTMLInputElement).select()"
        @keydown.right="handleKeyDownRight()"
      />
      <UCommandList>
        <template v-if="input.length > 0">
          <UCommandGroup
            v-if="inputType === 'query' || !pathExists"
            should-render
            heading="Search"
          >
            <UCommandItem
              persistent
              value="search"
              @select="handleEnter()"
              @vue:mounted="handleCmdItemMount"
            >
              <span>Search for "{{ input }}"</span>
            </UCommandItem>
          </UCommandGroup>
          <UCommandGroup
            v-else-if="inputType === 'folder'"
            should-render
            heading="Folder"
          >
            <UCommandItem
              persistent
              value="folder"
              @select="handleEnter()"
              @vue:mounted="handleCmdItemMount"
            >
              <span>Open "{{ input }}"</span>
            </UCommandItem>
          </UCommandGroup>
          <UCommandGroup
            v-else-if="inputType === 'file'"
            should-render
            heading="File"
          >
            <UCommandItem
              persistent
              value="file"
              @select="handleEnter()"
              @vue:mounted="handleCmdItemMount"
            >
              <span>Open "{{ input }}"</span>
            </UCommandItem>
          </UCommandGroup>
        </template>
        <UCommandGroup
          v-if="recents?.length"
          heading="Recents"
        >
          <UCommandItem
            v-for="recentItem in recents"
            :key="recentItem"
            :value="recentItem"
            @select="handleEnter(recentItem)"
          >
            <p class="w-full truncate">
              {{ recentItem }}
            </p>
          </UCommandItem>
        </UCommandGroup>
      </UCommandList>
    </UCommandRoot>
  </UCommandDialog>
</template>
