import { describe, expect, it } from 'vitest'
import { buildParseUrl, isHttpUrl } from './join-url'

describe('buildParseUrl', () => {
  const videoUrl = 'https://v.qq.com/x/cover/abc.html?ptag=1'

  it('前缀式直接拼接编码后的地址', () => {
    expect(buildParseUrl({ endpoint: 'https://jx.test/?url=', joinMode: 'prefix' }, videoUrl)).toBe(
      `https://jx.test/?url=${encodeURIComponent(videoUrl)}`
    )
  })

  it('模板式替换 {url} 占位符', () => {
    expect(
      buildParseUrl(
        { endpoint: 'https://jx.test/play?u={url}&type=m3u8', joinMode: 'template' },
        videoUrl
      )
    ).toBe(`https://jx.test/play?u=${encodeURIComponent(videoUrl)}&type=m3u8`)
  })

  it('拼接前去掉首尾空白，避免复制粘贴带出的换行', () => {
    expect(
      buildParseUrl({ endpoint: 'https://jx.test/?url=', joinMode: 'prefix' }, `  ${videoUrl}\n`)
    ).toBe(`https://jx.test/?url=${encodeURIComponent(videoUrl)}`)
  })

  it('模板里没有占位符时原样返回，不做隐式拼接', () => {
    expect(buildParseUrl({ endpoint: 'https://jx.test/', joinMode: 'template' }, videoUrl)).toBe(
      'https://jx.test/'
    )
  })

  it('地址里的 $ 不会被当成替换模式吃掉', () => {
    const tricky = 'https://example.com/a$&b'
    expect(
      buildParseUrl({ endpoint: 'https://jx.test/play?u={url}', joinMode: 'template' }, tricky)
    ).toBe(`https://jx.test/play?u=${encodeURIComponent(tricky)}`)
  })
})

describe('isHttpUrl', () => {
  it('接受 http 与 https', () => {
    expect(isHttpUrl('http://example.com/a')).toBe(true)
    expect(isHttpUrl('https://example.com/a?b=c')).toBe(true)
    expect(isHttpUrl('  https://example.com  ')).toBe(true)
  })

  it('拒绝其它协议', () => {
    expect(isHttpUrl('ftp://example.com')).toBe(false)
    expect(isHttpUrl('file:///etc/passwd')).toBe(false)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
  })

  it('拒绝非法输入', () => {
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl('example.com')).toBe(false)
    expect(isHttpUrl('   ')).toBe(false)
  })
})
