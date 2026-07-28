<script lang="ts" setup>
defineProps<{
  disabled?: boolean
  label: string
}>()

const id = useId()

const modelValue = defineModel<boolean>()
</script>

<template>
  <div
    class="flex gap-2 items-center"
    v-bind="$attrs"
  >
    <UCheckbox
      :id
      v-model:model-value="modelValue"
      :disabled
    />
    <ULabel
      :for="id"
      :disabled
    >
      {{ label }}
    </ULabel>
  </div>
</template>
