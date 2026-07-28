<script setup lang="ts">
import type { ListboxItemEmits, ListboxItemProps } from 'reka-ui'
import { useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { useCommand, useCommandGroup } from '.'

const props = defineProps<
  ListboxItemProps & { class?: HTMLAttributes['class']; persistent?: boolean }
>()
const emits = defineEmits<ListboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const id = useId()
const { allGroups, allItems, filterState, persistentItems } = useCommand()
const groupContext = useCommandGroup()

const isRender = computed(() => {
  if (!filterState.search || props.persistent) return true
  else {
    const filteredCurrentItem = filterState.filtered.items.get(id)
    if (filteredCurrentItem === undefined) return true

    return filteredCurrentItem > 0
  }
})

const itemRef = ref()
const currentElement = useCurrentElement(itemRef)
onMounted(() => {
  if (!(currentElement.value instanceof HTMLElement)) return

  if (props.persistent)
    persistentItems.value.set(id, currentElement.value.textContent ?? props?.value!.toString())
  else allItems.value.set(id, currentElement.value.textContent ?? props?.value!.toString())

  const groupId = groupContext?.id
  if (groupId) {
    if (!allGroups.value.has(groupId)) allGroups.value.set(groupId, new Set([id]))
    else allGroups.value.get(groupId)?.add(id)
  }
})
onUnmounted(() => {
  allItems.value.delete(id)
})
</script>

<template>
  <ListboxItem
    v-if="isRender"
    v-bind="forwarded"
    :id="id"
    ref="itemRef"
    :class="
      cn(
        'relative flex h-7 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-hidden select-none data-highlighted:bg-muted-foreground/15 data-highlighted:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 [&_svg:not([class*=text-])]:text-muted-foreground',
        props.class,
      )
    "
    @select="
      () => {
        filterState.search = ''
      }
    "
  >
    <slot />
  </ListboxItem>
</template>
