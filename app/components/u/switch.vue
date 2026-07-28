<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = defineProps<SwitchRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="
      cn(
        staticStyles.base,
        staticStyles.variant.default,
        'inline-flex h-5 w-9 items-center rounded-sm border-2 border-muted bg-muted p-0 shadow-none transition-all duration-100 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:glow-primary',
        props.class,
      )
    "
  >
    <SwitchThumb
      :class="
        cn(
          interactiveStyles.base,
          interactiveStyles.variant.default,
          'pointer-events-none block size-4 rounded-sm border-0 bg-background ring-0 transition-transform duration-100 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        )
      "
    >
      <slot name="thumb" />
    </SwitchThumb>
  </SwitchRoot>
</template>
