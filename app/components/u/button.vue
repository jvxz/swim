<script lang="ts">
import { Slot } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
</script>

<script lang="ts" setup>
export interface ButtonProps {
  asChild?: boolean
  disabled?: MaybeRefOrGetter<boolean>
  size?: 'default' | 'icon' | 'lg' | 'sm'
  variant?: keyof typeof interactiveStyles.variant
  isLoading?: MaybeRefOrGetter<boolean>
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<ButtonProps>(), {
  asChild: false,
  class: '',
  disabled: false,
  isLoading: false,
  size: 'default',
  variant: 'default',
})
</script>

<template>
  <Slot
    v-if="asChild"
    :disabled="toValue(disabled) || toValue(props.isLoading)"
    :class="
      cn(
        buttonVariants({ variant, size }),
        props.class,
        props.isLoading && 'grid text-transparent [grid-template-areas:stack]',
        toValue(disabled) && 'pointer-events-none',
      )
    "
  >
    <slot />
  </Slot>
  <button
    v-else
    :disabled="toValue(disabled) || toValue(props.isLoading)"
    :class="
      cn(
        buttonVariants({ variant, size }),
        props.class,
        toValue(props.isLoading) && 'not-[.spinner]:text-transparent',
        toValue(disabled) && 'pointer-events-none',
      )
    "
  >
    <USpinner
      v-if="toValue(props.isLoading)"
      :invert="true"
      class="inset-0 left-1/2 top-1/2 absolute size-4! -translate-1/2"
    />
    <slot />
  </button>
</template>
