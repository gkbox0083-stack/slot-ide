import type { SymbolId } from './board.js';

/**
 * Symbol 類別
 */
export type SymbolCategory = 'high' | 'low' | 'special';

/**
 * Symbol 定義
 * 包含符號種類、分數、出現機率
 */
export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  category: SymbolCategory;
  payouts: {
    match3: number;  // 3 連線分數
    match4: number;  // 4 連線分數
    match5: number;  // 5 連線分數
  };
  appearanceWeight: number;  // 出現機率權重（控制前端出現機率）
}

