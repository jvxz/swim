<script lang="ts" setup>
import { breakpointsTailwind } from '@vueuse/core'

const fps = useFps({
  every: 40,
})

const { active } = useBreakpoints(breakpointsTailwind)
const breakpoint = active()
</script>

<template>
  <div
    class="text-xs text-muted-foreground right-2 top-2 absolute"
    @click="$router.push('/playground')"
  >
    {{ fps }}
    <span class="font-mono">{{ breakpoint }}</span>
  </div>
</template>
