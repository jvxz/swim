import { getCapabilities } from '../../../wdio.conf'

const count = 50

describe('tauri startup behavior', () => {
  it(`successfully starts the app ${count} times`, async () => {
    const capabilities = getCapabilities()
    // needed for reloadSession to work
    // @ts-expect-error - maxInstances is not a valid property in the capabilities type
    delete capabilities[0].maxInstances

    for (let i = 0; i < count; i++) {
      if (i > 0) {
        await browser.reloadSession(capabilities[0])
        await new Promise((r) => setTimeout(r, 400))
      }

      await browser.waitUntil(
        async () =>
          (await browser.execute(() => typeof window.__TAURI_INVOKE__ === 'function')) === true,
        { interval: 100, timeout: 10000 },
      )
    }
  })
})
