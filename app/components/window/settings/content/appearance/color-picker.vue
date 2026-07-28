<script lang="ts" setup>
import Color from 'colorjs.io'

const { settingKey } = defineProps<{
  settingKey: keyof Settings['appearance']['token']
}>()

const settings = useSettings()

const label = computed(() => upperFirst(settingKey.split('.').pop()!))

const isColorValid = shallowRef(true)

const colorPicker = shallowRef<HTMLInputElement | null>(null)
function handleColorPickerClick() {
  if (!colorPicker.value) return
  colorPicker.value?.click()
}

const localColor = refWithControl(settings.appearance.token[settingKey], {
  onBeforeChange: (color) => {
    try {
      Color.parse(color)
      settings.appearance.token[settingKey] = color
      isColorValid.value = true
    } catch {
      isColorValid.value = false
    }
  },
})

const borderColor = computed(() => {
  try {
    const color = Color.parse(settings.appearance.token[settingKey])

    return Color.lighten(color, 0.5).toString()
  } catch {
    return 'transparent'
  }
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <ULabel class="text-sm">
      {{ label }}
    </ULabel>
    <div class="flex gap-1 items-center relative">
      <UButton
        class="aspect-square"
        :style="{
          backgroundColor: settings.appearance.token[settingKey],
          borderColor,
        }"
        tabindex="-1"
        @click="handleColorPickerClick"
      />
      <input
        ref="colorPicker"
        v-model="localColor"
        type="color"
        class="invisible inset-0 absolute -left-2"
      />
      <UInput
        v-model="localColor"
        :class="{
          'border-danger': !isColorValid,
        }"
      />
    </div>
  </div>
</template>
