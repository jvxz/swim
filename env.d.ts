// Shim written by `vp migrate`: tsgolint (the type-aware engine behind `vp check`)
// cannot parse SFCs, so every `.vue` import would otherwise be an unresolved module.
//
// The generated shim used `DefineComponent<{}, {}, unknown>`, which types `$props`
// as `{}` and makes real prop objects look like errors — see `useSortable`. `any`
// keeps `.vue` imports resolvable without inventing a wrong prop type. Editors and
// `vue-tsc` still get the real types from Nuxt's generated declarations.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<any, any, any>
  export default component
}
