<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui'
import { ComboboxInput, useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    ComboboxInputProps & {
      class?: HTMLAttributes['class']
      showIcon?: boolean
    }
  >(),
  {
    class: '',
    showIcon: true,
  },
)

const emits = defineEmits<ComboboxInputEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <div
    data-slot="combobox-input-wrapper"
    :class="
      cn(
        staticStyles.base,
        interactiveStyles.size.default,
        'flex items-center gap-2 px-0',
        props.class,
      )
    "
  >
    <Icon
      v-if="props.showIcon"
      name="tabler:search"
      class="opacity-50 shrink-0 size-4"
    />
    <ComboboxInput
      v-no-autocorrect
      data-slot="combobox-input"
      :class="cn('flex-1', props.class)"
      v-bind="{ ...$attrs, ...forwarded }"
    >
      <slot />
    </ComboboxInput>
  </div>
</template>
