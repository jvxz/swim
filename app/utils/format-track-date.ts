/**
 * Formats a SQLite `CURRENT_TIMESTAMP` value ('YYYY-MM-DD HH:MM:SS', UTC) for display,
 * or the placeholder when the track has no such date.
 */
export function formatTrackDate(value: string | null | undefined) {
  if (!value) return PLACEHOLDER_CHAR

  const { $dayjs } = useNuxtApp()

  return $dayjs(parseISO(value)).format('YYYY-MM-DD HH:mm')
}
