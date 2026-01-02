import type { Board } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';

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
 * PoolBuilder
 * 為每個 Outcome 生成符合倍率區間的盤池
 */
export class PoolBuilder {
  private pools: Map<string, Pool> = new Map();
  private defaultCap: number = 100;
  private readonly maxCap: number = 1000;

  constructor(
    private outcomeManager: OutcomeManager,
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) {}

  /**
   * 為所有 Outcome 建立盤池
   * @param cap 盤池上限（預設使用 defaultCap）
   */
  buildPools(cap?: number): BuildResult {
    const targetCap = cap ?? this.defaultCap;
    
    if (targetCap < 1 || targetCap > this.maxCap) {
      throw new Error(`Cap must be between 1 and ${this.maxCap}`);
    }

    const errors: string[] = [];
    const poolStatuses: PoolStatus[] = [];
    const outcomes = this.outcomeManager.getAll();

    // 清空現有盤池
    this.pools.clear();

    for (const outcome of outcomes) {
      const pool: Board[] = [];
      let attempts = 0;
      const maxAttempts = targetCap * 100;

      while (pool.length < targetCap && attempts < maxAttempts) {
        attempts++;

        // 1. 生成隨機盤面
        const board = this.generateRandomBoard();

        // 2. 計算盤面分數
        const score = this.calculateBoardScore(board);

        // 3. 檢查分數是否在 Outcome 倍率區間
        if (score >= outcome.multiplierRange.min && score <= outcome.multiplierRange.max) {
          pool.push(board);
        }
      }

      // 檢查建池結果
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

      // 儲存盤池
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
   * 生成隨機盤面（5x3）
   */
  private generateRandomBoard(): Board {
    const reels: SymbolId[][] = [];

      for (let col = 0; col < 5; col++) {
      const reel: SymbolId[] = [];
      for (let row = 0; row < 3; row++) {
        reel.push(this.symbolManager.drawSymbol());
      }
      reels.push(reel);
    }

    return {
      reels,
      cols: 5,
      rows: 3,
    };
  }

  /**
   * 計算盤面分數（所有中獎線的總分）
   * 遍歷所有線，累加所有中獎線的 payout
   */
  private calculateBoardScore(board: Board): number {
    const patterns = this.linesManager.getAllPatterns();
    let totalScore = 0;

    for (const pattern of patterns) {
      // 計算這條線的連續符號數
      const lineResult = this.calculateLineMatch(board, pattern.positions);

      if (lineResult) {
        // 取得這條線的分數並累加
        const payout = this.symbolManager.getPayout(lineResult.symbol, lineResult.count);
        totalScore += payout;
      }
    }

    return totalScore;
  }

  /**
   * 計算一條線的連續符號數
   * @param board 盤面
   * @param positions 線條位置 [col, row][]
   * @returns { symbol, count } 或 null（如果沒有連續符號）
   */
  private calculateLineMatch(
    board: Board,
    positions: [number, number][]
  ): { symbol: SymbolId; count: number } | null {
    if (positions.length === 0) {
      return null;
    }

    // 取得第一個符號
    const firstPos = positions[0];
    const firstSymbol = board.reels[firstPos[0]][firstPos[1]];
    let count = 1;

    // 從左到右檢查連續相同符號
    for (let i = 1; i < positions.length; i++) {
      const pos = positions[i];
      const symbol = board.reels[pos[0]][pos[1]];

      if (symbol === firstSymbol) {
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

