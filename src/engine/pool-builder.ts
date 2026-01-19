import type { Board, BoardConfig } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';

/**
 * Pool 盤池結構
 */
export interface Pool {
  outcomeId: string;
  boards: Board[];
  cap: number;
}

/**
 * Pool 狀態
 */
export interface PoolStatus {
  outcomeId: string;
  outcomeName: string;
  generated: number;
  cap: number;
  isFull: boolean;
}

/**
 * 建池結果
 */
export interface BuildResult {
  success: boolean;
  pools: PoolStatus[];
  errors: string[];
}

/**
 * PoolBuilder（V3 簡化版）
 * 為每個 Outcome 生成符合倍率區間的盤池
 * 移除 FS 期望值計算，改為 Scatter 直接賦值
 */
export class PoolBuilder {
  private pools: Map<string, Pool> = new Map();
  private defaultCap: number = 100;
  private readonly maxCap: number = 10000;
  private boardConfig: BoardConfig = { cols: 5, rows: 3 };

  constructor(
    private outcomeManager: OutcomeManager,
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) { }

  /**
   * 設定盤面配置
   */
  setBoardConfig(config: BoardConfig): void {
    this.boardConfig = config;
    this.pools.clear();
  }

  /**
   * 取得當前盤面配置
   */
  getBoardConfig(): BoardConfig {
    return { ...this.boardConfig };
  }

  /**
   * 為所有 Outcome 建立盤池（V3 簡化版）
   */
  buildPools(cap?: number): BuildResult {
    const targetCap = cap ?? this.defaultCap;

    if (targetCap < 1 || targetCap > this.maxCap) {
      throw new Error(`Cap must be between 1 and ${this.maxCap}`);
    }

    const errors: string[] = [];
    const poolStatuses: PoolStatus[] = [];
    const outcomes = this.outcomeManager.getAll();

    this.pools.clear();

    for (const outcome of outcomes) {
      const pool: Board[] = [];
      let attempts = 0;
      const maxAttempts = targetCap * 100;

      while (pool.length < targetCap && attempts < maxAttempts) {
        attempts++;

        // 1. 生成隨機盤面
        const board = this.generateRandomBoard();

        // 2. 計算盤面分數（連線 + Scatter 直接賦值）
        const score = this.calculateBoardScore(board);

        // 3. 檢查分數是否在 Outcome 倍率區間
        if (score >= outcome.multiplierRange.min && score <= outcome.multiplierRange.max) {
          pool.push(board);
        }
      }

      const generated = pool.length;
      const isFull = generated === targetCap;

      if (generated === 0) {
        errors.push(`「${outcome.name}」無法生成任何盤面，請檢查倍率區間是否合理`);
      } else if (generated < targetCap) {
        if (attempts >= maxAttempts) {
          errors.push(`「${outcome.name}」已達嘗試上限，僅生成 ${generated}/${targetCap} 盤`);
        } else {
          errors.push(`「${outcome.name}」僅生成 ${generated}/${targetCap} 盤，建議調整倍率區間或 Symbol 分數`);
        }
      }

      this.pools.set(outcome.id, {
        outcomeId: outcome.id,
        boards: pool,
        cap: targetCap,
      });

      poolStatuses.push({
        outcomeId: outcome.id,
        outcomeName: outcome.name,
        generated,
        cap: targetCap,
        isFull,
      });
    }

    return {
      success: errors.length === 0,
      pools: poolStatuses,
      errors,
    };
  }

  /**
   * 生成隨機盤面
   * 使用均勻分布，符號權重不影響數學層
   */
  private generateRandomBoard(): Board {
    const { cols, rows } = this.boardConfig;
    const symbols = this.symbolManager.getAll();
    const reels: SymbolId[][] = [];

    for (let col = 0; col < cols; col++) {
      const reel: SymbolId[] = [];
      for (let row = 0; row < rows; row++) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        reel.push(symbols[randomIndex].id);
      }
      reels.push(reel);
    }

