<script lang="ts" setup>
const scanProgress = useScanProgress()

const percent = computed(() => {
  if (!scanProgress.value || scanProgress.value.total === 0) return 0
  return (scanProgress.value.current / scanProgress.value.total) * 100
})
</script>

<template>
  <div
    class="text-xs font-mono px-2 border-t bg-card flex shrink-0 h-6 items-center justify-between"
  >
    <span class="text-muted-foreground">swim</span>
    <div
      v-if="scanProgress"
      class="flex gap-2 items-center"
    >
      <span class="tabular-nums">
        Scanning {{ scanProgress.current }}/{{ scanProgress.total }}
      </span>
      <div class="bg-muted h-1 w-24 overflow-hidden">
        <div
          class="bg-primary h-full"
          :style="{ width: `${percent}%` }"
        />
      </div>
    </div>
  </div>
</template>
