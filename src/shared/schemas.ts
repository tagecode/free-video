import { z } from 'zod'

export const joinModeSchema = z.enum(['prefix', 'template'])
export const lineStatusSchema = z.enum(['unknown', 'ok', 'fail', 'timeout', 'unsupported'])
export const themeModeSchema = z.enum(['light', 'dark', 'system'])

export const httpUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }, '请输入 http/https 开头的地址')

export const parseLineInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, '名称不能为空').max(40, '名称最多 40 个字符'),
  endpoint: httpUrlSchema,
  joinMode: joinModeSchema,
  note: z.string().trim().max(200).optional()
})

export const parseLineSchema = parseLineInputSchema.extend({
  id: z.string().min(1),
  builtin: z.boolean(),
  enabled: z.boolean(),
  order: z.number().int(),
  status: lineStatusSchema,
  latencyMs: z.number().nonnegative().optional(),
  checkedAt: z.number().int().optional()
})

export const lineHealthSchema = z.object({
  status: lineStatusSchema,
  latencyMs: z.number().nonnegative().optional(),
  checkedAt: z.number().int()
})

export const settingsSchema = z.object({
  theme: themeModeSchema.default('system'),
  autoFallback: z.boolean().default(true),
  maxFallbackAttempts: z.number().int().min(1).max(10).default(5),
  playTimeoutMs: z.number().int().min(5000).max(60000).default(15000),
  healthTimeoutMs: z.number().int().min(3000).max(20000).default(8000),
  healthCheckIntervalMs: z.number().int().min(0).default(0),
  userAgent: z.string().default(''),
  proxyMode: z.enum(['system', 'none', 'manual']).default('system'),
  proxyUrl: z.string().default(''),
  disclaimerAccepted: z.boolean().default(false),
  lastLineId: z.string().optional()
})

export const historyItemSchema = z.object({
  id: z.string().min(1),
  videoUrl: httpUrlSchema,
  platform: z.string().default('unknown'),
  title: z.string().default(''),
  lineId: z.string().default(''),
  playedAt: z.number().int()
})

export const historyItemInputSchema = z.object({
  videoUrl: httpUrlSchema,
  platform: z.string().default('unknown'),
  title: z.string().default(''),
  lineId: z.string().default('')
})

export const favoriteItemSchema = z.object({
  id: z.string().min(1),
  videoUrl: httpUrlSchema,
  platform: z.string().default('unknown'),
  title: z.string().default(''),
  note: z.string().max(200).optional(),
  createdAt: z.number().int()
})

export const favoriteInputSchema = z.object({
  videoUrl: httpUrlSchema,
  platform: z.string().default('unknown'),
  title: z.string().default(''),
  note: z.string().max(200).optional()
})

export const builtinOverrideSchema = z.object({
  enabled: z.boolean().optional(),
  order: z.number().int().optional(),
  name: z.string().optional()
})

export const linesFileSchema = z.object({
  builtinOverrides: z.record(z.string(), builtinOverrideSchema).default({}),
  custom: z.array(parseLineSchema).default([]),
  health: z.record(z.string(), lineHealthSchema).default({})
})

export const historyFileSchema = z.array(historyItemSchema)
export const favoritesFileSchema = z.array(favoriteItemSchema)

export const windowStateFileSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().default(1440),
  height: z.number().default(900),
  maximized: z.boolean().default(false)
})

export const builtinLineSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  endpoint: httpUrlSchema,
  joinMode: joinModeSchema.default('prefix'),
  note: z.string().optional()
})

export const builtinLineFileSchema = z.array(builtinLineSchema)

export type Settings = z.infer<typeof settingsSchema>
export type JoinMode = z.infer<typeof joinModeSchema>
export type LineStatus = z.infer<typeof lineStatusSchema>
export type ThemeMode = z.infer<typeof themeModeSchema>
export type ParseLine = z.infer<typeof parseLineSchema>
export type ParseLineInput = z.infer<typeof parseLineInputSchema>
export type LineHealth = z.infer<typeof lineHealthSchema>
export type HistoryItem = z.infer<typeof historyItemSchema>
export type HistoryItemInput = z.infer<typeof historyItemInputSchema>
export type FavoriteItem = z.infer<typeof favoriteItemSchema>
export type FavoriteInput = z.infer<typeof favoriteInputSchema>
export type BuiltinLine = z.infer<typeof builtinLineSchema>
export type LinesFile = z.infer<typeof linesFileSchema>
export type WindowStateFile = z.infer<typeof windowStateFileSchema>
