import { describe, expect, it } from 'vitest'
import {
  favoriteInputSchema,
  historyItemInputSchema,
  httpUrlSchema,
  parseLineInputSchema,
  settingsSchema
} from './schemas'

describe('settingsSchema', () => {
  it('空对象套用默认值', () => {
    const settings = settingsSchema.parse({})
    expect(settings.theme).toBe('system')
    expect(settings.autoFallback).toBe(true)
    expect(settings.maxFallbackAttempts).toBe(5)
    expect(settings.playTimeoutMs).toBe(15000)
    expect(settings.healthTimeoutMs).toBe(15000)
    expect(settings.proxyMode).toBe('system')
    expect(settings.disclaimerAccepted).toBe(false)
  })

  it('超时与尝试次数超出范围时报错', () => {
    expect(settingsSchema.safeParse({ playTimeoutMs: 4000 }).success).toBe(false)
    expect(settingsSchema.safeParse({ playTimeoutMs: 60001 }).success).toBe(false)
    expect(settingsSchema.safeParse({ maxFallbackAttempts: 0 }).success).toBe(false)
    expect(settingsSchema.safeParse({ maxFallbackAttempts: 11 }).success).toBe(false)
  })

  it('未知主题取值被拒绝', () => {
    expect(settingsSchema.safeParse({ theme: 'sepia' }).success).toBe(false)
  })
})

describe('httpUrlSchema', () => {
  it('只接受 http/https', () => {
    expect(httpUrlSchema.safeParse('https://v.qq.com/x/cover/abc.html').success).toBe(true)
    expect(httpUrlSchema.safeParse('javascript:alert(1)').success).toBe(false)
    expect(httpUrlSchema.safeParse('example.com').success).toBe(false)
  })
})

describe('parseLineInputSchema', () => {
  const valid = { name: '线路 A', endpoint: 'https://jx.test/?url=', joinMode: 'prefix' as const }

  it('接受合法线路', () => {
    expect(parseLineInputSchema.safeParse(valid).success).toBe(true)
  })

  it('名称必填且有长度上限', () => {
    expect(parseLineInputSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false)
    expect(parseLineInputSchema.safeParse({ ...valid, name: 'a'.repeat(41) }).success).toBe(false)
  })

  it('拼接方式只允许 prefix 与 template', () => {
    expect(parseLineInputSchema.safeParse({ ...valid, joinMode: 'suffix' }).success).toBe(false)
  })
})

describe('historyItemInputSchema / favoriteInputSchema', () => {
  it('缺省字段有默认值', () => {
    const history = historyItemInputSchema.parse({ videoUrl: 'https://v.qq.com/x/cover/abc.html' })
    expect(history.platform).toBe('unknown')
    expect(history.title).toBe('')
    expect(history.lineId).toBe('')
  })

  it('视频地址必须合法', () => {
    expect(historyItemInputSchema.safeParse({ videoUrl: 'not-a-url' }).success).toBe(false)
    expect(favoriteInputSchema.safeParse({ videoUrl: 'not-a-url' }).success).toBe(false)
  })
})
