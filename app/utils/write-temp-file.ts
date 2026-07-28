import { join, tempDir } from '@tauri-apps/api/path'
import { BaseDirectory, exists, writeFile } from '@tauri-apps/plugin-fs'

let tempPath: string | null = null

async function getTempPath() {
  if (!tempPath) tempPath = await tempDir()

  return tempPath
}

export async function writeTempFile(data: Uint8Array) {
  const hashFn = await getHasher()
  const hash = hashFn(data).toString(16)

  const doesExist = await exists(hash, { baseDir: BaseDirectory.Temp })

  if (!doesExist) await writeFile(hash, data, { baseDir: BaseDirectory.Temp })

  return join(await getTempPath(), hash)
}
