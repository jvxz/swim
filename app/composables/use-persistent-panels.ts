export function usePersistentPanels(key: string, defaultPanels: number[]) {
  const tauri = useTauri()

  const storeLayoutPanelsState = useDebounceFn(async (panels: number[]) => {
    await tauri.store.set(`panels:${key}`, panels)
  })

  const layoutPanels = refWithControl<number[]>(
    (tauri.prefs.get(`panels:${key}`) as number[]) ?? defaultPanels,
    {
      onChanged: storeLayoutPanelsState,
    },
  )

  return {
    layoutPanels,
  }
}
