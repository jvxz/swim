<script setup lang="ts">
import type { ListboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, onMounted, onUnmounted, useId } from 'vue'

import { provideCommandGroupContext, useCommand } from '.'

const props = defineProps<
  ListboxGroupProps & {
    class?: HTMLAttributes['class']
    heading?: string
    icon?: string
    shouldRender?: boolean
  }
>()

const delegatedProps = reactiveOmit(props, 'class')

const { allGroups, filterState } = useCommand()
const id = useId()

const isRender = computed(() =>
  !filterState.search ? true : (props.shouldRender ?? filterState.filtered.groups.has(id)),
)

provideCommandGroupContext({ id })
onMounted(() => {
  if (!allGroups.value.has(id)) allGroups.value.set(id, new Set())
})
onUnmounted(() => {
  allGroups.value.delete(id)
})
</script>

<template>
  <ListboxGroup
    v-bind="delegatedProps"
    :id="id"
    :class="
      cn(
        'overflow-hidden p-1 text-foreground not-last:mb-1 first:border-t **:[[cmdk-group-heading]]:px-0 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-items]]:space-y-1',
        props.class,
      )
    "
    :hidden="isRender ? undefined : true"
  >
    <ListboxGroupLabel
      v-if="heading"
      class="text-xs text-muted-foreground font-medium my-0.5 px-2 py-1.5 flex gap-1 items-center"
    >
      <Icon
        v-if="icon"
        :name="icon"
      />
      {{ heading }}
    </ListboxGroupLabel>
    <slot />
  </ListboxGroup>
</template>
