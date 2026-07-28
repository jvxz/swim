<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <div
      data-tauri-drag-region
      class="border-b bg-background shrink-0 h-[28px] w-full"
    />
    <slot />
  </div>
</template>
