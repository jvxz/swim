<script lang="ts" setup>
const settings = useSettings()
</script>

<template>
  <WindowSettingsContentTabLayout
    title="Layout"
    class="flex flex-col gap-4 h-full"
  >
    <div class="flex gap-4 justify-between relative">
      <div class="flex flex-col gap-6 w-1/2">
        <WindowSettingsContentLayoutPanels
          v-for="panel in layoutPanels"
          :key="panel.label"
          :panel
        />
      </div>

      <WindowSettingsContentLayoutElements />
    </div>
    <USeparator />
    <div class="shrink-0">
      <div class="flex gap-2 items-center">
        <UCheckbox
          id="allowResizing"
          v-model:model-value="settings.layout.allowResizing"
        />
        <ULabel for="allowResizing"> Allow resizing </ULabel>
      </div>
    </div>
  </WindowSettingsContentTabLayout>
</template>
