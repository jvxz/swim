import type { ExpressionBuilder, ExpressionWrapper, SqlBool } from 'kysely'
import { sql } from 'kysely'

type LibraryTracksEb = ExpressionBuilder<DB, 'library_tracks'>
type LibraryTracksExpr = ExpressionWrapper<DB, 'library_tracks', SqlBool>

export function compileSmartPlaylistGroup(
  eb: LibraryTracksEb,
  group: SmartPlaylistGroup,
): LibraryTracksExpr {
  const conditions = group.items.map((item) =>
    item.type === 'group'
      ? compileSmartPlaylistGroup(eb, item)
      : compileSmartPlaylistRule(eb, item),
  )

  return group.match === 'all' ? eb.and(conditions) : eb.or(conditions)
}

function compileSmartPlaylistRule(eb: LibraryTracksEb, rule: SmartPlaylistRule): LibraryTracksExpr {
  const field = rule.field
  const { type: fieldType } = SMART_PLAYLIST_FIELDS[field]

  if (fieldType === 'text') return compileTextRule(eb, field, rule.operator, rule.value)
  if (fieldType === 'number') return compileNumberRule(eb, field, rule.operator, rule.value)
  return compileDateRule(eb, field, rule.operator, rule.value)
}

function compileTextRule(
  eb: LibraryTracksEb,
  field: SmartPlaylistFieldKey,
  operator: SmartPlaylistOperator,
  value: string,
): LibraryTracksExpr {
  switch (operator) {
    case 'is':
      return eb(field, '=', value)
    case 'is_not':
      return eb(field, '!=', value)
    case 'contains':
      return eb(field, 'like', `%${value}%`)
    case 'not_contains':
      return eb.not(eb(field, 'like', `%${value}%`))
    case 'starts_with':
      return eb(field, 'like', `${value}%`)
    case 'ends_with':
      return eb(field, 'like', `%${value}`)
    case 'is_empty':
      return eb.or([eb(field, 'is', null), eb(field, '=', '')])
    case 'is_not_empty':
      return eb.and([eb(field, 'is not', null), eb(field, '!=', '')])
    default:
      return eb.lit(true)
  }
}

function compileNumberRule(
  eb: LibraryTracksEb,
  field: SmartPlaylistFieldKey,
  operator: SmartPlaylistOperator,
  value: string,
): LibraryTracksExpr {
  if (operator === 'is_empty') return eb(field, 'is', null)
  if (operator === 'is_not_empty') return eb(field, 'is not', null)

  const n = Number.parseFloat(value)
  if (Number.isNaN(n)) return eb.lit(false)

  switch (operator) {
    case 'equals':
      return eb(field, '=', n)
    case 'not_equals':
      return eb(field, '!=', n)
    case 'greater_than':
      return eb(field, '>', n)
    case 'less_than':
      return eb(field, '<', n)
    default:
      return eb.lit(true)
  }
}

function compileDateRule(
  eb: LibraryTracksEb,
  field: SmartPlaylistFieldKey,
  operator: SmartPlaylistOperator,
  value: string,
): LibraryTracksExpr {
  if (operator === 'is_empty') return eb(field, 'is', null)
  if (operator === 'is_not_empty') return eb(field, 'is not', null)

  if (operator === 'in_last_days') {
    const days = Number.parseInt(value, 10)
    if (Number.isNaN(days)) return eb.lit(false)

    return eb(field, '>=', sql<string>`datetime('now', ${`-${days} days`})`)
  }

  if (!value) return eb.lit(false)

  if (operator === 'before') return eb(field, '<', value)
  if (operator === 'after') return eb(field, '>', value)

  return eb.lit(true)
}
