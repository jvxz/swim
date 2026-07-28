export const buildCoverUri = createUnrefFn(
  (filePath: string, mode: 'thumbnail' | 'full' = 'thumbnail') => {
    const os = useTauriOsPlatform()

    const prefix = ['windows'].includes(os)
      ? `http://cover-${mode}.localhost`
      : `cover-${mode}://localhost`

    return `${prefix}/${encodeURIComponent(filePath)}`
  },
)
