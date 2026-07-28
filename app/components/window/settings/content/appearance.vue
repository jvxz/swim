<script lang="ts" setup>
const themeTokens = ['background', 'border', 'foreground', 'primary', 'surface', 'muted'] as const
</script>

<template>
  <WindowSettingsContentTabLayout title="Appearance">
    <div class="flex flex-col gap-4 max-w-2/3 w-full">
      <FormSubtitle> Theme </FormSubtitle>
      <WindowSettingsContentAppearancePresets />
      <WindowSettingsContentAppearanceColorPicker
        v-for="token in themeTokens"
        :key="token"
        :setting-key="token"
      />
      <WindowSettingsContentAppearanceUi />
      <WindowSettingsContentAppearanceFont />
    </div>
  </WindowSettingsContentTabLayout>
</template>
