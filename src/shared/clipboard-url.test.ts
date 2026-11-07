import { describe, expect, it } from 'vitest'
import { readClipboardVideoUrl } from './clipboard-url'

describe('readClipboardVideoUrl', () => {
  it('识别剪贴板里的视频页地址', () => {
    expect(readClipboardVideoUrl('  https://v.qq.com/x/cover/abc.html  ')).toBe(
      'https://v.qq.com/x/cover/abc.html'
    )
  })

  it('从一段文字里抽出地址', () => {
    expect(readClipboardVideoUrl('看看这个 https://www.bilibili.com/video/BV1xx 吧')).toBe(
      'https://www.bilibili.com/video/BV1xx'
    )
  })

  it('去掉结尾标点', () => {
    expect(readClipboardVideoUrl('https://www.iqiyi.com/v_abc.html。')).toBe(
      'https://www.iqiyi.com/v_abc.html'
    )
  })

  it('普通网页和空文本不提示', () => {
    expect(readClipboardVideoUrl('https://example.com/a')).toBeNull()
    expect(readClipboardVideoUrl('不是链接')).toBeNull()
    expect(readClipboardVideoUrl('')).toBeNull()
  })
})
