<script lang="ts" setup>
const SYSTEM_DEFAULT = '__system-default__'

const { outputDevice, outputDevices, refreshOutputDevices, setOutputDevice } = usePlayback()

onMounted(refreshOutputDevices)

const selectedDevice = computed({
  get: () => outputDevice.value ?? SYSTEM_DEFAULT,
  set: (value: string) => setOutputDevice(value === SYSTEM_DEFAULT ? null : value),
})

const selectedDeviceLabel = computed(() => {
  if (!outputDevice.value) return 'System default'
  return outputDevice.value
})
</script>

<template>
  <WindowSettingsContentTabLayout title="Playback">
    <div class="flex flex-col gap-2">
      <FormPrimitive label="Output device">
        <div class="flex gap-2 items-center">
          <USelectRoot v-model:model-value="selectedDevice">
            <USelectTrigger class="w-96">
              <span class="truncate">{{ selectedDeviceLabel }}</span>
            </USelectTrigger>
            <USelectContent class="min-w-0">
              <USelectItem :value="SYSTEM_DEFAULT">
                <USelectItemText>System default</USelectItemText>
              </USelectItem>
              <USelectItem
                v-for="device in outputDevices"
                :key="device.name"
                :value="device.name"
              >
                <USelectItemText>
                  {{ device.name }}<span v-if="device.is_default"> (default)</span>
                </USelectItemText>
              </USelectItem>
            </USelectContent>
          </USelectRoot>
          <UButton
            size="icon"
            variant="ghost"
            title="Refresh devices"
            @click="refreshOutputDevices"
          >
            <Icon
              name="tabler:refresh"
              class="size-4"
            />
          </UButton>
        </div>
      </FormPrimitive>
    </div>
  </WindowSettingsContentTabLayout>
</template>
