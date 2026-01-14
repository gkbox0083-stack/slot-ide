import type { Board } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { SettlementMeta, WinningLine } from '../types/spin-packet.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';

/**
 * Settlement（V3 簡化版）
 * 結算盤面，計算所有中獎線 + Scatter 直接賦值
 */
export class Settlement {
  constructor(
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) { }

  /**
   * 結算盤面，返回 SettlementMeta（V3 簡化版）
   * @param board 盤面
   * @param outcomeId Outcome ID
   * @param baseBet 投注金額（用於計算最終獲勝金額）
   */
  settle(
    board: Board,
    outcomeId: string,
    baseBet: number = 1
  ): SettlementMeta {
    const patterns = this.linesManager.getAllPatterns();
    const winningLines: WinningLine[] = [];
    let bestLine: WinningLine | undefined;
    let maxScore = 0;
    let lineScore = 0;
    const symbols = this.symbolManager.getAll();

    // 1. 遍歷所有線計算連線得分
    for (let lineIndex = 0; lineIndex < patterns.length; lineIndex++) {
      const pattern = patterns[lineIndex];
      if (!pattern) continue;

      // 取得線上符號
      const lineSymbolIds = this.getLineSymbols(board, lineIndex);

      // 計算從左到右連續相同符號數（含 Wild 替代）
      const match = this.countConsecutiveWithWild(lineSymbolIds, symbols, pattern.positions);

      if (match) {
        // 取得這條線的分數（倍率 × baseBet）
        const basePayout = this.symbolManager.getPayout(match.symbol, match.count);
        const payout = basePayout * baseBet;

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

        winningLines.push(winningLine);
        lineScore += payout;

        // 更新 best-line
        if (payout > maxScore) {
          maxScore = payout;
          bestLine = winningLine;
        }
      }
    }

    // 2. 計算 Scatter 直接賦值得分（V3 新增）
    const scatterSymbol = symbols.find(s => s.scatterPayoutConfig);
    let scatterPayout = 0;
    let scatterCount = 0;

    if (scatterSymbol?.scatterPayoutConfig) {
      scatterCount = this.countSymbol(board, scatterSymbol.id);
      const config = scatterSymbol.scatterPayoutConfig;

      if (scatterCount >= config.minCount) {
        const multiplier = config.payoutByCount[scatterCount] ?? 0;
        scatterPayout = multiplier * baseBet;
      }
    }

    const totalWin = lineScore + scatterPayout;

    return {
      outcomeId,
      phase: 'base', // V3: 固定為 base，不再有 free 模式
      win: totalWin,
      multiplier: 1, // V3: 固定為 1，移除 FS multiplier
      winningLines,
      bestLine,
      scatterCount,
      scatterPayout,  // V3 新增：Scatter 直接得分
      triggeredFreeSpin: false, // V3: 永遠為 false，不再觸發 FS
    };
  }

  /**
   * 計算盤面上的特定符號數量
   */
  private countSymbol(board: Board, symbolId: SymbolId): number {
    let count = 0;
    for (const reel of board.reels) {
      for (const id of reel) {
        if (id === symbolId) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * 取得指定線的符號
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
   * 計算連續相同符號（含 Wild 替代）
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

    // 如果全是 Wild/Scatter，不計算
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
        count++;
      } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetDef)) {
        count++;
        wildPositions.push(positions[i]);
      } else {
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
 * 計算盤面上的特定符號數量
 */
export function countSymbol(board: Board, symbolId: SymbolId): number {
  let count = 0;
  for (const reel of board.reels) {
    for (const id of reel) {
      if (id === symbolId) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 計算盤面上的 Scatter 數量（相容性保留）
 */
export function countScatters(board: Board, symbols: SymbolDefinition[]): number {
  const scatter = symbols.find(s => s.type === 'scatter');
  return scatter ? countSymbol(board, scatter.id) : 0;
}
