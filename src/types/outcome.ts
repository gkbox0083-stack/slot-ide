/**
 * Outcome 定義
 * 用於定義倍率區間與權重
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

