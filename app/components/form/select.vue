<script lang="ts" setup generic="T extends string">
withDefaults(
  defineProps<{
    disabled?: boolean
    values: T[]
    label: string
    formatUpperFirst?: boolean
    classes?: {
      trigger?: string
      content?: string
    }
  }>(),
  {
    formatUpperFirst: true,
  },
)

const modelValue = defineModel<T>()
</script>

<template>
  <FormPrimitive
    v-if="modelValue"
    :label="label"
    v-bind="$attrs"
  >
    <USelectRoot v-model:model-value="modelValue">
      <USelectTrigger :class="cn('w-lg', $props.classes?.trigger)">
        <USelectValue>
          {{
            formatUpperFirst
              ? upperFirst(splitByCase(modelValue).map(flatCase).join(' '))
              : modelValue
          }}
        </USelectValue>
      </USelectTrigger>
      <USelectContent :class="$props.classes?.content">
        <USelectItem
          v-for="value in values"
          :key="String(value)"
          :value
        >
          <USelectItemText>
            {{ formatUpperFirst ? upperFirst(splitByCase(value).map(flatCase).join(' ')) : value }}
          </USelectItemText>
        </USelectItem>
      </USelectContent>
    </USelectRoot>
  </FormPrimitive>
</template>
