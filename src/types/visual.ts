import type { SymbolId } from './board.js';

/**
 * VisualConfig 視覺配置
 * 包含動畫參數與盤面視覺設定
 */
export interface VisualConfig {
  // 動態參數（Animation）
  animation: {
    spinSpeed: number;        // 滾輪轉速
    spinDuration: number;     // 旋轉時長（ms）
    reelStopDelay: number;    // 停輪間隔（ms）
    easeStrength: number;     // 緩停力度（0-1）
    bounceStrength: number;   // 回彈力度（0-1）
  };
  
  // 盤面視覺（Layout）
  layout: {
    reelGap: number;          // 卷軸間距（px）
    symbolScale: number;      // 圖示縮放（0.5-2）
    boardScale: number;       // 盤面縮放（0.5-2）
  };
}

/**
 * AssetsPatch 素材覆蓋
 * 用於上傳自訂素材
 */
export interface AssetsPatch {
  symbols?: Record<SymbolId, string>;  // symbol -> 圖片 URL（與 symbol 種類數量連動）
  board?: string;                       // 盤面底圖
  frame?: string;                       // 盤面框
  background?: string;                  // 背景圖
  character?: string;                   // 人物圖
}

