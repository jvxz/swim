export default defineNuxtPlugin({
  parallel: true,
  setup: () => {
    useEventListener('contextmenu', (e) => !import.meta.dev && e.preventDefault())
  },
})
