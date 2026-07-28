import * as z from 'zod'

export const LastFmUserSchema = z.object({
  age: z.string(),
  album_count: z.string(),
  artist_count: z.string(),
  bootstrap: z.string(),
  country: z.string(),
  gender: z.string(),
  image: z.array(z.object({ '#text': z.string(), size: z.string() })),
  name: z.string(),
  playcount: z.string(),
  playlists: z.string(),
  realname: z.string(),
  registered: z.object({ '#text': z.number(), unixtime: z.string() }),
  subscriber: z.string(),
  track_count: z.string(),
  type: z.string(),
  url: z.string(),
})

export const LastFmUserGetInfoResponseSchema = z.object({
  user: LastFmUserSchema,
})
export type LastFmProfile = z.infer<typeof LastFmUserGetInfoResponseSchema>['user']
