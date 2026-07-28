/// <reference path="test/e2e/globals.d.ts" />

// https://v2.tauri.app/develop/tests/webdriver/example/webdriverio/
import type { ChildProcess } from 'node:child_process'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let tauriDriver: ChildProcess
let exit = false

export function getCapabilities() {
  return [
    {
      maxInstances: 1,
      'tauri:options': {
        application: resolveAppBinaryPath(),
      },
    } as WebdriverIO.Capabilities,
  ]
}

export const config: WebdriverIO.Config = {
  afterSession: () => {
    closeTauriDriver()
  },
  // wait for the invoke function to be available in window object before running tests
  before: async (_capabilities, _specs, browser) => {
    await browser.setTimeout({ script: 60000 })

    await browser.waitUntil(
      async () =>
        (await browser.execute(() => typeof window.__TAURI_INVOKE__ === 'function')) === true,
      { interval: 100, timeout: 10000 },
    )
  },
  // ensure `tauri-driver` so webdriver requests are proxied
  beforeSession: () => {
    tauriDriver = spawn(path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'), [], {
      stdio: [null, process.stdout, process.stderr],
    })

    tauriDriver.on('error', (error) => {
      console.error('tauri-driver error:', error)
      process.exit(1)
    })
    tauriDriver.on('exit', (code) => {
      if (!exit) {
        console.error('tauri-driver exited with code:', code)
        process.exit(1)
      }
    })
  },
  capabilities: getCapabilities(),
  framework: 'mocha',
  // @ts-expect-error - host is not a valid property in the config type
  host: '127.0.0.1',
  maxInstances: 1,
  mochaOpts: {
    timeout: 60000,
    ui: 'bdd',
  },
  onPrepare: () => {
    spawnSync('bun', ['run', 'tauri', 'build', '--debug', '--no-bundle'], {
      cwd: __dirname,
      shell: true,
      stdio: 'inherit',
    })
  },
  port: 4444,
  reporters: ['spec'],
  specs: ['./test/e2e/**/*.ts'],
}

function closeTauriDriver() {
  exit = true
  tauriDriver?.kill()
}

function resolveAppBinaryPath() {
  const release = path.resolve(__dirname, 'src-tauri', 'target', 'release', 'swim')
  const debug = path.resolve(__dirname, 'src-tauri', 'target', 'debug', 'swim')
  const preferred = debug
  const fallback = release

  if (existsSync(preferred)) return preferred

  if (existsSync(fallback)) return fallback

  return preferred
}

function onShutdown(fn: () => void) {
  const cleanup = () => {
    try {
      fn()
    } finally {
      process.exit()
    }
  }

  process.on('exit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('SIGHUP', cleanup)
  process.on('SIGBREAK', cleanup)
}

// ensure `tauri-driver` is closed when test process exits
onShutdown(() => {
  closeTauriDriver()
})
