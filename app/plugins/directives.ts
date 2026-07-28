export default defineNuxtPlugin({
  parallel: true,
  setup: ({ vueApp }) => {
    vueApp.directive('no-autocorrect', {
      mounted(el: HTMLElement) {
        const inputs = el.matches('input, textarea, [contenteditable]')
          ? [el]
          : el.querySelectorAll('input, textarea, [contenteditable]')

        inputs.forEach((input) => {
          input.setAttribute('autocomplete', 'off')
          input.setAttribute('autocorrect', 'off')
          input.setAttribute('autocapitalize', 'off')
          input.setAttribute('spellcheck', 'false')
        })
      },
    })

    vueApp.directive('esc-blur', {
      mounted(el: HTMLElement) {
        useEventListener('keydown', (e) => {
          if (e.key === 'Escape') el.blur()
        })
      },
    })
  },
})
