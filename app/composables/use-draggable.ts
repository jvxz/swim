import type { MaybeElementRef } from '@vueuse/core'
import type { RendererNode, StyleValue, VNodeProps } from 'vue'

export interface DragItem<T> {
  _listId: string
  data: T
  element: Element
  group?: string
}

interface HookParams<T> {
  prevIdx: number
  targetIdx: number | null
  targetItem: DragItem<T> | null
  prevItem: DragItem<T>
}

export type DraggableOptions<T = unknown> = Partial<{
  _name: string
  onDragStart: (draggingItem: DragItem<T>) => void
  onDragEnd: (params: HookParams<T>) => void
  onDragOver: (params: HookParams<T>) => void
  doDragGhost: boolean
  class: Partial<{
    dragging: string
  }>
  direction: 'vertical' | 'horizontal'
  group: string
  mode: 'container' | 'item'
}>

const DRAG_UPDATE_THRESHOLD = 10

export const useDraggableData = createGlobalState(() => {
  const validElements = new WeakMap<RendererNode, DragItem<unknown>>()
  const draggingItem = shallowRef<DragItem<unknown> | null>(null)
  const isDragging = shallowRef(false)
  const dragGhostElement = shallowRef<HTMLElement | null>(null)

  const pointer = useGlobalPointer()
  const {
    element: hoveredElement,
    pause: pauseElementByPointWatch,
    resume: resumeElementByPointWatch,
  } = useElementByPoint({
    immediate: false,
    x: pointer.x,
    y: pointer.y,
  })

  const { on: onMouseRelease, trigger } = createEventHook<boolean>()
  const { pressed: isMouseDown } = useMousePressed({
    onReleased: () => {
      document.body.style.cursor = 'default'

      const wasDragging = isDragging.value
      trigger(wasDragging)

      nextTick(() => {
        draggingItem.value = null
        isDragging.value = false
      })
    },
  })

  return {
    dragGhostElement,
    /**
     * the item that is being dragged
     */
    draggingItem,
    hoveredElement,
    isDragging,
    isMouseDown,
    onMouseRelease,
    pauseElementByPointWatch,
    resumeElementByPointWatch,
    validElements,
  }
})

