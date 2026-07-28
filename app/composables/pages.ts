export function usePages() {
  const router = useRouter()
  const { pageCategories } = useAppConfig()

  const routes = router
    .getRoutes()
    .filter((route) => route.name !== 'index' && route.name !== 'all')

  const categorizedRoutes = routes.reduce(
    (acc, route) => {
      const category = (route.meta.category as string) || 'other'
      if (!category) return acc

      if (!acc[category]) {
        acc[category] = {
          children: [],
          icon: pageCategories[category as keyof typeof pageCategories]?.icon || 'i-lucide-folder',
          label: pageCategories[category as keyof typeof pageCategories]?.label,
          to: route.path,
        }
      }

      acc[category].children.push({
        description: route.meta.description as string,
        icon: route.meta.icon || 'i-lucide-file',
        label: (route.meta.name as string) || route.name,
        to: route.path,
      })

      return acc
    },
    {} as Record<string, any>,
  )

  const pages = Object.values(categorizedRoutes)

  return {
    pages,
  }
}
