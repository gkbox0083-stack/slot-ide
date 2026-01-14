import type { SymbolId } from './board.js';

/**
 * Symbol 類別（僅 normal 類型使用）
 */
export type SymbolCategory = 'high' | 'low';

/**
 * Symbol 類型
 */
export type SymbolType = 'normal' | 'wild' | 'scatter';

/**
 * Wild 設定
 */
export interface WildConfig {
  canReplaceNormal: boolean;   // 是否可替代一般符號（預設 true）
  canReplaceSpecial: boolean;  // 是否可替代特殊符號（預設 false）
}

/**
 * Scatter 直接賦值設定 (Simplified V3)
 * 取代原本的 FreeSpinTriggerConfig，Scatter 現在直接給分而非觸發 FS
 */
export interface ScatterPayoutConfig {
  minCount: number;          // 最少需要幾個 (預設 3)
  payoutByCount: {           // 根據數量直接給分 (倍率)
    3?: number;              // 例如: 25 (代表 25x bet)
    4?: number;              // 例如: 50
    5?: number;              // 例如: 100
    6?: number;              // 支援 5x4 盤面
    [key: number]: number | undefined;
  };
}

/**
 * @deprecated 請改用 ScatterPayoutConfig
 * 保留向下相容，將在未來版本移除
 */
export interface FreeSpinTriggerConfig {
  enabled: boolean;
  triggerCount: number;
  freeSpinCount: number;
  enableRetrigger: boolean;
  retriggerSpinCount: number;
  enableMultiplier: boolean;
  multiplierValue: number;
}

/**
 * @deprecated 請改用 ScatterPayoutConfig
 */
export interface ScatterConfig extends Omit<FreeSpinTriggerConfig, 'enabled'> { }

/**
 * Symbol 定義（V3 簡化版）
 * 包含符號種類、分數、出現機率
 */
export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  type: SymbolType;            // 符號類型
  category: SymbolCategory;    // 僅 normal 類型有效
  payouts: {
    match3: number;  // 3 連線分數
    match4: number;  // 4 連線分數
    match5: number;  // 5 連線分數
  };
  // 雙層機率模型
  /** 視覺層權重：影響滾動動畫中符號出現頻率，不影響 RTP */
  appearanceWeight: number;
  /** @deprecated 不影響 Pool 生成，僅供參考/向下相容 */
  ngWeight: number;
  /** @deprecated 不影響 Pool 生成，僅供參考/向下相容 */
  fgWeight: number;
  // 特殊符號設定
  wildConfig?: WildConfig;     // 僅 wild 類型有效
  /** Scatter 直接賦值設定 (V3) */
  scatterPayoutConfig?: ScatterPayoutConfig;
  /** @deprecated 請改用 scatterPayoutConfig */
  scatterConfig?: ScatterConfig;
  /** @deprecated 請改用 scatterPayoutConfig */
  fsTriggerConfig?: FreeSpinTriggerConfig;
}
