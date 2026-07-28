import type { Error } from '~/types/tauri-bindings'

export interface ConsoleMessage {
  timestamp: number
  text: string
  type?: 'log' | 'error' | 'warn'
  source?: Error['type']
}

export const useConsole = defineStore(
  'console',
  () => {
    const consoleMessages = shallowRef<ConsoleMessage[]>([])

    const { createWindow: createConsoleWindow, window: consoleWindow } = useTauriWindow('console', {
      title: 'Console',
      url: '/console',
    })

    function emitMessage(message: Omit<ConsoleMessage, 'timestamp'>) {
      if (message.text.trim() === '') return

      consoleMessages.value = [...consoleMessages.value, { ...message, timestamp: Date.now() }]
      // eslint-disable-next-line no-console
      console[message.type ?? 'log'](message.text)
    }

    return {
      consoleMessages,
      consoleWindow,
      createConsoleWindow,
      emitMessage,
    }
  },
  {
    tauri: {
      save: false,
      sync: true,
      syncInterval: 200,
      syncStrategy: 'debounce',
    },
  },
)
