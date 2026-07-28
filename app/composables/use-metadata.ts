import { confirm } from '@tauri-apps/plugin-dialog'
import { dequal } from 'dequal'

type TagMap = Partial<Record<Id3FrameId, string>>

type ProposedMixedFrames = Map<Id3FrameId, string[]>

type ProposedFrameChanges = Partial<{
  [K in Id3FrameId]: {
    value: string
    type: 'set' | 'clear' | null
  }
}>

const createFlattenedChanges = createUnrefFn((tracks: TrackListEntry[] | null | undefined) => {
  const originalTags: TagMap[] | undefined = tracks?.map((t) => t.tags)

  let newFrameChanges: ProposedFrameChanges = {}
  const newMixedFrames: ProposedMixedFrames = new Map()

  originalTags?.forEach((tagMap, idx) => {
    const tags = objectEntries(tagMap)

    if (idx === 0) {
      newFrameChanges = objectFromEntries(
        tags.map(([frame, value]) => [
          frame,
          {
            type: null,
            value: value ?? '',
          },
        ]),
      )
    } else {
      tags.forEach(([frame, value]) => {
        const baselineValue = newFrameChanges[frame]?.value ?? ''

        if (newFrameChanges[frame]?.value !== value) {
          const existingValue = newMixedFrames.get(frame)
          if (!existingValue) newMixedFrames.set(frame, [baselineValue, value ?? ''])
          else existingValue.push(value ?? '')
        } else {
          newFrameChanges[frame] = {
            type: null,
            value: value ?? '',
          }
        }
      })
    }
  })

  newMixedFrames.forEach((_, frame) => delete newFrameChanges[frame])

  return {
    frames: newFrameChanges,
    mixedFrames: newMixedFrames,
  }
})

export const [useProvideMetadata, useMetadataStore] = createInjectionState(
  (tracks: MaybeRefOrGetter<TrackListEntry[] | null | undefined>) => {
    const { refreshTrackData } = useTrackData()

    let baselineFrameChanges: ProposedFrameChanges = {}
    const proposedFrameChanges = ref<ProposedFrameChanges>({})
    const proposedMixedFrames = shallowRef<ProposedMixedFrames>(new Map())

    watch(
      () => toValue(tracks),
      (v) => {
        if (!v) {
          baselineFrameChanges = {}
          proposedFrameChanges.value = {}
          proposedMixedFrames.value = new Map()
        } else _resetChanges()
      },
      { immediate: true },
    )

    /**
     * if there is no track(s), there is nothing to edit
     */
    const isEditable = computed(() => {
      const tracksValue = toValue(tracks)
      if (!tracksValue) return false

      return !!tracksValue.length
    })

    const isEditingMultiple = computed(() => {
      const tracksValue = toValue(tracks)
      if (!tracksValue) return false

      return tracksValue.length > 1
    })

    const isDirty = computed(() => !dequal(proposedFrameChanges.value, baselineFrameChanges))

    const isValueDirty = createUnrefFn((frame: Id3FrameId) => {
      const targetFrame = proposedFrameChanges.value[frame]
      if (targetFrame?.type === null) return false
      else if (targetFrame?.type === 'set' || targetFrame?.type === 'clear')
        return !dequal(baselineFrameChanges[frame], targetFrame)
      else return false
    })

    const isValueBaselineEmpty = createUnrefFn((frame: Id3FrameId) => {
      return baselineFrameChanges[frame]?.value === '' || !baselineFrameChanges[frame]
    })

    function revertChange(frame: Id3FrameId) {
      const targetFrame = proposedFrameChanges.value[frame]
      if (targetFrame) {
        if (baselineFrameChanges[frame])
          proposedFrameChanges.value[frame] = { ...baselineFrameChanges[frame] }
        else delete proposedFrameChanges.value[frame]
      }
    }

    async function revertAllChanges() {
      const confirmation = await confirm('Are you sure you want to revert all changes?', {
        okLabel: 'Revert',
        title: 'Revert all changes',
      })

      if (!confirmation) return

      _resetChanges()
    }

    const { execute: commitChanges, isLoading: isCommittingChanges } = useAsyncState(
      async () => {
        if (!isDirty.value) return

        const confirmation = await confirm('Are you sure you want to commit changes?', {
          okLabel: 'Commit',
          title: 'Commit changes',
        })

        if (!confirmation) return

        const changes = objectEntries(proposedFrameChanges.value).filter(([frame, value]) => {
          // if the value is null or the type is null, no changes were made, skip
          if (!value || value.type === null) return false

          // if the type is set, check if the value is different from the baseline
          if (value.type === 'set') return value.value !== baselineFrameChanges[frame]?.value

          // if the type is clear, return true
          return true
        })
        try {
          for (const track of toValue(tracks) ?? []) {
            await $invoke(
              commands.writeId3Frames,
              track.path,
              // todo: support user-defined tag type
              track.primary_tag ?? 'id3v2.4',
              changes.map(([frame, _value]) => {
                // value is guaranteed to be defined here
                const value = _value!

                // if the type is set, return the value
                if (value.type === 'set') return { frame, value: value.value }

                // type can only be clear here, so return an empty string to clear the frame
                return { frame, value: '' }
              }),
            )
          }
        } catch (err) {
          emitError({
            data: `Failed to commit changes: ${err}`,
            type: 'Other',
          })
        } finally {
          await refreshTrackData(toValue(tracks)?.map((t) => t.path) ?? [])
          _resetChanges()
        }
      },
      undefined,
      { immediate: false },
    )

    function _resetChanges() {
      const { frames, mixedFrames } = createFlattenedChanges(toValue(tracks))
      baselineFrameChanges = frames
      proposedFrameChanges.value = { ...frames }
      proposedMixedFrames.value = mixedFrames
    }

    return {
      commitChanges,
      isCommittingChanges,
      isDirty,
      isEditable,
      isEditingMultiple,
      isValueBaselineEmpty,
      isValueDirty,
      proposedFrameChanges,
      proposedMixedFrames,
      revertAllChanges,
      revertChange,
    }
  },
)
