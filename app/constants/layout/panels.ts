// @unocss-include
/* eslint-disable perfectionist/sort-objects */
export const layoutPanelNames = ['top', 'left', 'main', 'right', 'bottom'] as const

export const layoutPanels = {
  top: {
    allowedElements: ['coverArt', 'player'] as const,
    class: 'h-1/3 w-full bg-muted/25 border-b',
    key: 'top',
    label: 'Top panel',
  },
  left: {
    allowedElements: ['libraryView', 'metadataView', 'coverArt', 'console'] as const,
    class: 'h-full bg-muted/25 w-1/4 border-r',
    key: 'left',
    label: 'Left panel',
  },
  main: {
    allowedElements: ['trackList'] as const,
    class: 'w-1/2 bg-muted/25 mx-auto h-full border-x',
    key: 'main',
    label: 'Main panel',
  },
  right: {
    allowedElements: ['coverArt', 'metadataView', 'libraryView', 'console'] as const,
    class: 'h-full bg-muted/25 ml-auto w-1/4 border-l',
    key: 'right',
    label: 'Right panel',
  },
  bottom: {
    allowedElements: ['player', 'coverArt', 'console'] as const,
    class: 'h-1/3 mt-auto w-full bg-muted/25 border-t',
    key: 'bottom',
    label: 'Bottom panel',
  },
} satisfies Record<
  LayoutPanelKey,
  {
    allowedElements: readonly LayoutElementKey[]
    key: LayoutPanelKey
    class: string
    label: string
  }
>

export type LayoutPanel = (typeof layoutPanels)[LayoutPanelKey]
export type LayoutPanelKey = (typeof layoutPanelNames)[number]

export type LayoutPanelElements<T extends LayoutPanelKey> =
  (typeof layoutPanels)[T]['allowedElements'][number]
export interface LayoutPanelSetting {
  elements: LayoutElementKey[]
  size: number
  elementSizes: number[]
}
