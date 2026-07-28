import type { XXHashAPI } from 'xxhash-wasm'
import xxhash from 'xxhash-wasm'

let h32Raw: XXHashAPI['h32Raw'] | null = null

export async function getHasher() {
  if (!h32Raw) h32Raw = (await xxhash()).h32Raw

  return (input: Uint8Array) => h32Raw!(input, 0x23232323)
}
