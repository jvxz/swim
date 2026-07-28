<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="
      cn(
        interactiveStyles.base,
        interactiveStyles.variant.outline,
        'size-4 cursor-default transition-shadow data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground active:data-[state=checked]:bg-primary/90',
        props.class,
      )
    "
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="text-current flex transition-none items-center justify-center"
    >
      <slot v-bind="slotProps">
        <Icon
          name="tabler:check"
          class="size-3.5!"
        />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
