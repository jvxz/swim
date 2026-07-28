<script setup lang="ts">
import type { ListboxFilterProps } from 'reka-ui'
import { useForwardProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { useCommand } from '.'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<
  ListboxFilterProps & {
    class?: HTMLAttributes['class']
    icon?: string
    placeholder?: string
  }
>()

const modelValue = defineModel<string>({
  default: '',
})

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

const { filterState } = useCommand()

const searchRef = toRef(filterState, 'search')
syncRef(modelValue, searchRef)
</script>

<template>
  <div
    class="px-4 flex shrink-0 gap-2 h-12 items-center"
    cmdk-input-wrapper
  >
    <Icon
      v-if="props.icon"
      :name="props.icon"
      class="opacity-50 shrink-0 size-4"
    />

    <ListboxFilter
      v-bind="{ ...forwardedProps, ...$attrs }"
      v-model="filterState.search"
      v-no-autocorrect
      data-slot="command-input"
      auto-focus
      :class="
        cn(
          'flex w-full text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          props.class,
        )
      "
    />
  </div>
</template>
