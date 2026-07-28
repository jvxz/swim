import type TauriDragoverProvider from '~/components/tauri-dragover-provider.vue'

export function useSortable<T>(itemsRef: Ref<T[]>) {
  const itemDragging = shallowRef<T | null>(null)
  const itemOver = shallowRef<T | null>(null)

  function handleDragStart(item: T, fn?: () => void) {
    itemDragging.value = item
    fn?.()
  }

  function handleDragOver(item: T, fn?: () => void) {
    itemOver.value = item
    fn?.()
  }

  function handleDragDrop() {
    if (!itemDragging.value || !itemOver.value || itemOver.value === itemDragging.value) return

    const items = toValue(itemsRef)

    const newItemIdx = items.indexOf(itemOver.value)
    const oldItemIdx = items.indexOf(itemDragging.value)

    const newItems = items.with(newItemIdx, itemDragging.value).with(oldItemIdx, itemOver.value)
    itemsRef.value = newItems

    itemDragging.value = null
    itemOver.value = null
  }

  const getDropoverProps = (
    item: T,
    callbacks?: {
      onDrop?: (itemPaths: string[], meta: DragMetaEntry) => void
      onOver?: () => void
    },
  ): InstanceType<typeof TauriDragoverProvider>['$props'] => ({
    onDrop: (_itemPaths: string[], _meta: DragMetaEntry) => {
      handleDragDrop()
      callbacks?.onDrop?.(_itemPaths, _meta)
    },
    onOver: () => {
      handleDragOver(item)
      callbacks?.onOver?.()
    },
  })

  return {
    getDropoverProps,
    handleDragStart,
    itemDragging,
    itemOver,
  }
}
