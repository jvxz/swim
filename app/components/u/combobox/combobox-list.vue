<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui'
import { ComboboxContent, useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 6,
  },
)
const emits = defineEmits<ComboboxContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ComboboxContent
    data-slot="combobox-list"
    v-bind="{ ...$attrs, ...forwarded }"
    :class="
      cn(
        popoverStyles.content,
        'absolute top-(--reka-combobox-trigger-height) mt-1 w-full overflow-hidden',
        props.class,
      )
    "
  >
    <slot />
  </ComboboxContent>
  <!-- <ComboboxPortal class="relative">
    <ComboboxContent
      data-slot="combobox-list"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(popoverStyles.content, 'absolute w-full overflow-hidden top-0', props.class)"
    >
      <slot />
    </ComboboxContent>
  </ComboboxPortal> -->
</template>