export function useDraggable<T>(
  list: Ref<T[]>,
  container: MaybeRef<MaybeElementRef>,
  options: MaybeRefOrGetter<DraggableOptions<T>> = {
    direction: 'vertical',
    mode: 'item',
  },
) {
  const {
    dragGhostElement,
    draggingItem,
    hoveredElement,
    isDragging,
    onMouseRelease,
    pauseElementByPointWatch,
    resumeElementByPointWatch,
    validElements,
  } = useDraggableData()
  const listId = useId()
  const pointer = useGlobalPointer()

  let barGap: string | null = null

  const isOverContainer = shallowRef(false)

  /**
   * the item that is being hovered
   */
  const dropTargetItem = computed<DragItem<T> | null>((_prev) => {
    if (!isDragging.value || !isOverContainer.value) return null

    let el = unrefElement(hoveredElement)
    while (el && !validElements.has(el)) el = el.parentElement

    if (!el) return null

    const item = lookupElement(el)
    if (!item || item.group !== toValue(options).group) return null

    return item
  })

  let dragUpdateCount = 0
  let potentialDraggingItem: DragItem<T> | null = null
  const { pause: pausePointerWatch, resume: resumePointerWatch } = watch(
    [pointer.x, pointer.y],
    () => {
      if (isDragging.value) return pausePointerWatch()

      if (!potentialDraggingItem) return pausePointerWatch()

      dragUpdateCount++

      if (dragUpdateCount >= DRAG_UPDATE_THRESHOLD) {
        pausePointerWatch()
        resumeHoverWatch()
        dragUpdateCount = 0
        isDragging.value = true

        draggingItem.value = potentialDraggingItem
        handleDragGhost('add')

        const classValue = toValue(options).class?.dragging
        if (draggingItem.value && classValue) draggingItem.value.element.classList.add(classValue)

        toValue(options).onDragStart?.(potentialDraggingItem)

        document.body.style.cursor = 'move'

        potentialDraggingItem = null
      }
    },
    {
      immediate: false,
    },
  )

  onMouseRelease((wasDragging) => {
    pausePointerWatch()
    pauseHoverWatch()

    barGap = null
    potentialDraggingItem = null
    dragUpdateCount = 0
    handleDragGhost('remove')

    const classValue = toValue(options).class?.dragging
    if (draggingItem.value && classValue) draggingItem.value.element.classList.remove(classValue)

    const draggedFromList = draggingItem.value?._listId === listId
    const draggedToList = dropTargetItem.value?._listId === listId
    const isFromSameGroup =
      draggingItem.value?.group === toValue(options).group ||
      dropTargetItem.value?.group === toValue(options).group

    if (
      wasDragging &&
      draggingItem.value &&
      isOverContainer.value &&
      dropTargetItem.value &&
      isFromSameGroup &&
      (draggedFromList || draggedToList)
    )
      toValue(options).onDragEnd?.(createHookParams())
  })

  const { pause: pauseHoveredElementWatch, resume: resumeHoveredElementWatch } = watch(
    dropTargetItem,
    (currentItem) => {
      if (!currentItem || !lookupElement(currentItem.element)) return

      if (currentItem.group === toValue(options).group)
        toValue(options).onDragOver?.(createHookParams())
    },
  )

  function handlePointerDown(data: T, element: any) {
    if (!(element instanceof HTMLElement)) return

    resumePointerWatch()

    potentialDraggingItem = {
      _listId: listId,
      data,
      element,
      group: toValue(options).group,
    }
  }

  const inElementHalf = shallowRef<'bottom/right' | 'top/left' | null>()
  const barStyles = shallowRef<StyleValue | null>(null)
  const { pause: pauseRafFn, resume: resumeRafFn } = useRafFn(
    () => {
      handleElementHalf()
      handleBar()
      handleDragGhostPosition()
      handleOverContainer()

      function handleElementHalf() {
        const hoveredElement = dropTargetItem.value?.element
        if (!hoveredElement) return (inElementHalf.value = null)

        if (toValue(options).direction === 'horizontal') {
          const hoveredElementRect = hoveredElement.getBoundingClientRect()
          const relativePosition = pointer.x.value - hoveredElementRect.left

          return (inElementHalf.value =
            relativePosition > hoveredElementRect.width / 2 ? 'bottom/right' : 'top/left')
        }

        const hoveredElementRect = hoveredElement.getBoundingClientRect()
        const relativePosition = pointer.y.value - hoveredElementRect.top

        return (inElementHalf.value =
          relativePosition > hoveredElementRect.height / 2 ? 'bottom/right' : 'top/left')
      }

      function handleBar() {
        const hoveredElement = dropTargetItem.value?.element
        if (!hoveredElement || !isDragging.value || !inElementHalf.value || !isOverContainer.value)
          return (barStyles.value = null)

        if (
          draggingItem.value &&
          draggingItem.value.group &&
          draggingItem.value.group !== toValue(options).group
        )
          return barStyles.value

        const half = inElementHalf.value

        const parentElement = hoveredElement.parentElement
        if (parentElement && !barGap) {
          const gap = getComputedStyle(parentElement).gap
          if (gap === 'normal') barGap = `${0}px`
          else barGap = gap
        }

        const siblingElement = getValidSibling(
          hoveredElement,
          half === 'bottom/right' ? 'next' : 'prev',
        )

        const hoveredElementRect = hoveredElement.getBoundingClientRect()

        // if first or last
        if (!siblingElement || !lookupElement(siblingElement)) {
          if (toValue(options).direction === 'vertical') {
            const topValue =
              half === 'bottom/right'
                ? hoveredElementRect.height + hoveredElementRect.top
                : hoveredElementRect.top

            const top = `calc(${topValue}px ${half === 'bottom/right' ? '+' : '-'} ${barGap} / 2)`

            return (barStyles.value = {
              top,
              width: `${hoveredElementRect.width}px`,
            })
          }

          const leftValue =
            half === 'bottom/right'
              ? hoveredElementRect.width + hoveredElementRect.left
              : hoveredElementRect.left

          const left = `calc(${leftValue}px ${half === 'bottom/right' ? '+' : '-'} ${barGap} / 2)`

          return (barStyles.value = {
            height: `${hoveredElementRect.height}px`,
            left,
          })
        }

        const siblingElementRect = siblingElement.getBoundingClientRect()

        if (toValue(options).direction === 'vertical') {
          const topValue =
            half === 'bottom/right'
              ? (hoveredElementRect.height + hoveredElementRect.top + siblingElementRect.top) / 2
              : (siblingElementRect.height + siblingElementRect.top + hoveredElementRect.top) / 2

          const top = `${topValue}px`

          return (barStyles.value = {
            top,
            width: `${hoveredElementRect.width}px`,
          })
        }

        const leftValue =
          half === 'bottom/right'
            ? (hoveredElementRect.width + hoveredElementRect.left + siblingElementRect.left) / 2
            : (siblingElementRect.width + siblingElementRect.left + hoveredElementRect.left) / 2

        const left = `${leftValue}px`

        return (barStyles.value = {
          height: `${hoveredElementRect.height}px`,
          left,
        })

        function getValidSibling(el: Element, direction: 'next' | 'prev') {
          let sibling = direction === 'next' ? el.nextElementSibling : el.previousElementSibling
          while (sibling && !lookupElement(sibling))
            sibling =
              direction === 'next' ? sibling.nextElementSibling : sibling.previousElementSibling

          return sibling
        }
      }

      function handleDragGhostPosition() {
        if (!dragGhostElement.value) return

        const el = dragGhostElement.value

        const topValue = getViewportBoundPosition('y', el)
        const leftValue = getViewportBoundPosition('x', el)

        el.style.top = `${topValue}px`
        el.style.left = `${leftValue}px`
      }

      function handleOverContainer() {
        isOverContainer.value = document
          .elementsFromPoint(pointer.x.value, pointer.y.value)
          .includes(unrefElement(toValue(container))!)
      }
    },
    {
      immediate: false,
    },
  )

  watch(isDragging, (v) => {
    if (v) return resumeRafFn()
    else {
      pauseRafFn()
      barStyles.value = null
    }
  })

  function pauseHoverWatch() {
    pauseElementByPointWatch()
    pauseHoveredElementWatch()
  }

  function resumeHoverWatch() {
    resumeElementByPointWatch()
    resumeHoveredElementWatch()
  }

  const getDragElementProps = (data: T) => {
    const onVnodeMounted: VNodeProps['onVnodeMounted'] = (e) =>
      e.el &&
      e.el instanceof Element &&
      validElements.set(e.el, {
        _listId: listId,
        data,
        element: e.el,
        group: toValue(options).group,
      })
    const onVnodeBeforeUnmount: VNodeProps['onVnodeBeforeUnmount'] = (e) =>
      e.el && validElements.delete(e.el)
    const onPointerdown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('[data-no-drag]')) return

      handlePointerDown(data, event.currentTarget)
    }

    return {
      onPointerdown,
      onVnodeBeforeUnmount,
      onVnodeMounted,
    }
  }

  function createHookParams(): HookParams<T> {
    const targetItem = lookupElement(dropTargetItem.value?.element ?? null)
    if (!dropTargetItem.value || !targetItem)
      throw new Error('Attempted to make hook params when targetItem was undefined')

    const prevItem = lookupElement(draggingItem.value?.element ?? null)
    if (!draggingItem.value || !prevItem)
      throw new Error('Attempted to make hook params when prevItem was undefined')

    const targetIdx = list.value.indexOf(targetItem.data)
    const prevIdx = list.value.indexOf(prevItem.data)

    if (prevIdx === targetIdx) {
      return {
        prevIdx,
        prevItem,
        targetIdx: prevIdx,
        targetItem,
      }
    }

    let insertionIdx = targetIdx + (inElementHalf.value === 'bottom/right' ? 1 : 0)

    if (prevIdx !== -1 && prevIdx < insertionIdx) {
      insertionIdx--
    }

    return {
      prevIdx,
      prevItem,
      targetIdx: Math.max(insertionIdx, 0),
      targetItem,
    }
  }

  function lookupElement(el: DragItem<T>['element'] | null): DragItem<T> | null {
    if (!el) return null

    const data = validElements.get(el)
    if (!data) return null

    return data as DragItem<T>
  }

  function handleDragGhost(action: 'add' | 'remove') {
    if (!toValue(options).doDragGhost) return

    if (!draggingItem.value?.element) return

    if (action === 'add') {
      if (dragGhostElement.value) return

      const el = document.body.appendChild(
        draggingItem.value.element.cloneNode(true) as HTMLElement,
      )

      el.style.position = 'absolute'
      el.style.opacity = '0.5'
      el.style.pointerEvents = 'none'
      el.style.width = 'fit-content'

      dragGhostElement.value = el
    } else {
      if (!dragGhostElement.value) return

      dragGhostElement.value.remove()
      dragGhostElement.value = null
    }
  }

  function getViewportBoundPosition(axis: 'x' | 'y', el: HTMLElement) {
    return axis === 'x'
      ? Math.max(0, Math.min(window.innerWidth - el.offsetWidth, pointer.x.value))
      : Math.max(0, Math.min(window.innerHeight - el.offsetHeight, pointer.y.value))
  }

  onUnmounted(() => {
    if (dragGhostElement.value) {
      dragGhostElement.value.remove()
      dragGhostElement.value = null
    }
  })

  const localDraggingItem = computed(() =>
    draggingItem.value?._listId === listId ? (draggingItem.value as DragItem<T>) : null,
  )

  return {
    barStyles,
    draggingItem: localDraggingItem,
    getDragElementProps,
    isDragging,
  }
}

