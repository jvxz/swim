<script lang="ts" setup>
import { open as openFilePicker } from '@tauri-apps/plugin-dialog'
import type { AcceptableValue } from 'reka-ui'

const { copy } = useClipboard()
const { addFolderToLibrary, getLibraryFolders, removeFolderFromLibrary } = useLibrary()

const { data: folders } = getLibraryFolders()

const selectedFolder = shallowRef<AcceptableValue>(null)

function handleRemoveFolder(folderPath: AcceptableValue) {
  removeFolderFromLibrary(0, folderPath)
  if (selectedFolder.value === folderPath) selectedFolder.value = null
}

async function handleAddFolder() {
  const folderPath = await openFilePicker({
    directory: true,
  })
  if (folderPath) addFolderToLibrary(0, folderPath)
}

async function handleDrop(folderPaths: string[]) {
  await addFolderToLibrary(0, folderPaths[0])
}
</script>

<template>
  <WindowSettingsContentTabLayout title="Library">
    <FormSubtitle> Monitored folders </FormSubtitle>
    <div class="flex flex-col gap-1">
      <TauriDragoverProvider
        v-slot="{ isOver }"
        @drop="handleDrop"
      >
        <UCard class="text-sm font-mono p-1 px-2 bg-background gap-0 relative">
          <div
            v-show="isOver"
            class="bg-background/50 grid pointer-events-none inset-0 place-items-center absolute"
          >
            Drop to add folder
          </div>
          <ToggleGroupRoot
            v-model:model-value="selectedFolder"
            type="single"
            class="h-32 overflow-y-auto space-y-0.5"
          >
            <UContextMenu
              v-for="folder in folders"
              :key="folder.path"
            >
              <UContextMenuTrigger as-child>
                <ToggleGroupItem
                  :value="folder.path"
                  as-child
                >
                  <button
                    :title="folder.path"
                    class="data-active:ghost-button-active text-left w-full select-none truncate"
                  >
                    {{ folder.path }}
                  </button>
                </ToggleGroupItem>
              </UContextMenuTrigger>
              <UContextMenuContent>
                <UContextMenuItem @click="copy(folder.path)"> Copy path </UContextMenuItem>
                <UContextMenuItem @click="handleRemoveFolder(folder.path)">
                  Remove
                </UContextMenuItem>
              </UContextMenuContent>
            </UContextMenu>
          </ToggleGroupRoot>
        </UCard>
      </TauriDragoverProvider>
      <div class="flex justify-between">
        <UButton
          variant="outline"
          @click="handleAddFolder"
        >
          Add folder...
        </UButton>
        <UButton
          variant="outline"
          :disabled="!selectedFolder"
          @click="handleRemoveFolder(selectedFolder)"
        >
          Remove
        </UButton>
      </div>
    </div>
  </WindowSettingsContentTabLayout>
</template>
