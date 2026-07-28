import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'

export default defineNuxtPlugin({
  parallel: true,
  setup: setupNuxtTauriPlugin('main', async () => {
    // menu setup derived under MIT from https://github.com/anomalyco/opencode/blob/dev/packages/desktop/src/menu.ts

    const app = await Submenu.new({
      items: [
        await PredefinedMenuItem.new({
          item: { About: null },
        }),
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
        await PredefinedMenuItem.new({
          item: 'Hide',
        }),
        await PredefinedMenuItem.new({
          item: 'HideOthers',
        }),
        await PredefinedMenuItem.new({
          item: 'ShowAll',
        }),
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
        await PredefinedMenuItem.new({
          item: 'Quit',
        }),
      ].filter(Boolean),
      text: 'swim',
    })

    const file = await Submenu.new({
      items: [
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
        await PredefinedMenuItem.new({
          item: 'CloseWindow',
        }),
      ],
      text: 'File',
    })

    const edit = await Submenu.new({
      items: [
        await PredefinedMenuItem.new({
          item: 'Undo',
        }),
        await PredefinedMenuItem.new({
          item: 'Redo',
        }),
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
        await PredefinedMenuItem.new({
          item: 'Cut',
        }),
        await PredefinedMenuItem.new({
          item: 'Copy',
        }),
        await PredefinedMenuItem.new({
          item: 'Paste',
        }),
        await PredefinedMenuItem.new({
          item: 'SelectAll',
        }),
      ],
      text: 'Edit',
    })

    const view = await Submenu.new({
      items: [
        await MenuItem.new({
          action: () => useConsole().createConsoleWindow(),
          id: 'debug-console',
          text: 'Debug Console',
        }),
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
      ],
      text: 'View',
    })

    const help = await Submenu.new({
      items: [
        await PredefinedMenuItem.new({
          item: 'Separator',
        }),
      ],
      text: 'Help',
    })

    const menu = await Menu.new({
      items: [app, file, edit, view, help],
    })

    await menu.setAsAppMenu()
  }),
})
