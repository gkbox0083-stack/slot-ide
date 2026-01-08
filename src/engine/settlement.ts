import type { Board } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { SettlementMeta, WinningLine } from '../types/spin-packet.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';
import type { FreeSpinMode } from '../types/free-spin.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';

/**
 * Settlement
 * 結算盤面，計算所有中獎線（V2 支援 Wild）
 */
export class Settlement {
  constructor(
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) {}

  /**
   * 結算盤面，返回 SettlementMeta（V2 擴展）
   * @param board 盤面
   * @param outcomeId Outcome ID
   * @param phase 遊戲階段
   * @param multiplier Multiplier 倍率（Free Spin 時使用）
   * @param baseBet 投注金額（用於計算最終獲勝金額）
   */
  settle(
    board: Board,
    outcomeId: string,
    phase: FreeSpinMode = 'base',
    multiplier: number = 1,
    baseBet: number = 1
  ): SettlementMeta {
    const patterns = this.linesManager.getAllPatterns();
    const winningLines: WinningLine[] = [];
    let bestLine: WinningLine | undefined;
    let maxScore = 0;
    let totalScore = 0;
    const symbols = this.symbolManager.getAll();

    // 遍歷所有線
    for (let lineIndex = 0; lineIndex < patterns.length; lineIndex++) {
      const pattern = patterns[lineIndex];
      if (!pattern) continue;

      // 取得線上 5 個符號
      const lineSymbolIds = this.getLineSymbols(board, lineIndex);
      
      // 計算從左到右連續相同符號數（含 Wild 替代）
      const match = this.countConsecutiveWithWild(lineSymbolIds, symbols, pattern.positions);
      
      if (match) {
        // 取得這條線的分數（倍率 × baseBet × multiplier）
        const basePayout = this.symbolManager.getPayout(match.symbol, match.count);
        const payout = basePayout * baseBet * multiplier;
        
        // 建立 WinningLine
        const winningLine: WinningLine = {
          lineIndex,
          positions: pattern.positions.slice(0, match.count) as [number, number][],
          symbol: match.symbol,
          count: match.count,
          payout,
          hasWild: match.wildPositions.length > 0,
          wildPositions: match.wildPositions.length > 0 ? match.wildPositions : undefined,
        };

        // 加入中獎線列表
        winningLines.push(winningLine);
        
        // 累加總分
        totalScore += payout;
        
        // 更新 best-line（分數相同時保留第一個）
        if (payout > maxScore) {
          maxScore = payout;
          bestLine = winningLine;
        }
      }
    }

    // 計算 Scatter 數量
    const scatterCount = this.countScatters(board, symbols);
    
    // 判斷是否觸發 Free Spin（只在 base 模式檢查）
    const scatterDef = symbols.find(isScatterSymbol);
    const triggerCount = scatterDef?.scatterConfig?.triggerCount ?? 3;
    const triggeredFreeSpin = phase === 'base' && scatterCount >= triggerCount;

    return {
      outcomeId,
      phase,
      win: totalScore,
      multiplier,
      winningLines,
      bestLine,
      scatterCount,
      triggeredFreeSpin,
    };
  }

  /**
   * 計算盤面上的 Scatter 數量
   */
  private countScatters(board: Board, symbols: SymbolDefinition[]): number {
    let count = 0;
    
    for (const reel of board.reels) {
      for (const symbolId of reel) {
        const def = symbols.find(s => s.id === symbolId);
        if (def && isScatterSymbol(def)) {
          count++;
        }
      }
    }
    
    return count;
  }

  /**
   * 取得指定線的符號
   * @param board 盤面
   * @param lineIndex 線條索引
   */
  private getLineSymbols(board: Board, lineIndex: number): SymbolId[] {
    const pattern = this.linesManager.getPattern(lineIndex);
    if (!pattern) {
      return [];
    }

    const symbols: SymbolId[] = [];
    for (const [col, row] of pattern.positions) {
      symbols.push(board.reels[col][row]);
    }

    return symbols;
  }

  /**
   * 計算連續相同符號（含 Wild 替代）V2
   * @param symbolIds 符號 ID 陣列
   * @param symbolDefs 符號定義列表
   * @param positions 線路位置
   */
  private countConsecutiveWithWild(
    symbolIds: SymbolId[], 
    symbolDefs: SymbolDefinition[],
    positions: [number, number][]
  ): { symbol: SymbolId; count: number; wildPositions: [number, number][] } | null {
    if (symbolIds.length === 0) {
      return null;
    }

    const getSymbolDef = (id: SymbolId) => symbolDefs.find(s => s.id === id);
    
    // 找出目標符號（第一個非 Wild、非 Scatter 的符號）
    let targetId: SymbolId | null = null;
    let targetDef: SymbolDefinition | null = null;
    
    for (const id of symbolIds) {
      const def = getSymbolDef(id);
      if (def && !isWildSymbol(def) && !isScatterSymbol(def)) {
        targetId = id;
        targetDef = def;
        break;
      }
    }
    
    // 如果全是 Wild/Scatter，不計算（Wild 不單獨成線）
    if (!targetId || !targetDef) {
      return null;
    }
    
    // 從左到右計算連續數（含 Wild 替代）
    let count = 0;
    const wildPositions: [number, number][] = [];
    
    for (let i = 0; i < symbolIds.length; i++) {
      const currentId = symbolIds[i];
      const currentDef = getSymbolDef(currentId);
      
      if (!currentDef) {
        break;
      }
      
      if (currentId === targetId) {
        // 相同符號
        count++;
      } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetDef)) {
        // Wild 替代
        count++;
        wildPositions.push(positions[i]);
      } else {
        // 不匹配，停止
        break;
      }
    }
    
    // 至少 3 連才算中獎
    if (count < 3) {
      return null;
    }
    
    return {
      symbol: targetId,
      count,
      wildPositions,
    };
  }
}

/**
 * 計算盤面上的 Scatter 數量（獨立函式版）
 */
export function countScatters(board: Board, symbols: SymbolDefinition[]): number {
  let count = 0;
  
  for (const reel of board.reels) {
    for (const symbolId of reel) {
      const def = symbols.find(s => s.id === symbolId);
      if (def && isScatterSymbol(def)) {
        count++;
      }
    }
  }
  
  return count;
}
