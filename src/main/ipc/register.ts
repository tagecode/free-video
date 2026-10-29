import { type IpcChannel, type IpcArgs, type IpcReturn } from '@shared/ipc'
import { ipcMain } from 'electron'

export function handle<K extends IpcChannel>(
  channel: K,
  handler: (...args: IpcArgs<K>) => IpcReturn<K> | Promise<IpcReturn<K>>
): void {
  ipcMain.removeHandler(channel)
  ipcMain.handle(channel, (_event, ...args) => handler(...(args as IpcArgs<K>)))
}
