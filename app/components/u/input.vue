<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
  leadingIcon?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
})
</script>

<template>
  <div
    v-if="props.leadingIcon"
    class="shrink-0 relative"
  >
    <Icon
      :name="props.leadingIcon"
      class="opacity-50 shrink-0 scale-80 inset-0 left-1.5 top-1/2 absolute -translate-y-1/2"
    />
    <input
      v-bind="$attrs"
      v-model="modelValue"
      data-1p-ignore
      :class="
        cn(
          'flex w-full min-w-0 cursor-text truncate py-1 font-sans selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:text-foreground placeholder:text-muted-foreground focus-visible:ring-0 md:text-sm',
          staticStyles.base,
          interactiveStyles.size.default,
          staticStyles.variant.default,
          'ps-6',
          props.class,
        )
      "
    />
  </div>
  <input
    v-else
    v-bind="$attrs"
    v-model="modelValue"
    data-1p-ignore
    :class="
      cn(
        staticStyles.base,
        interactiveStyles.size.default,
        staticStyles.variant.default,
        'flex w-full min-w-0 cursor-text truncate py-1 font-sans font-medium selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:text-foreground placeholder:text-muted-foreground focus-visible:ring-0 md:text-sm',
        props.class,
      )
    "
  />
</template>
