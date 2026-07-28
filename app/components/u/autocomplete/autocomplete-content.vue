<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui'
import { AutocompleteContent, AutocompletePortal, useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    position: 'popper',
    sideOffset: 6,
  },
)
const emits = defineEmits<ComboboxContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <AutocompletePortal>
    <AutocompleteContent
      data-slot="autocomplete-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="
        cn(
          popoverStyles.content,
          'z-10 w-(--reka-combobox-trigger-width) overflow-hidden will-change-[opacity,transform]',
          props.class,
        )
      "
    >
      <slot />
    </AutocompleteContent>
  </AutocompletePortal>
</template>
