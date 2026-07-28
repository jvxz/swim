interface LayoutElement {
  key: LayoutElementKey
  label: string
}

export const layoutPanelElementKeys = [
  'coverArt',
  'libraryView',
  'metadataView',
  'player',
  'trackList',
  'console',
] as const

export const layoutPanelElements: LayoutElement[] = [
  {
    key: 'coverArt',
    label: 'Cover art',
  },
  {
    key: 'libraryView',
    label: 'Library view',
  },
  {
    key: 'metadataView',
    label: 'Metadata view',
  },
  {
    key: 'player',
    label: 'Player',
  },
  {
    key: 'trackList',
    label: 'Track list',
  },
  {
    key: 'console',
    label: 'Console',
  },
]

export interface LayoutElementSettings extends Record<LayoutElementKey, unknown> {
  libraryView: {
    showFolders: boolean
  }
  metadataView: {
    frames: Id3FrameId[]
    frameCommHeight: number
    trackToView: 'current-playing-track' | 'selected-tracks'
  }
  player: {
    seekBarThickness: number
    seekBarThumbShape: 'line' | 'circle'
    showTrackCover: boolean
    roundTrackCover: boolean
    titlePosition: 'center' | 'left'
    marqueeText: boolean
    controlsPosition: 'left' | 'center' | 'right'
  }
  trackList: {
    rowStyle: 'bordered' | 'alternating' | 'none'
    columnFields: TrackListColumn['key'][]
    showScrollbarGutter: boolean
    deriveYearFromTDRC: boolean
    persistScroll: boolean
  }
  coverArt: unknown
  console: {
    messageMono: boolean
    timestampMono: boolean
    wrapText: boolean
    timestamp24Hr: boolean
    // filterSources: Error['type'][]
  }
}

export const defaultLayoutElementSettings = {
  console: {
    // filterSources: [],
    messageMono: false,
    timestamp24Hr: false,
    timestampMono: true,
    wrapText: true,
  },
  coverArt: {},
  libraryView: {
    showFolders: true,
  },
  metadataView: {
    frameCommHeight: 16,
    frames: ['TIT2', 'TPE1', 'TALB', 'TPE2'],
    trackToView: 'selected-tracks',
  },
  player: {
    controlsPosition: 'left',
    marqueeText: true,
    roundTrackCover: true,
    seekBarThickness: 2,
    seekBarThumbShape: 'circle',
    showTrackCover: true,
    titlePosition: 'left',
  },
  trackList: {
    columnFields: ['APIC', 'CURRENTLY_PLAYING', 'TIT2', 'TPE1', 'TALB', 'TYER', 'TCON', 'TRCK'],
    deriveYearFromTDRC: true,
    persistScroll: true,
    rowStyle: 'bordered',
    showScrollbarGutter: true,
  },
} satisfies LayoutElementSettings

export type LayoutElementKey = (typeof layoutPanelElementKeys)[number]

export type LayoutElementSetting<T extends LayoutElementKey = LayoutElementKey> =
  LayoutElementSettings[T]
