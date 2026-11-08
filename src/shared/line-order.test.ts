import { describe, expect, it } from 'vitest'
import { moveLineOrder } from './line-order'

const ids = ['a', 'b', 'c']

describe('moveLineOrder', () => {
  it('上移与前一条交换', () => {
    expect(moveLineOrder(ids, 'b', 'up')).toEqual(['b', 'a', 'c'])
  })

  it('下移与后一条交换', () => {
    expect(moveLineOrder(ids, 'b', 'down')).toEqual(['a', 'c', 'b'])
  })

  it('置顶把线路挪到最前，其余顺序不变', () => {
    expect(moveLineOrder(ids, 'c', 'top')).toEqual(['c', 'a', 'b'])
  })

  it('已经在最上或最下时不再改顺序', () => {
    expect(moveLineOrder(ids, 'a', 'top')).toBeNull()
    expect(moveLineOrder(ids, 'a', 'up')).toBeNull()
    expect(moveLineOrder(ids, 'c', 'down')).toBeNull()
  })

  it('找不到线路时不改顺序', () => {
    expect(moveLineOrder(ids, 'missing', 'up')).toBeNull()
  })
})
