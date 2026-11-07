import { describe, expect, it } from 'vitest'
import { extractVideoTitle, normalizeVideoTitle } from './video-title'

describe('extractVideoTitle', () => {
  it('优先使用 og:title，并去掉站点后缀', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="三体_腾讯视频" />
        <title>别的标题</title>
      </head></html>
    `
    expect(extractVideoTitle(html)).toBe('三体')
  })

  it('content 写在 property 前面时也能读到', () => {
    const html = `<meta content="漫长的季节" property="og:title">`
    expect(extractVideoTitle(html)).toBe('漫长的季节')
  })

  it('og:title 只是站点名时回落到 title', () => {
    const html = `
      <meta property="og:title" content="腾讯视频" />
      <title>狂飙 - 爱奇艺</title>
    `
    expect(extractVideoTitle(html)).toBe('狂飙')
  })

  it('没有分享标题时使用 title，并连续去掉站点后缀', () => {
    const html = `<title>  入海  _哔哩哔哩_bilibili </title>`
    expect(extractVideoTitle(html)).toBe('入海')
  })

  it('解码标题里的 HTML 实体', () => {
    const html = `<meta property="og:title" content="三体&amp;地球&#39;往事" />`
    expect(extractVideoTitle(html)).toBe("三体&地球'往事")
  })

  it('没有可用标题时返回空字符串', () => {
    expect(extractVideoTitle('<html></html>')).toBe('')
    expect(extractVideoTitle('<title>腾讯视频</title>')).toBe('')
    expect(extractVideoTitle('<title>https://v.qq.com/x/cover/abc.html</title>')).toBe('')
    expect(extractVideoTitle('<title>免费解析</title>')).toBe('')
  })
})

describe('normalizeVideoTitle', () => {
  it('丢掉解析页常见的空壳标题', () => {
    expect(normalizeVideoTitle('VIP视频解析')).toBe('')
    expect(normalizeVideoTitle('about:blank')).toBe('')
    expect(normalizeVideoTitle('v.qq.com')).toBe('')
  })

  it('保留作品名里的连接号', () => {
    expect(normalizeVideoTitle('三体 - 第一季_腾讯视频')).toBe('三体 - 第一季')
  })
})
