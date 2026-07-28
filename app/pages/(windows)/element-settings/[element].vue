<script lang="ts" setup>
const { params } = useRoute()
const element = 'element' in params ? (params.element as LayoutElementKey) : undefined

const ElementSettings = defineAsyncComponent<VNode>(async () => {
  if (!element) return null

  const filename = kebabCase(element)

  try {
    const component = await import(
      `~/components/window/settings/content/layout/element-settings/${filename}.vue`
    )
    return component
  } catch {
    return h('div', {
      innerHTML: `Please create ~/components/window/settings/content/layout/element-settings/${filename}.vue`,
    })
  }
})
</script>

<template>
  <div class="p-4 flex flex-col gap-4 *:shrink-0">
    <ElementSettings />
  </div>
</template>
