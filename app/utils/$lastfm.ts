import { fetch } from '@tauri-apps/plugin-http'
import type { z } from 'zod'

import { LastFmUserGetInfoResponseSchema } from './lastfm/schema'

type LastFmFetchMethod = keyof LastFmFetchQuery

interface LastFmFetchQuery {
  'user.getInfo': {
    method: 'user.getInfo'
    user: string
  }
}

const LAST_FM_RESPONSE_SCHEMAS = {
  'user.getInfo': LastFmUserGetInfoResponseSchema,
}

interface LastFmFetchOptions<T extends LastFmFetchMethod> {
  query: Omit<LastFmFetchQuery[T], 'method'>
}

export async function $lastfm<T extends LastFmFetchMethod>(
  method: T,
  opts: LastFmFetchOptions<T>,
): Promise<z.ZodSafeParseResult<z.infer<(typeof LAST_FM_RESPONSE_SCHEMAS)[T]>>> {
  const params = new URLSearchParams({
    api_key: import.meta.env.VITE_LAST_FM_API_KEY,
    format: 'json',
    method,
    ...opts.query,
  } as Record<string, string>)

  const response = await fetch(`http://ws.audioscrobbler.com/2.0/?${params.toString()}`, {
    method: 'GET',
  })

  if (!response.ok) {
    emitError({
      data: `Failed to reach Last.fm servers: ${response.statusText} (${response.status})`,
      type: 'LastFm',
    })
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  return LAST_FM_RESPONSE_SCHEMAS[method].safeParse(data)
}
