<template>
  <WindowSettingsContentTabLayout title="General">
    <div class="flex gap-2">
      <USwitch
        id="clickOutsideToDeselect"
        v-model:model-value="$settings.general.clickOutsideToDeselect"
      />
      <ULabel for="clickOutsideToDeselect"> Click outside of track list to deselect </ULabel>
    </div>
  </WindowSettingsContentTabLayout>
</template>
