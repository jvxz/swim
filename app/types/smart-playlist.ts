export type SmartPlaylistFieldKey =
  | 'title'
  | 'artist'
  | 'album'
  | 'album_artist'
  | 'genre'
  | 'composer'
  | 'year'
  | 'track_no'
  | 'disc_no'
  | 'date_added'
  | 'last_played'

export type SmartPlaylistFieldType = 'text' | 'number' | 'date'

export const TEXT_OPERATORS = [
  'is',
  'is_not',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'is_empty',
  'is_not_empty',
] as const

export const NUMBER_OPERATORS = [
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
] as const

export const DATE_OPERATORS = [
  'in_last_days',
  'before',
  'after',
  'is_empty',
  'is_not_empty',
] as const

export type SmartPlaylistOperator =
  | (typeof TEXT_OPERATORS)[number]
  | (typeof NUMBER_OPERATORS)[number]
  | (typeof DATE_OPERATORS)[number]

export const OPERATORS_BY_FIELD_TYPE: Record<
  SmartPlaylistFieldType,
  readonly SmartPlaylistOperator[]
> = {
  date: DATE_OPERATORS,
  number: NUMBER_OPERATORS,
  text: TEXT_OPERATORS,
}

export const SMART_PLAYLIST_OPERATOR_LABELS: Record<SmartPlaylistOperator, string> = {
  after: 'is after',
  before: 'is before',
  contains: 'contains',
  ends_with: 'ends with',
  equals: 'is',
  greater_than: 'is greater than',
  in_last_days: 'is in the last (days)',
  is: 'is',
  is_empty: 'is empty',
  is_not: 'is not',
  is_not_empty: 'is not empty',
  less_than: 'is less than',
  not_contains: 'does not contain',
  not_equals: 'is not',
  starts_with: 'starts with',
}

/** Operators that don't take a value. */
export const VALUELESS_OPERATORS = new Set<SmartPlaylistOperator>(['is_empty', 'is_not_empty'])

export const SMART_PLAYLIST_FIELDS: Record<
  SmartPlaylistFieldKey,
  { label: string; type: SmartPlaylistFieldType }
> = {
  album: { label: 'Album', type: 'text' },
  album_artist: { label: 'Album artist', type: 'text' },
  artist: { label: 'Artist', type: 'text' },
  composer: { label: 'Composer', type: 'text' },
  date_added: { label: 'Date added', type: 'date' },
  disc_no: { label: 'Disc #', type: 'number' },
  genre: { label: 'Genre', type: 'text' },
  last_played: { label: 'Last played', type: 'date' },
  title: { label: 'Title', type: 'text' },
  track_no: { label: 'Track #', type: 'number' },
  year: { label: 'Year', type: 'number' },
}

export interface SmartPlaylistRule {
  type: 'rule'
  field: SmartPlaylistFieldKey
  operator: SmartPlaylistOperator
  value: string
}

export interface SmartPlaylistGroup {
  type: 'group'
  match: 'all' | 'any'
  items: (SmartPlaylistRule | SmartPlaylistGroup)[]
}

export function createEmptySmartPlaylistRule(): SmartPlaylistRule {
  return { field: 'artist', operator: 'is', type: 'rule', value: '' }
}

export function createEmptySmartPlaylistGroup(): SmartPlaylistGroup {
  return { items: [], match: 'all', type: 'group' }
}
