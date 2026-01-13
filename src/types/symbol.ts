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
 * Free Spin 觸發設定 (V2 通用版)
 */
export interface FreeSpinTriggerConfig {
  enabled: boolean;            // 是否啟用此符號的 FS 觸發
  triggerCount: number;        // 觸發所需數量 (預設 3, 支援 1-6)
  freeSpinCount: number;       // 給予的 Free Spin 次數
  enableRetrigger: boolean;    // 是否支援 Retrigger
  retriggerSpinCount: number;  // Retrigger 額外次數 (預設 5)
  enableMultiplier: boolean;   // 是否啟用 Multiplier
  multiplierValue: number;     // Multiplier 倍率 (預設 2)
}

/**
 * Scatter 設定 (相容性保留，建議改用 fsTriggerConfig)
 */
export interface ScatterConfig extends Omit<FreeSpinTriggerConfig, 'enabled'> { }

/**
 * Symbol 定義（V2 擴展版）
 * 包含符號種類、分數、出現機率
 */
export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  type: SymbolType;            // 新增：符號類型
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
  scatterConfig?: ScatterConfig; // 僅 scatter 類型有效 (已棄用, 建議改用 fsTriggerConfig)
  fsTriggerConfig?: FreeSpinTriggerConfig; // 通用 Free Spin 觸發設定
}
