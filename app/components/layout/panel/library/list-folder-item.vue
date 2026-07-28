<script lang="ts" setup>
defineProps<{
  folder: Selectable<DB['library_folders']>
  isSelected: boolean
}>()
</script>

<template>
  <UContextMenu>
    <UContextMenuTrigger as-child>
      <UButton
        :variant="isSelected ? 'toggled' : 'togglable'"
        :class="cn('w-full justify-start text-foreground')"
        @click="
          navigateTo({
            name: 'folder-path',
            params: {
              path: folder.path,
            },
          })
        "
      >
        <span
          :title="folder.path"
          class="truncate"
        >
          {{ folder.path }}
        </span>
      </UButton>
    </UContextMenuTrigger>
    <UContextMenuContent class="w-52">
      <UContextMenuItem @click="() => {}"> Remove from library </UContextMenuItem>
    </UContextMenuContent>
  </UContextMenu>
</template>
