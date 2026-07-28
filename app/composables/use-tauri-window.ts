import type { WebviewOptions } from '@tauri-apps/api/webview'
import {
  getAllWebviewWindows,
  getCurrentWebviewWindow,
  WebviewWindow,
} from '@tauri-apps/api/webviewWindow'
import type { WindowOptions } from '@tauri-apps/api/window'
import Color from 'colorjs.io'

export function useTauriWindow(
  label: string,
  options?: Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions,
) {
  const settings = useSettings()
  const isHotLoaded =
    getCurrentWebviewWindow().label === 'main' ? HOT_LOADED_WINDOWS.includes(label) : false

  const backgroundColor = computed(() =>
    new Color(settings.appearance.token.background).toString({ format: 'hex' }),
  )

  const {
    execute: _createWindow,
    state: window,
    ...rest
  } = useAsyncState(
    async () =>
      new WebviewWindow(
        label,
        $defu(options, {
          backgroundColor: backgroundColor.value,
          center: true,
          decorations: true,
          titleBarStyle: 'overlay' as const,
          visible: false,
        } satisfies Omit<WebviewOptions, 'x' | 'y' | 'width' | 'height'> & WindowOptions),
      ),
    null,
    { immediate: isHotLoaded },
  )

  async function createWindow() {
    const webviews = await getAllWebviewWindows()
    const targetWebview = webviews.find((w) => w.label === label)

    if (targetWebview) {
      if (isHotLoaded) targetWebview.show()

      await targetWebview.setFocus()
      return
    }

    await _createWindow()
  }

  return {
    createWindow,
    window,
    ...rest,
  }
}
