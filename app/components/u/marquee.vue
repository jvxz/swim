<!-- https://github.com/hanzydev/vue-fast-marquee/tree/main/src -->
<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'

interface MarqueeProps {
  /**
   * @description Inline style for the container div
   * @type {CSSProperties}
   * @default {}
   */
  style?: CSSProperties
  /**
   * @description Class name to style the container div
   * @type {any}
   * @default ""
   */
  class?: any
  /**
   * @description Whether to automatically fill blank space in the marquee with copies of the children or not
   * @type {boolean}
   * @default false
   */
  autoFill?: boolean
  /**
   * @description Whether to play or pause the marquee
   * @type {boolean}
   * @default true
   */
  play?: boolean
  /**
   * @description Whether to pause the marquee when hovered
   * @type {boolean}
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * @description Whether to pause the marquee when clicked
   * @type {boolean}
   * @default false
   */
  pauseOnClick?: boolean
  /**
   * @description The direction the marquee is sliding
   * @type {"left" | "right" | "up" | "down"}
   * @default "left"
   */
  direction?: 'left' | 'right' | 'up' | 'down'
  /**
   * @description Speed calculated as pixels/second
   * @type {number}
   * @default 50
   */
  speed?: number
  /**
   * @description Duration to delay the animation after render, in seconds
   * @type {number}
   * @default 0
   */
  delay?: number
  /**
   * @description The number of times the marquee should loop, 0 is equivalent to infinite
   * @type {number}
   * @default 0
   */
  loop?: number
  /**
   * @description Whether to show the gradient or not
   * @type {boolean}
   * @default false
   */
  gradient?: boolean
  /**
   * @description The color of the gradient
   * @type {string}
   * @default "white"
   */
  gradientColor?: string
  /**
   * @description The width of the gradient on either side
   * @type {number | string}
   * @default 200
   */
  gradientWidth?: number | string
  /**
   * @description Only scroll if content overflows the container
   * @type {boolean}
   * @default false
   */
  onlyScrollIfNeeded?: boolean
}

const {
  autoFill = false,
  class: className = '',
  delay = 1,
  direction = 'left',
  gradient = false,
  gradientColor = 'white',
  gradientWidth = 200,
  loop = 0,
  onlyScrollIfNeeded = true,
  pauseOnClick = false,
  pauseOnHover = false,
  play = true,
  speed = 50,
  style = {},
} = defineProps<MarqueeProps>()

const emit = defineEmits<{
  (event: 'finish'): void
  (event: 'cycleComplete'): void
}>()

const containerRef = ref<HTMLDivElement>()
const marqueeRef = ref<HTMLDivElement>()

const containerWidth = ref(0)
const marqueeWidth = ref(0)
const multiplier = ref(1)
const isMounted = ref(false)
const resizeObserver = ref<ResizeObserver>()

const isOverflowing = computed(() => {
  return marqueeWidth.value > containerWidth.value
})

const shouldAnimate = computed(() => {
  if (onlyScrollIfNeeded && !isOverflowing.value) return false

  return play
})

const duration = computed(() => {
  if (autoFill) return (marqueeWidth.value * multiplier.value) / speed
  else {
    return marqueeWidth.value < containerWidth.value
      ? containerWidth.value / speed
      : marqueeWidth.value / speed
  }
})

const containerStyle = computed(() => ({
  ...style,
  '--pause-on-click':
    !shouldAnimate.value || (pauseOnHover && !pauseOnClick) || pauseOnClick ? 'paused' : 'running',
  '--pause-on-hover': !shouldAnimate.value || pauseOnHover ? 'paused' : 'running',
  '--transform':
    direction === 'up' ? 'rotate(-90deg)' : direction === 'down' ? 'rotate(90deg)' : 'none',
  '--width': direction === 'up' || direction === 'down' ? `100vh` : '100%',
}))

const gradientStyle = computed(() => ({
  '--gradient-color': gradientColor,
  '--gradient-width': typeof gradientWidth === 'number' ? `${gradientWidth}px` : gradientWidth,
}))

const marqueeStyle = computed(() => ({
  '--delay': `${delay}s`,
  '--direction': direction === 'left' ? 'normal' : 'reverse',
  '--duration': `${duration.value}s`,
  '--iteration-count': loop ? `${loop}` : 'infinite',
  '--min-width': autoFill ? `auto` : '100%',
  '--play': shouldAnimate.value ? 'running' : 'paused',
}))

