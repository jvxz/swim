<script lang="ts" setup>
defineProps<{
  entries: TrackListEntry[] | null
}>()
</script>

<template>
  <UContextMenu>
    <UContextMenuTrigger as-child>
      <slot />
    </UContextMenuTrigger>
    <TrackListEntryContextMenuContent
      v-if="entries"
      :entries
    />
  </UContextMenu>
</template>
