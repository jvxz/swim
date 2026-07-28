<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui'
import { AutocompleteContent, useForwardPropsEmits } from 'reka-ui'
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
  <AutocompleteContent
    data-slot="autocomplete-list"
    v-bind="{ ...$attrs, ...forwarded }"
    :class="
      cn(
        popoverStyles.content,
        'absolute top-(--reka-autocomplete-trigger-height) mt-1 w-full overflow-hidden',
        props.class,
      )
    "
  >
    <slot />
  </AutocompleteContent>
  <!-- <AutocompletePortal class="relative">
    <AutocompleteContent
      data-slot="autocomplete-list"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn(popoverStyles.content, 'absolute w-full overflow-hidden top-0', props.class)"
    >
      <slot />
    </AutocompleteContent>
  </AutocompletePortal> -->
</template>
