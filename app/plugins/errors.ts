import { listen } from '@tauri-apps/api/event'
import { message } from '@tauri-apps/plugin-dialog'

export default defineNuxtPlugin({
  dependsOn: ['tauri'],
  parallel: true,
  setup: ({ hook }) => {
    const { emitMessage: emitConsoleMessage } = useConsole()

    const emitDialog = useThrottleFn(message, 1000)

    errorHook.on((error) => {
      emitDialog(error.data, { kind: 'error', title: ERROR_TITLE_MAP[error.type] })
      emitConsoleMessage({
        source: error.type,
        text: error.data,
        type: 'error',
      })
    })

    if (windowLabelIs('main')) {
      listen<string>('backend-error', ({ payload }) => {
        const colonIdx = payload.indexOf(':')
        const msg =
          colonIdx !== -1
            ? payload
                .slice(colonIdx + 1)
                .trim()
                .slice(1, -1)
            : payload
        const title =
          objectValues(ERROR_TITLE_MAP).find((t) =>
            payload.slice(0, colonIdx !== -1 ? colonIdx : undefined)?.includes(t),
          ) ?? ERROR_TITLE_MAP.Other

        emitDialog(msg, { kind: 'error', title })
        emitConsoleMessage({
          source: 'Backend',
          text: msg,
          type: 'error',
        })
      })
    }

    hook('vue:error', (err) => {
      if (err instanceof Error) {
        emitDialog(err.message, { kind: 'error', title: ERROR_TITLE_MAP.Other })
        emitConsoleMessage({
          text: err.message,
          type: 'error',
        })
      } else {
        emitDialog(String(err), { kind: 'error', title: ERROR_TITLE_MAP.Other })
        emitConsoleMessage({
          text: String(err),
          type: 'error',
        })
      }
    })
  },
})
