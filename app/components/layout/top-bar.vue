<template>
  <div class="border-b h-fit">
    <LayoutPanelSplitterGroup
      panel-key="top"
      direction="horizontal"
    >
      <LayoutPanel
        v-for="(element, idx) in $settings.layout.panel.top.elements"
        :key="element"
        :element="element"
        :with-resize-handle="idx !== $settings.layout.panel.top.elements.length - 1"
      />
    </LayoutPanelSplitterGroup>
  </div>
</template>
