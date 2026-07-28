export const checkPlural = createUnrefFn(
  (value: number, plural: string, singular: string = `${plural.slice(0, -1)}s`) => {
    if (value === 1) return singular

    return plural
  },
)
