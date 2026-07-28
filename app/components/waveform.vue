<script lang="ts" setup>
const props = defineProps<{
  path: string | undefined
  class?: string
}>()

const canvasRef = shallowRef<HTMLCanvasElement | null>(null)
const canvasContainer = useParentElement(canvasRef)
const canvasContainerSize = useElementSize(canvasContainer)
const waveformGroups = shallowRef<number[][]>([])

const HEIGHT_RATIO = 0.7
const TARGET_BINS = canvasContainerSize.width

const { execute: getWaveform, state: waveformData } = useAsyncState(
  async () => props.path && (await $invoke(commands.getWaveform, props.path, 2048)),
  [],
  {
    immediate: true,
    shallow: true,
  },
)

onMounted(() => {
  const canvas = unrefElement(canvasRef.value)!
  const container = unrefElement(canvasContainer.value)!

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
})

watch([canvasContainerSize.width, canvasContainerSize.height], () => {
  if (!waveformData.value) return

  const canvas = unrefElement(canvasRef.value)!
  const container = unrefElement(canvasContainer.value)!

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  repaintWaveform(canvas, waveformData.value)
})

watch(
  () => props.path,
  async () => {
    if (!props.path) return

    const canvas = unrefElement(canvasRef.value)!
    resetWaveform(canvas)
    await getWaveform()
  },
)

watch(waveformData, async (wf) => {
  if (!wf) return

  await until(canvasRef).toBeTruthy()
  const canvas = unrefElement(canvasRef.value)
  if (!canvas) return

  drawWaveform(canvas, wf)
})

function drawWaveform(canvas: HTMLCanvasElement, wf: number[]) {
  const ctx = canvas.getContext('2d')!

  const sourceBins = wf.length / 2
  const binRatio = Number((sourceBins / TARGET_BINS.value).toFixed(3))

  const groups = []
  for (let i = 0; i < TARGET_BINS.value; i++) {
    const start = Math.floor(i * binRatio)
    const end = Math.floor((i + 1) * binRatio)

    let pxMin = 0
    let pxMax = 0

    for (let bin = start; bin < end; bin++) {
      const min = wf[bin * 2]!
      const max = wf[bin * 2 + 1]!

      pxMin = Math.min(pxMin, min) * HEIGHT_RATIO
      pxMax = Math.max(pxMax, max) * HEIGHT_RATIO
    }

    // waveformGroups.value.push([pxMin, pxMax])
    groups.push([pxMin, pxMax])
  }

  const middle = canvas.height / 2

  for (const group of groups) {
    if (!groups) break

    const x = groups.indexOf(group)

    ctx.strokeStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(x, middle)
    ctx.lineTo(x, middle + group[0]!)
    ctx.moveTo(x, middle)
    ctx.lineTo(x, middle + group[1]!)
    ctx.stroke()
  }
}

function resetWaveform(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  waveformGroups.value = []
}

function repaintWaveform(canvas: HTMLCanvasElement, wf: number[]) {
  resetWaveform(canvas)
  drawWaveform(canvas, wf)
}
</script>

<template>
  <canvas
    ref="canvasRef"
    :class="props.class"
    v-bind="$attrs"
    style="image-rendering: pixelated"
  />
</template>
