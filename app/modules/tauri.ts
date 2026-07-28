import * as tauriApp from '@tauri-apps/api/app'
import * as tauriWebviewWindow from '@tauri-apps/api/webviewWindow'
import * as tauriFs from '@tauri-apps/plugin-fs'
import * as tauriNotification from '@tauri-apps/plugin-notification'
import * as tauriOs from '@tauri-apps/plugin-os'
import * as tauriShell from '@tauri-apps/plugin-shell'
import * as tauriStore from '@tauri-apps/plugin-store'
import { addImports, defineNuxtModule } from 'nuxt/kit'

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const tauriModules = [
  { importPath: '@tauri-apps/api/app', module: tauriApp, prefix: 'App' },
  {
    importPath: '@tauri-apps/api/webviewWindow',
    module: tauriWebviewWindow,
    prefix: 'WebviewWindow',
  },
  { importPath: '@tauri-apps/plugin-shell', module: tauriShell, prefix: 'Shell' },
  { importPath: '@tauri-apps/plugin-os', module: tauriOs, prefix: 'Os' },
  {
    importPath: '@tauri-apps/plugin-notification',
    module: tauriNotification,
    prefix: 'Notification',
  },
  { importPath: '@tauri-apps/plugin-fs', module: tauriFs, prefix: 'Fs' },
  { importPath: '@tauri-apps/plugin-store', module: tauriStore, prefix: 'Store' },
]

export default defineNuxtModule<ModuleOptions>({
  defaults: {
    prefix: 'useTauri',
  },
  meta: {
    configKey: 'tauri',
    name: 'nuxt-tauri',
  },
  setup(options) {
    tauriModules.forEach(({ importPath, module, prefix }) => {
      Object.keys(module)
        .filter((name) => name !== 'default')
        .forEach((name) => {
          const prefixedName = `${options.prefix}${prefix}` || ''
          const as = prefixedName ? prefixedName + capitalize(name) : name
          addImports({ as, from: importPath, name })
        })
    })
  },
})
