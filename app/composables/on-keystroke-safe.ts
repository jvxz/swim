import type { MagicKeysInternal, UseMagicKeysOptions } from '@vueuse/core'
import type { ShallowRef } from 'vue'

interface Options extends UseMagicKeysOptions<false> {
  /**
   * The active element to check if the keystroke is being used in an input or textarea
   *
   * If not provided, the active element will be detected automatically
   */
  activeElement?: ShallowRef<HTMLElement | null | undefined, HTMLElement | null | undefined>
  magicKeys?: Readonly<Record<string, globalThis.ComputedRef<boolean>> & MagicKeysInternal>
  /**
   * CSS selectors to ignore safety checks
   */
  ignore?: string[]
}

const INPUT_TAGS = ['input', 'textarea', 'button', 'select']

export function onKeyStrokeSafe(
  keystroke: string | string[],
  callback: () => void,
  options?: Options,
) {
  const keys = options?.magicKeys ?? useGlobalKeys(options)
  const activeElement = options?.activeElement ?? useActiveElement()

  if (Array.isArray(keystroke)) {
    keystroke.forEach((key) => {
      whenever(
        () => keys[key]?.value,
        () => {
          const isInInput = INPUT_TAGS.includes(activeElement.value?.tagName.toLowerCase() ?? '')
          const isInWhitelisted = options?.ignore?.some((selector) =>
            activeElement.value?.matches(selector),
          )

          if (isInInput && !isInWhitelisted) return

          callback()
        },
      )
    })
  } else {
    whenever(
      () => keys[keystroke]?.value,
      () => {
        const isInInput = INPUT_TAGS.includes(activeElement.value?.tagName.toLowerCase() ?? '')
        const isInWhitelisted = options?.ignore?.some((selector) =>
          activeElement.value?.matches(selector),
        )

        if (isInInput && !isInWhitelisted) return

        callback()
      },
    )
  }
}
