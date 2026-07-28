<script lang="ts" setup>
const monoTokens = ['timestamp', 'message'] as const
</script>

<template>
  <FormSubtitle> Console </FormSubtitle>
  <FormCheckbox
    v-model:model-value="$settings.layout.element.console.wrapText"
    label="Wrap text"
  />
  <FormCheckbox
    v-model:model-value="$settings.layout.element.console.timestamp24Hr"
    label="Use 24-hour format for timestamps"
  />
  <FormPrimitive
    label="Use mono font for:"
    class="pb-2"
  >
    <FormCheckbox
      v-for="token in monoTokens"
      :key="token"
      v-model:model-value="$settings.layout.element.console[`${token}Mono`]"
      :value="token"
      :label="upperFirst(token)"
    />
  </FormPrimitive>
</template>
