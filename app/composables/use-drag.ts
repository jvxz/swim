import { startDrag as startTauriDrag } from '@crabnebula/tauri-plugin-drag'
import { resolveResource } from '@tauri-apps/api/path'

export type DragMetaEntry =
  | {
      key: 'layout-element'
      data: {
        elementKey: LayoutElementKey
        from: LayoutPanelKey | 'AVAILABLE_ELEMENTS'
      }
    }
  | {
      key: 'track-list-entry'
      data: {
        entries: TrackListEntry[]
      }
    }
  | {
      key: 'TEST'
      data: {
        item: {
          id: number
          name: string
        }
      }
    }
  | {
      key: 'UNKNOWN'
      data?: never
    }
  | null

export type DragMetaEntryKey = Extract<DragMetaEntry, { key: unknown }>['key']

interface TauriDragOptions extends Omit<Parameters<typeof startTauriDrag>[0], 'icon'> {
  onEvent?: Parameters<typeof startTauriDrag>[1]
}

const useDragMeta = createGlobalState(() => {
  const meta = shallowRef<DragMetaEntry>(null)

  return { meta }
})

export function useDrag() {
  const { meta } = useDragMeta()

  async function startDrag(newMeta: DragMetaEntry, tauriDragOpts: TauriDragOptions) {
    const icon = await resolveResource('icons/file-light.svg')

    meta.value = newMeta

    await startTauriDrag(
      {
        icon,
        item: tauriDragOpts.item,
      },
      tauriDragOpts.onEvent,
    )
  }

  return {
    dragMeta: meta,
    startDrag,
  }
}
