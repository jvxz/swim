<script lang="ts" setup>
const scans = useScanProgress()

// only one scan's progress is shown at a time - if more than one folder is scanning
// concurrently, this just picks whichever started first rather than listing all of them
const activeScan = computed(() => Object.values(scans.value)[0] ?? null)

const percent = computed(() => {
  if (!activeScan.value || activeScan.value.total === 0) return 0
  return (activeScan.value.current / activeScan.value.total) * 100
})
</script>

<template>
  <div
    class="text-xs font-mono px-2 border-t bg-card flex shrink-0 h-6 items-center justify-between"
  >
    <span class="text-muted-foreground">swim</span>
    <div
      v-if="activeScan"
      class="flex gap-2 items-center"
    >
      <span class="tabular-nums"> Scanning {{ activeScan.current }}/{{ activeScan.total }} </span>
      <div class="bg-muted h-1 w-24 overflow-hidden">
        <div
          class="bg-primary h-full"
          :style="{ width: `${percent}%` }"
        />
      </div>
    </div>
  </div>
</template>
