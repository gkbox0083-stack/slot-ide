import type { Board } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { SettlementMeta, WinningLine } from '../types/spin-packet.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';

/**
 * Settlement
 * 結算盤面，計算所有中獎線
 */
export class Settlement {
  constructor(
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) {}

  /**
   * 結算盤面，返回 SettlementMeta
   * @param board 盤面
   * @param outcomeId Outcome ID
   */
  settle(board: Board, outcomeId: string): SettlementMeta {
    const patterns = this.linesManager.getAllPatterns();
    const winningLines: WinningLine[] = [];
    let bestLine: WinningLine | undefined;
    let maxScore = 0;
    let totalScore = 0;

    // 遍歷所有線
    for (let lineIndex = 0; lineIndex < patterns.length; lineIndex++) {
      const pattern = patterns[lineIndex];
      if (!pattern) continue;

      // 取得線上 5 個符號
      const symbols = this.getLineSymbols(board, lineIndex);
      
      // 計算從左到右連續相同符號數
      const match = this.countConsecutive(symbols);
      
      if (match) {
        // 取得這條線的分數
        const payout = this.symbolManager.getPayout(match.symbol, match.count);
        
        // 建立 WinningLine
        const winningLine: WinningLine = {
          lineIndex,
          positions: pattern.positions,
          symbol: match.symbol,
          count: match.count,
          payout,
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

    return {
      outcomeId,
      win: totalScore,  // 所有中獎線的總分
      multiplier: totalScore, // 此階段 multiplier = win
      winningLines,
      bestLine,
    };
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
   * 計算連續相同符號
   * @param symbols 符號陣列
   * @returns { symbol, count } 或 null（如果沒有連續符號）
   */
  private countConsecutive(symbols: SymbolId[]): { symbol: SymbolId; count: number } | null {
    if (symbols.length === 0) {
      return null;
    }

    // 取得第一個符號
    const firstSymbol = symbols[0];
    let count = 1;

    // 從左到右檢查連續相同符號
    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i] === firstSymbol) {
        count++;
      } else {
        // 遇到不同符號，停止
        break;
      }
    }

    // 至少要有 3 個連續符號才算成獎
    if (count >= 3) {
      return {
        symbol: firstSymbol,
        count,
      };
    }

    return null;
  }
}

