/// <reference path="../globals.d.ts" />

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | {
      [key: string]: Serializable
    }

export async function $invoke<T>(
  cmd: string,
  payload: Record<string, Serializable>,
): Promise<T | null> {
  return browser.execute(
    async (command: string, args: Record<string, unknown>) => {
      try {
        return await window.__TAURI_INVOKE__(command, args)
      } catch (error: any) {
        return error
      }
    },
    cmd,
    payload,
  )
}
