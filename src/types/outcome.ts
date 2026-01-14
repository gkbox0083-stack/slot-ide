/**
 * Outcome 定義（V3 簡化版）
 * 用於定義倍率區間與權重
 * 移除 NG/FG 分離，統一為單一 Outcome 列表
 */
export interface Outcome {
  id: string;
  name: string;
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;  // 抽中權重
}

/**
 * Outcome 配置（V3 簡化版）
 * 單一 Outcome 列表，不再區分 NG/FG
 */
export type OutcomeConfig = Outcome[];

/**
 * @deprecated 僅供向下相容使用
 */
export type GamePhase = 'ng' | 'fg';

/**
 * @deprecated 僅供向下相容使用
 */
export interface LegacyOutcomeConfig {
  ngOutcomes: Outcome[];
  fgOutcomes: Outcome[];
}
