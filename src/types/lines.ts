/**
 * LinePattern 線條模式
 * 定義每條線的排列方式
 */
export interface LinePattern {
  id: number;
  positions: [number, number][];  // 5 個位置 [col, row]
}

/**
 * LinesConfig 線條配置
 * 定義線數與所有線條模式
 */
export interface LinesConfig {
  count: number;              // 線數（如 20 條）
  patterns: LinePattern[];    // 每條線的排列方式
}

