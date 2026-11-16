/** 真正的退出流程（托盘退出、更新安装、首启免责声明里的"退出"）开始时置位，
 * 关窗逻辑据此跳过"关闭还是最小化到托盘"的询问，否则退出会被自己拦住。 */
let quitting = false

export function beginQuit(): void {
  quitting = true
}

export function isQuitting(): boolean {
  return quitting
}
