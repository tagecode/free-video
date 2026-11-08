export type LineMove = 'top' | 'up' | 'down'

/** 按置顶、上移、下移算出新的线路顺序。已经在目标位置时返回 null，避免无意义地写盘。 */
export function moveLineOrder(
  ids: readonly string[],
  id: string,
  action: LineMove
): string[] | null {
  const index = ids.indexOf(id)
  if (index < 0) return null
  if ((action === 'top' || action === 'up') && index === 0) return null
  if (action === 'down' && index === ids.length - 1) return null

  const next = [...ids]
  const target = action === 'top' ? 0 : action === 'up' ? index - 1 : index + 1
  next.splice(index, 1)
  next.splice(target, 0, id)
  return next
}
