import { useFuse } from '@vueuse/integrations/useFuse'
import type { FuseResult } from 'fuse.js'

export const useTrackListSearchQuery = createGlobalState(() => {
  const query = ref('')

  useRouter().afterEach(() => (query.value = ''))

  return query
})

export function useTrackListSearch(
  entries: Ref<TrackListEntry[]>,
  input: MaybeRefOrGetter<TrackListInput>,
) {
  const query = useTrackListSearchQuery()

  const { fuse, results: fuseResults } = useFuse(query, entries, {
    fuseOptions: {
      keys: ['tags.TIT2', 'tags.TPE1', 'tags.TALB', 'tags.TYER', 'tags.TCON', 'tags.TRCK', 'name'],
      threshold: 0.35,
    },
  })

  const results = computed(() =>
    query.value ? resultsToEntries(fuseResults.value) : entries.value,
  )

  function resultsToEntries(results: FuseResult<TrackListEntry>[]): TrackListEntry[] {
    const mappedEntries = results.map((result) => result.item)

    return sortTrackList(mappedEntries, toValue(input))
  }

  return {
    fuse,
    query,
    results,
  }
}
