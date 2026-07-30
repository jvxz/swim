<script lang="ts" setup>
const model = defineModel<SmartPlaylistRule>({ required: true })

defineEmits<{ remove: [] }>()

const fieldType = computed(() => SMART_PLAYLIST_FIELDS[model.value.field].type)
const operators = computed(() => OPERATORS_BY_FIELD_TYPE[fieldType.value])
const isValueless = computed(() => VALUELESS_OPERATORS.has(model.value.operator))

const inputType = computed(() => {
  if (model.value.operator === 'in_last_days') return 'number'
  if (fieldType.value === 'number') return 'number'
  if (fieldType.value === 'date') return 'date'
  return 'text'
})

const fieldProxy = computed({
  get: () => model.value.field,
  set: (field: SmartPlaylistFieldKey) => {
    const newType = SMART_PLAYLIST_FIELDS[field].type
    const sameType = newType === fieldType.value

    model.value = {
      ...model.value,
      field,
      operator: sameType ? model.value.operator : OPERATORS_BY_FIELD_TYPE[newType][0],
      value: sameType ? model.value.value : '',
    }
  },
})

const operatorProxy = computed({
  get: () => model.value.operator,
  set: (operator: SmartPlaylistOperator) => (model.value = { ...model.value, operator }),
})
</script>

<template>
  <div class="flex gap-2 items-center">
    <USelectRoot v-model:model-value="fieldProxy">
      <USelectTrigger class="shrink-0 w-40">
        <USelectValue>{{ SMART_PLAYLIST_FIELDS[model.field].label }}</USelectValue>
      </USelectTrigger>
      <USelectContent>
        <USelectItem
          v-for="(meta, key) in SMART_PLAYLIST_FIELDS"
          :key="key"
          :value="key"
        >
          <USelectItemText>{{ meta.label }}</USelectItemText>
        </USelectItem>
      </USelectContent>
    </USelectRoot>

    <USelectRoot v-model:model-value="operatorProxy">
      <USelectTrigger class="shrink-0 w-48">
        <USelectValue>{{ SMART_PLAYLIST_OPERATOR_LABELS[model.operator] }}</USelectValue>
      </USelectTrigger>
      <USelectContent>
        <USelectItem
          v-for="op in operators"
          :key="op"
          :value="op"
        >
          <USelectItemText>{{ SMART_PLAYLIST_OPERATOR_LABELS[op] }}</USelectItemText>
        </USelectItem>
      </USelectContent>
    </USelectRoot>

    <UInput
      v-if="!isValueless"
      v-model="model.value"
      :type="inputType"
      class="flex-1"
      :placeholder="model.operator === 'in_last_days' ? 'Days' : 'Value'"
    />
    <div
      v-else
      class="flex-1"
    />

    <UButton
      size="icon"
      variant="ghost"
      @click="$emit('remove')"
    >
      <Icon
        name="tabler:trash"
        class="size-3.5!"
      />
    </UButton>
  </div>
</template>
