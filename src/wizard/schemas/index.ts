import { z } from 'zod';

/**
 * 遊戲基本資料 Schema
 */
export const gameInfoSchema = z.object({
  gameName: z
    .string()
    .min(1, '遊戲名稱不可為空')
    .max(50, '遊戲名稱不可超過 50 字'),
  baseBet: z
    .number()
    .min(0.01, '基礎投注必須大於 0')
    .max(10000, '基礎投注不可超過 10000'),
});

export type GameInfoFormData = z.infer<typeof gameInfoSchema>;

/**
 * 符號賠付 Schema
 */
export const symbolPayoutSchema = z.object({
  match3: z.number().min(0, '3連線分數必須 ≥ 0'),
  match4: z.number().min(0, '4連線分數必須 ≥ 0'),
  match5: z.number().min(0, '5連線分數必須 ≥ 0'),
}).refine(
  (data) => data.match3 <= data.match4,
  { message: '4連線分數必須 ≥ 3連線分數', path: ['match4'] }
).refine(
  (data) => data.match4 <= data.match5,
  { message: '5連線分數必須 ≥ 4連線分數', path: ['match5'] }
);

/**
 * 單個符號 Schema
 */
export const symbolSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '符號名稱不可為空'),
  category: z.enum(['high', 'low', 'special']),
  payouts: symbolPayoutSchema,
  appearanceWeight: z.number().min(1, '權重必須 > 0'),
});

export type SymbolFormData = z.infer<typeof symbolSchema>;

/**
 * 符號列表 Schema
 */
export const symbolsSchema = z.array(symbolSchema).min(1, '至少需要一個符號');

/**
 * 單個 Outcome Schema
 */
export const outcomeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '名稱不可為空'),
  multiplierRange: z.object({
    min: z.number().min(0, '最小倍率必須 ≥ 0'),
    max: z.number().min(0, '最大倍率必須 ≥ 0'),
  }).refine(
    (data) => data.min <= data.max,
    { message: '最大倍率必須 ≥ 最小倍率', path: ['max'] }
  ),
  weight: z.number().min(0, '權重必須 ≥ 0'),
});

export type OutcomeFormData = z.infer<typeof outcomeSchema>;

/**
 * Outcome 列表 Schema
 */
export const outcomesSchema = z.array(outcomeSchema).min(1, '至少需要一個 Outcome');

/**
 * 動畫參數 Schema
 */
export const animationConfigSchema = z.object({
  spinSpeed: z.number().min(1).max(50),
  spinDuration: z.number().min(500).max(5000),
  reelStopDelay: z.number().min(50).max(500),
  easeStrength: z.number().min(0).max(1),
  bounceStrength: z.number().min(0).max(1),
});

export type AnimationConfigFormData = z.infer<typeof animationConfigSchema>;

/**
 * 佈局參數 Schema
 */
export const layoutConfigSchema = z.object({
  reelGap: z.number().min(0).max(50),
  symbolScale: z.number().min(0.5).max(2),
  boardScale: z.number().min(0.5).max(2),
});

export type LayoutConfigFormData = z.infer<typeof layoutConfigSchema>;

/**
 * 視覺配置 Schema
 */
export const visualConfigSchema = z.object({
  animation: animationConfigSchema,
  layout: layoutConfigSchema,
});

export type VisualConfigFormData = z.infer<typeof visualConfigSchema>;

/**
 * 模擬配置 Schema
 */
export const simulationConfigSchema = z.object({
  count: z
    .number()
    .min(10, '模擬次數至少 10 次')
    .max(100000, '模擬次數不可超過 100,000 次'),
  poolCap: z
    .number()
    .min(1, '盤池上限至少 1')
    .max(1000, '盤池上限不可超過 1000'),
});

export type SimulationConfigFormData = z.infer<typeof simulationConfigSchema>;

