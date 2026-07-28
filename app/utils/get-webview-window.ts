import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow'

export async function getWebviewWindow(label: string) {
  const webviews = await getAllWebviewWindows()
  return webviews.find((w) => w.label === label)
}
