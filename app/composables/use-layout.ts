export function useLayout() {
  const settings = useSettings()

  const elementDraggingData = useState<{
    from: LayoutPanelKey | 'AVAILABLE_ELEMENTS'
    element: LayoutElementKey
  } | null>('layout-element-dragging-data', () => null)

  const openElementWindow = async (element: LayoutElementKey) => {
    const { createWindow: createElementWindow, window: elementWindow } = useTauriWindow(
      `${kebabCase(element)}-settings`,
      {
        center: true,
        height: 850,
        title: `${upperFirst(splitByCase(element).map(flatCase).join(' '))} settings`,
        url: `/element-settings/${element}`,
        width: 800,
      },
    )

    await createElementWindow()

    return elementWindow
  }

  function addElementToPanel(panelKey: LayoutPanelKey, elementKey: LayoutElementKey) {
    settings.layout.panel[panelKey].elements.push(elementKey)
  }

  function removeElementFromPanel<T extends LayoutPanelKey>(
    panelKey: T,
    elementKey: LayoutPanelElements<T>,
  ) {
    const panel = settings.layout.panel[panelKey]
    panel.elements = panel.elements.filter((k) => k !== elementKey)
  }

  const handlePanelSizeChange = useDebounceFn(
    (panelKeyOrder: LayoutPanelKey[], sizes: number[]) => {
      for (const [index, panelKey] of panelKeyOrder.entries()) {
        if (!settings.layout.panel[panelKey].elements.length) continue

        if (sizes[index] === undefined) {
          console.error(`Panel ${panelKey} size is undefined`)
          continue
        }

        settings.layout.panel[panelKey].size = sizes[index]
      }
    },
    200,
  )

  const handlePanelElementsSizeChange = useDebounceFn(
    (panelKey: LayoutPanelKey, sizes: number[]) => {
      settings.layout.panel[panelKey].elementSizes = sizes
    },
    200,
  )

  function isElementAllowedInPanel(
    panelKey: LayoutPanelKey,
    elementKey: LayoutElementKey,
  ): boolean {
    const allowedElements = layoutPanels[panelKey].allowedElements as readonly LayoutElementKey[]
    const existingElements = settings.layout.panel[panelKey].elements

    return allowedElements.includes(elementKey) && !existingElements.includes(elementKey)
  }

  return {
    addElementToPanel,
    elementDraggingData,
    handlePanelElementsSizeChange,
    handlePanelSizeChange,
    isElementAllowedInPanel,
    openElementWindow,
    removeElementFromPanel,
  }
}
