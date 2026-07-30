export type PlaylistEntry = Prettify<
  FileEntry &
    Selectable<DB['playlist_tracks']> & {
      is_playlist_track: true
    }
>
export type FolderEntry = Prettify<
  FileEntry & {
    is_playlist_track: false
  }
>

export type TrackListEntry = PlaylistEntry | FolderEntry

export type TrackListSortByFrame = {
  [K in keyof typeof ALL_TRACK_LIST_COLUMNS]: (typeof ALL_TRACK_LIST_COLUMNS)[K]['key']
}[keyof typeof ALL_TRACK_LIST_COLUMNS]

export type TrackListEntryType = 'folder' | 'playlist' | 'library'
export type TrackListSortOrder = 'Asc' | 'Desc'

export type TrackListInput =
  | {
      //    ↓ playlist id or folder path
      path: string
      sortBy?: TrackListSortByFrame
      sortOrder: TrackListSortOrder
      type: TrackListEntryType
      //    ↓ 'folder' only: include tracks nested in subfolders
      deep?: boolean
    }
  | {
      //    ↓ library doesn't need a path
      path?: never
      sortBy: TrackListSortByFrame
      sortOrder: TrackListSortOrder
      type: 'library'
    }

export type CurrentPlayingTrack = Prettify<
  TrackListEntry & {
    playback_source: TrackListEntryType
    playback_source_id: string
  }
>

//

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
