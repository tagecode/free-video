import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { nativeImage } from 'electron'

/** 应用图标：开发时来自源码目录，打包后来自 extraResources。 */
export function appIcon(): Electron.NativeImage | undefined {
  const file = [
    join(import.meta.dirname, '../../resources/icon.png'),
    join(process.resourcesPath, 'icon.png')
  ].find((candidate) => existsSync(candidate))
  if (!file) return undefined
  const image = nativeImage.createFromPath(file)
  return image.isEmpty() ? undefined : image
}
