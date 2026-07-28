import type { DurationUnitType } from 'dayjs/plugin/duration'

interface Opts {
  removeZeroes: boolean
}

export const formatDuration = createUnrefFn(
  (duration: number, unit: DurationUnitType = 'ms', opts: Opts = { removeZeroes: true }) => {
    const { $dayjs } = useNuxtApp()

    const raw = $dayjs.duration(duration, unit).format('H:mm:ss')

    if (opts?.removeZeroes && raw.startsWith('0:')) {
      const [, m, s] = raw.split(':')
      const mNum = Number(m)
      return `${mNum}:${s}`
    }

    return raw
  },
)
