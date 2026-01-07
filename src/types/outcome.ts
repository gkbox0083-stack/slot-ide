/**
 * 遊戲階段
 */
export type GamePhase = 'ng' | 'fg';

/**
 * Outcome 定義
 * 用於定義倍率區間與權重
 */
export interface Outcome {
  id: string;
  name: string;
  phase: GamePhase;           // 新增：所屬遊戲階段
  multiplierRange: {
    min: number;
    max: number;
  };
  weight: number;  // 抽中權重
}

/**
 * Outcome 配置（NG/FG 分離）
 */
export interface OutcomeConfig {
  ngOutcomes: Outcome[];      // Base Game Outcomes
  fgOutcomes: Outcome[];      // Free Game Outcomes
}