    return {
      reels,
      cols,
      rows,
    };
  }

  /**
   * 計算盤面分數（V3 簡化版）
   * = 連線得分 + Scatter 直接賦值
   */
  private calculateBoardScore(board: Board): number {
    const patterns = this.linesManager.getAllPatterns();
    let totalScore = 0;

    // 1. 計算連線得分
    for (const pattern of patterns) {
      const lineResult = this.calculateLineMatch(board, pattern.positions);

      if (lineResult) {
        const payout = this.symbolManager.getPayout(lineResult.symbol, lineResult.count);
        totalScore += payout;
      }
    }

    // 2. 計算 Scatter 直接賦值（V3 新增）
    const symbols = this.symbolManager.getAll();
    const scatterSymbol = symbols.find(s => s.scatterPayoutConfig);

    if (scatterSymbol?.scatterPayoutConfig) {
      const count = this.countSymbol(board, scatterSymbol.id);
      const config = scatterSymbol.scatterPayoutConfig;

      if (count >= config.minCount) {
        totalScore += config.payoutByCount[count] ?? 0;
      }
    }

    return totalScore;
  }

  /**
   * 計算盤面上特定符號的數量
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
   * 計算一條線的連續符號數（含 Wild 替代）
   */
  private calculateLineMatch(
    board: Board,
    positions: [number, number][]
  ): { symbol: SymbolId; count: number } | null {
    if (positions.length === 0) {
      return null;
    }

    // 過濾掉超出當前盤面範圍的位置
    const validPositions = positions.filter(([col, row]) =>
      col < board.cols && row < board.rows
    );

    if (validPositions.length < 3) {
      return null;
    }

    // 取得線上的符號
    const lineSymbols: SymbolId[] = validPositions.map(
      ([col, row]) => board.reels[col][row]
    );

    const symbolDefs = this.symbolManager.getAll();
    const getSymbolDef = (id: SymbolId) => symbolDefs.find(s => s.id === id);

    // 找出目標符號（第一個非 Wild、非 Scatter 的符號）
    let targetId: SymbolId | null = null;
    let targetDef = null;

    for (const id of lineSymbols) {
      const def = getSymbolDef(id);
      if (def && !isWildSymbol(def) && !isScatterSymbol(def)) {
        targetId = id;
        targetDef = def;
        break;
      }
    }

    if (!targetId || !targetDef) {
      return null;
    }

    // 從左到右計算連續數（含 Wild 替代）
    let count = 0;

    for (let i = 0; i < lineSymbols.length; i++) {
      const currentId = lineSymbols[i];
      const currentDef = getSymbolDef(currentId);

      if (!currentDef) {
        break;
      }

      if (currentId === targetId) {
        count++;
      } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetDef)) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 3) {
      return {
        symbol: targetId,
        count,
      };
    }

    return null;
  }

  /**
   * 取得指定 Outcome 的盤池
   */
  getPool(outcomeId: string): Pool | undefined {
    return this.pools.get(outcomeId);
  }

  /**
   * 取得所有盤池狀態
   */
  getAllPoolStatus(): PoolStatus[] {
    const statuses: PoolStatus[] = [];
    const outcomes = this.outcomeManager.getAll();

    for (const outcome of outcomes) {
      const pool = this.pools.get(outcome.id);
      if (pool) {
        statuses.push({
          outcomeId: outcome.id,
          outcomeName: outcome.name,
          generated: pool.boards.length,
          cap: pool.cap,
          isFull: pool.boards.length === pool.cap,
        });
      } else {
        statuses.push({
          outcomeId: outcome.id,
          outcomeName: outcome.name,
          generated: 0,
          cap: this.defaultCap,
          isFull: false,
        });
      }
    }

    return statuses;
  }

  /**
   * 清空所有盤池
   */
  clearPools(): void {
    this.pools.clear();
  }

  /**
   * 從指定盤池隨機抽一個 Board
   */
  drawBoard(outcomeId: string): Board | undefined {
    const pool = this.pools.get(outcomeId);
    if (!pool || pool.boards.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * pool.boards.length);
    return pool.boards[randomIndex];
  }

  /**
   * 取得預設 cap
   */
  getDefaultCap(): number {
    return this.defaultCap;
  }

  /**
   * 設定預設 cap
   */
  setDefaultCap(cap: number): void {
    if (cap < 1 || cap > this.maxCap) {
      throw new Error(`Cap must be between 1 and ${this.maxCap}`);
    }
    this.defaultCap = cap;
  }
}
