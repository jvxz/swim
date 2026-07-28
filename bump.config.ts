import { defineConfig } from 'bumpp'

export default defineConfig({
  commit: false,
  files: ['package.json', 'src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml'],
  push: false,
  release: 'prompt',
  tag: false,
})