type Filter = (() => boolean) | boolean
export function handleListRearrange<T>(
  listRef: MaybeRefOrGetter<T[]>,
  paramsRef: MaybeRefOrGetter<HookParams<T>>,
  filters: {
    doRemoval?: Filter
    doMoving?: Filter
    doAdding?: Filter
  } = {},
) {
  const list = toValue(listRef)
  const params = toValue(paramsRef)

  if (!params.targetItem?.data || (!params.targetIdx && params.targetIdx !== 0)) return list

  // handle moving to different list (remove)
  if (params.prevIdx !== -1 && params.prevItem._listId !== params.targetItem._listId) {
    if (!check(filters.doRemoval)) return list

    const arr = [...list]
    arr.splice(params.prevIdx, 1)
    return arr
  }

  // handle recieving from different list (add at index)
  if (params.prevIdx === -1)
    return check(filters.doAdding) ? insertAt(list, params.targetIdx, params.prevItem.data) : list

  return check(filters.doMoving) ? moveArrayMember(list, params.prevIdx, params.targetIdx) : list

  function check(f: Filter | undefined): boolean {
    if (!f) return true

    if (typeof f === 'function') return f()

    return f
  }
}

export function moveArrayMember<T>(arr: T[], from: number, to: number) {
  const clone: T[] = [...arr]
  Array.prototype.splice.call(clone, to, 0, Array.prototype.splice.call(clone, from, 1)[0])
  return clone
}

export function insertAt<T>(arr: T[], index: number, element: T): T[] {
  return [...arr.slice(0, index), element, ...arr.slice(index)]
}
