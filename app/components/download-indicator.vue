<script lang="ts" setup>
// Reads the live status itself rather than taking it as a prop, so it keeps
// ticking inside track rows, which are wrapped in `v-memo`.
const { entry } = defineProps<{
  entry: { download_status?: DownloadStatus; path: string } | null
}>()

const { liveDownloadStatus } = useFileProvider()

const status = computed(() => (entry ? liveDownloadStatus(entry) : 'Local'))
const label = computed(() => {
  if (status.value === 'DownloadFailed') return 'Download failed'

  return status.value === 'Downloading' ? 'Downloading' : 'Not downloaded'
})
</script>

<template>
  <Icon
    v-if="status !== 'Local'"
    :name="status === 'DownloadFailed' ? 'tabler:cloud-x' : 'tabler:cloud-download'"
    class="shrink-0 size-4!"
    :class="{
      'animate-pulse text-primary': status === 'Downloading',
      'text-danger': status === 'DownloadFailed',
      'text-muted-foreground': status === 'NotDownloaded',
    }"
    :title="label"
  />
</template>
