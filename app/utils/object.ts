/** https://docs.tsafe.dev/objectKeys */
export function objectKeys<T extends Record<string, unknown>>(o: T): (keyof T)[] {
  return Object.keys(o) as any
}

/** https://docs.tsafe.dev/objectFromEntries */
export function objectFromEntries<Entry extends readonly [string, any]>(
  entries: readonly Entry[],
): { [Key in Entry[0]]: Extract<Entry, readonly [Key, any]>[1] } {
  return Object.fromEntries(entries) as any
}

/** Return type of objectFromEntries https://docs.tsafe.dev/objectFromEntries */
export type ObjectFromEntries<Entry extends readonly [string, any]> = {
  [Key in Entry[0]]: Extract<Entry, readonly [Key, any]>[1]
}

/** https://docs.tsafe.dev/objectentries */
export function objectEntries<O extends Record<string, any>>(
  o: O,
): Exclude<{ [Key in keyof O]: [Key, O[Key]] }[keyof O], undefined>[] {
  return Object.entries(o) as any
}

/** Return type of objectEntries https://docs.tsafe.dev/objectentries */
export type ObjectEntries<O extends Record<string, any>> = Exclude<
  { [Key in keyof O]: [Key, O[Key]] }[keyof O],
  undefined
>[]

type ArrayOwnKeys<Type extends readonly unknown[]> = Exclude<keyof Type, keyof unknown[]>
type ArrayOwnStringKeys<Type extends readonly unknown[]> = Extract<
  ArrayOwnKeys<Type>,
  string | number
>
type ArrayEntryValue<Type extends readonly unknown[]> = number extends Type['length']
  ? Type[number] | Type[ArrayOwnStringKeys<Type>]
  : Type[ArrayOwnStringKeys<Type>]

/** https://github.com/sindresorhus/ts-extras/blob/main/source/object-values.ts */
export const objectValues = Object.values as {
  <Type extends readonly unknown[]>(value: Type): Array<ArrayEntryValue<Type>>
  <Type extends object>(value: Type): Array<Required<Type>[Extract<keyof Type, string | number>]>
}
