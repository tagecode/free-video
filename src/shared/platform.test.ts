import { describe, expect, it } from 'vitest'
import { detectPlatform, platformLabel } from './platform'

describe('detectPlatform', () => {
  it('识别主流平台', () => {
    expect(detectPlatform('https://v.qq.com/x/cover/abc.html')?.id).toBe('tencent')
    expect(detectPlatform('https://www.iqiyi.com/v_abc.html')?.id).toBe('iqiyi')
    expect(detectPlatform('https://www.bilibili.com/video/BV1xx')?.id).toBe('bilibili')
    expect(detectPlatform('https://www.mgtv.com/b/123.html')?.id).toBe('mgtv')
  })

  it('匹配子域名但不匹配后缀相似的其它域名', () => {
    expect(detectPlatform('https://film.qq.com/abc')?.id).toBe('tencent')
    expect(detectPlatform('https://notiqiyi.com/v_abc.html')).toBeUndefined()
    expect(detectPlatform('https://iqiyi.com.evil.test/abc')).toBeUndefined()
  })

  it('协议与大小写不影响识别', () => {
    expect(detectPlatform('http://V.QQ.COM/x/cover/abc.html')?.id).toBe('tencent')
  })

  it('未收录的站点与非法地址返回 undefined', () => {
    expect(detectPlatform('https://example.com/video')).toBeUndefined()
    expect(detectPlatform('不是一个地址')).toBeUndefined()
    expect(detectPlatform('')).toBeUndefined()
  })
})

describe('platformLabel', () => {
  it('命中时返回中文名，否则回落到未知平台', () => {
    expect(platformLabel('https://www.youku.com/v_show/id_abc.html')).toBe('优酷')
    expect(platformLabel('https://example.com/video')).toBe('未知平台')
  })
})