const parentStyle = computed(() => ({
  '--transform':
    direction === 'up' ? 'rotate(90deg)' : direction === 'down' ? 'rotate(-90deg)' : 'none',
}))

function calculateWidth() {
  if (marqueeRef.value && containerRef.value) {
    const containerRect = containerRef.value.getBoundingClientRect()
    const marqueeRect = marqueeRef.value.getBoundingClientRect()

    let _containerWidth = containerRect.width
    let _marqueeWidth = marqueeRect.width

    if (direction === 'up' || direction === 'down') {
      _containerWidth = containerRect.height
      _marqueeWidth = marqueeRect.height
    }

    if (autoFill && _containerWidth && _marqueeWidth) {
      multiplier.value =
        _marqueeWidth < _containerWidth ? Math.ceil(_containerWidth / _marqueeWidth) : 1
    } else multiplier.value = 1

    containerWidth.value = _containerWidth
    marqueeWidth.value = _marqueeWidth
  }
}

function multiplyChildren(multiplier: number) {
  return Array.from<number>({
    length: Number.isFinite(multiplier) && multiplier >= 0 ? multiplier : 0,
  })
}

watch([() => autoFill, () => direction, isMounted, containerRef], () => {
  if (isMounted.value) {
    calculateWidth()

    if (marqueeRef.value && containerRef.value) {
      if (resizeObserver.value) resizeObserver.value.disconnect()

      resizeObserver.value = new ResizeObserver(() => calculateWidth())
      resizeObserver.value.observe(containerRef.value)
      resizeObserver.value.observe(marqueeRef.value)
    }
  }
})

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <div
    v-if="isMounted"
    ref="containerRef"
    class="vfm-marquee-container"
    :class="[className]"
    :style="containerStyle"
  >
    <div
      v-if="gradient"
      :style="gradientStyle"
      class="vfm-overlay"
    />
    <div
      class="vfm-marquee"
      :style="marqueeStyle"
      @animationiteration="emit('cycleComplete')"
      @animationend="emit('finish')"
    >
      <div
        ref="marqueeRef"
        :style="parentStyle"
        class="vfm-parent"
      >
        <slot />
      </div>
      <div
        v-for="i in multiplyChildren(shouldAnimate ? multiplier - 1 : 0)"
        :key="i"
        :style="parentStyle"
        class="vfm-parent"
      >
        <slot />
      </div>
    </div>
    <div
      v-if="shouldAnimate"
      class="vfm-marquee"
      :style="marqueeStyle"
    >
      <div
        v-for="_ in multiplyChildren(multiplier)"
        :key="_"
        :style="parentStyle"
        class="vfm-parent"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style>
.vfm-marquee-container {
  overflow-x: hidden;
  display: flex;
  flex-direction: row;
  position: relative;
  width: var(--width);
  transform: var(--transform);
}

.vfm-marquee-container:hover div {
  animation-play-state: var(--pause-on-hover);
}

.vfm-marquee-container:active div {
  animation-play-state: var(--pause-on-click);
}

.vfm-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
}

.vfm-overlay::before,
.vfm-overlay::after {
  background: linear-gradient(to right, var(--gradient-color), rgb(255, 255, 255, 0));
  content: '';
  height: 100%;
  position: absolute;
  width: var(--gradient-width);
  z-index: 2;
  pointer-events: none;
  touch-action: none;
}

.vfm-overlay::after {
  right: 0;
  top: 0;
  transform: rotateZ(180deg);
}

.vfm-overlay::before {
  left: 0;
  top: 0;
}

.vfm-marquee {
  flex: 0 0 auto;
  min-width: var(--min-width);
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  animation: scroll var(--duration) linear var(--delay) var(--iteration-count);
  animation-play-state: var(--play);
  animation-delay: var(--delay);
  animation-direction: var(--direction);
  /* unpromoted transform animations tear in WKWebView, bleeding into
     adjacent siblings sharing the same stacking context (e.g. the
     transport controls next to the title) */
  will-change: transform;
}

@keyframes scroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.vfm-parent {
  flex: 0 0 auto;
  display: flex;
  min-width: auto;
  flex-direction: row;
  align-items: center;
}

.vfm-parent > * {
  transform: var(--transform);
}
</style>
