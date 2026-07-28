<script lang="ts" setup>
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  panelKey: LayoutPanelKey
}>()

const settings = useSettings()
const { elementDraggingData, isElementAllowedInPanel, openElementWindow, removeElementFromPanel } =
  useLayout()

function hasSettings(elementKey: LayoutElementKey) {
  const obj = defaultLayoutElementSettings[elementKey]
  return Object.keys(obj).length > 0
}
</script>

<template>
  <VueDraggable
    id="panel-elements"
    :key="settings.layout.panel[panelKey].elements.join(',')"
    v-model="settings.layout.panel[panelKey].elements"
    :animation="100"
    direction="vertical"
    fallback-class="opacity-25"
    :fallback-on-body="true"
    :force-fallback="true"
    :group="{
      name: 'layout-elements',
      pull: true,
      put: (_to, _from, dragEl) => {
        const newElement = dragEl.id as LayoutElementKey

        return isElementAllowedInPanel(props.panelKey, newElement)
      },
    }"
    selected-class="bg-blue-500"
    class="flex flex-col gap-1 relative empty:before:text-sm empty:before:text-muted-foreground empty:before:content-['(hidden,_no_elements_contained)'] empty:before:inset-0 empty:before:absolute"
    @end="
      (evt) => {
        if (evt.from !== evt.to) {
          removeElementFromPanel(props.panelKey, evt.data)
        }
        elementDraggingData = null
      }
    "
    @start="(evt) => (elementDraggingData = { element: evt.data, from: props.panelKey })"
  >
    <UContextMenu
      v-for="element in settings.layout.panel[panelKey].elements"
      :key="element"
    >
      <UContextMenuTrigger as-child>
        <div
          :id="element"
          class="flex w-fit items-center"
        >
          <UButton
            variant="ghost"
            class="duration-0 transition-none justify-start active:text-muted-foreground active:bg-inherit"
            :class="hasSettings(element) ? 'rounded-r-none' : ''"
          >
            <Icon
              name="tabler:grip-vertical"
              class="size-3.5!"
            />
            <p>{{ upperFirst(splitByCase(element).map(flatCase).join(' ')) }}</p>
          </UButton>
          <UButton
            v-if="hasSettings(element)"
            variant="ghost"
            size="icon"
            class="rounded-l-none duration-0 transition-none"
            @click="openElementWindow(element)"
          >
            <Icon
              name="tabler:pencil"
              class="size-3.5!"
            />
          </UButton>
        </div>
      </UContextMenuTrigger>
      <UContextMenuContent>
        <UContextMenuItem @click="removeElementFromPanel(props.panelKey, element)">
          Remove
        </UContextMenuItem>
        <UContextMenuItem @click="openElementWindow(element)"> Edit </UContextMenuItem>
      </UContextMenuContent>
    </UContextMenu>
  </VueDraggable>
</template>
