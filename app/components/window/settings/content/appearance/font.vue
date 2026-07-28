<script lang="ts" setup>
import { useFilter } from 'reka-ui'
import type { SystemFont } from 'tauri-plugin-system-fonts-api'
import { getSystemFonts } from 'tauri-plugin-system-fonts-api'

const settings = useSettings()

const fontNameQuery = shallowRef('')
const dropdownOpen = shallowRef(false)

const {
  data: fonts,
  pending: isLoadingFonts,
  refresh,
} = useAsyncData<SystemFont[]>(
  'fonts',
  async () => {
    dropdownOpen.value = false
    const fonts = await getSystemFonts()
    return fonts.sort((a, b) => a.name.localeCompare(b.name))
  },
  {
    default: () => [],
  },
)

const fontsDeduped = useArrayUnique(() => fonts.value.map((font) => font.name))
const { contains } = useFilter({ sensitivity: 'base' })
const filteredFonts = computed(() =>
  fontsDeduped.value.filter((font) => contains(font, fontNameQuery.value)),
)

const currentFontData = computed(() => {
  const font = fonts.value.find((font) => font.name === settings.appearance.font.name)
  if (!font) return null

  const variants = fonts.value.filter((f) =>
    f.fontName.startsWith(font.fontName.split('-').shift() ?? ''),
  )
  return {
    ...font,
    variants,
  }
})

const weight = computed({
  get: () => Number.parseInt(settings.appearance.font.weight),
  set: (value) => (settings.appearance.font.weight = value.toString()),
})

const variants = useArrayUnique(() =>
  !currentFontData.value
    ? []
    : [
        ...currentFontData.value.variants.map((v) => v.style).sort((a, b) => a.localeCompare(b)),
        'Italic',
      ],
)
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <FormSubtitle> Font <USpinner v-if="isLoadingFonts" /> </FormSubtitle>
    <div class="flex flex-col gap-2">
      <FormPrimitive label="Name">
        <div class="flex gap-2 items-center">
          <UComboboxRoot
            v-model:open="dropdownOpen"
            v-model:model-value="settings.appearance.font.name"
            :disabled="!fonts.length"
            class="w-96"
          >
            <UComboboxAnchor class="w-full">
              <UComboboxInput
                v-model="fontNameQuery"
                :disabled="!fonts.length"
                class="flex-1"
              />
              <UComboboxTrigger
                :disabled="!fonts.length"
                class="w-fit"
              />
            </UComboboxAnchor>
            <UComboboxList class="max-h-96">
              <UComboboxViewport>
                <ComboboxVirtualizer
                  v-slot="{ option }"
                  :options="filteredFonts"
                  :estimate-size="24"
                  :text-content="(x) => x"
                >
                  <UComboboxItem :value="option">
                    <span class="truncate">{{ option }}</span>
                  </UComboboxItem>
                </ComboboxVirtualizer>
              </UComboboxViewport>
            </UComboboxList>
          </UComboboxRoot>
          <UButton
            size="icon"
            variant="ghost"
            title="Reload fonts"
            :disabled="isLoadingFonts"
            @click="refresh"
          >
            <Icon
              name="tabler:refresh"
              class="size-4"
            />
          </UButton>
        </div>
      </FormPrimitive>
      <FormPrimitive label="Weight">
        <UNumberFieldRoot
          v-model:model-value="weight"
          class="w-48"
          :max="1000"
          :min="100"
          :step="100"
        >
          <UNumberFieldIncrement />
          <UNumberFieldInput />
          <UNumberFieldDecrement />
        </UNumberFieldRoot>
      </FormPrimitive>
      <FormPrimitive label="Variant">
        <USelectRoot v-model:model-value="settings.appearance.font.variant">
          <USelectTrigger class="w-48">
            {{ settings.appearance.font.variant }}
          </USelectTrigger>
          <USelectContent
            v-if="currentFontData"
            class="min-w-0"
          >
            <USelectItem
              v-for="variant in variants"
              :key="variant"
              :value="variant"
            >
              <USelectItemText>{{ variant }}</USelectItemText>
            </USelectItem>
          </USelectContent>
        </USelectRoot>
      </FormPrimitive>
      <FormPrimitive label="Casing">
        <USelectRoot v-model:model-value="settings.appearance.font.casing">
          <USelectTrigger class="w-48">
            {{ upperFirst(settings.appearance.font.casing) }}
          </USelectTrigger>
          <USelectContent class="min-w-0">
            <USelectItem
              v-for="variant in ['normal', 'lowercase', 'uppercase']"
              :key="variant"
              :value="variant"
            >
              <USelectItemText>{{ upperFirst(variant) }}</USelectItemText>
            </USelectItem>
          </USelectContent>
        </USelectRoot>
      </FormPrimitive>
    </div>
  </div>
</template>
