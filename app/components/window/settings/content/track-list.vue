<script lang="ts" setup>
const settings = useSettings()

const rowStyle = settings.layout.element.trackList.rowStyle
</script>

<template>
  <WindowSettingsContentLayout title="Track list">
    <div class="flex flex-col gap-2">
      <ULabel> Row style </ULabel>
      <UDropdownMenuRoot>
        <UDropdownMenuTrigger as-child>
          <UButton
            variant="soft"
            class="w-64 justify-between"
          >
            {{ upperFirst(rowStyle) }}
            <Icon name="tabler:chevron-down" />
          </UButton>
        </UDropdownMenuTrigger>
        <UDropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width)">
          <UDropdownMenuRadioGroup v-model:model-value="rowStyle">
            <UDropdownMenuRadioItem value="alternating-background">
              Alternating background
            </UDropdownMenuRadioItem>
            <UDropdownMenuRadioItem value="bordered"> Bordered </UDropdownMenuRadioItem>
            <UDropdownMenuRadioItem value="none"> None </UDropdownMenuRadioItem>
          </UDropdownMenuRadioGroup>
        </UDropdownMenuContent>
      </UDropdownMenuRoot>
    </div>
  </WindowSettingsContentLayout>
</template>
