import type { Board, BoardConfig } from '../types/board.js';
import type { SymbolId } from '../types/board.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { SymbolManager } from './symbol-manager.js';
import type { LinesManager } from './lines-manager.js';
import type { FreeSpinTriggerConfig } from '../types/symbol.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';
import {
  calculateFSTriggerProbability,
  calculateExpectedFreeSpins,
} from './rtp-calculator.js';

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
  private boardConfig: BoardConfig = { cols: 5, rows: 3 };

  constructor(
    private outcomeManager: OutcomeManager,
    private symbolManager: SymbolManager,
    private linesManager: LinesManager
  ) { }

  /**
   * 設定盤面配置（V2 新增）
   */
  setBoardConfig(config: BoardConfig): void {
    this.boardConfig = config;
    // 切換盤面配置時清空現有盤池
    this.pools.clear();
  }

  /**
   * 取得當前盤面配置
   */
  getBoardConfig(): BoardConfig {
    return { ...this.boardConfig };
  }

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

        // 2. 計算盤面分數（根據 Outcome 的 phase 決定是否計算 FS 預期價值）
        const score = this.calculateBoardScore(board, outcome.phase);

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
   * 生成隨機盤面（支援 5x3 和 5x4）
   * 使用均勻分布，符號權重不影響數學層
   */
  private generateRandomBoard(): Board {
    const { cols, rows } = this.boardConfig;
    const symbols = this.symbolManager.getAll();
    const reels: SymbolId[][] = [];

    for (let col = 0; col < cols; col++) {
      const reel: SymbolId[] = [];
      for (let row = 0; row < rows; row++) {
        // 均勻分布抽取，不使用權重
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
   * 計算盤面分數（所有中獎線的總分 + FS 預期價值）
   * 遍歷所有線，累加所有中獎線的 payout
   * 如果是 NG 盤面且觸發 FS，加上 Free Spin 的預期價值
   * @param board 盤面
   * @param phase 遊戲階段（ng 或 fg）
   */
  private calculateBoardScore(board: Board, phase: 'ng' | 'fg' = 'ng'): number {
    const patterns = this.linesManager.getAllPatterns();
    let totalScore = 0;

    // 1. 計算連線得分
    for (const pattern of patterns) {
      // 計算這條線的連續符號數
      const lineResult = this.calculateLineMatch(board, pattern.positions);

      if (lineResult) {
        // 取得這條線的分數並累加
        const payout = this.symbolManager.getPayout(lineResult.symbol, lineResult.count);
        totalScore += payout;
      }
    }

    // 2. 僅 NG 盤面計算 Free Spin 觸發價值
    if (phase === 'ng') {
      totalScore += this.calculateFSExpectedValue(board);
    }

    return totalScore;
  }

  /**
   * 計算 Free Spin 預期價值
   * 與 rtp-calculator.ts 使用相同的計算邏輯，確保單一真相來源
   */
  private calculateFSExpectedValue(board: Board): number {
    const symbols = this.symbolManager.getAll();
    const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);

    if (!triggerSymbol?.fsTriggerConfig) {
      return 0;
    }

    const config = triggerSymbol.fsTriggerConfig;
    const count = this.countSymbol(board, triggerSymbol.id);

    if (count < config.triggerCount) {
      return 0;
    }

    // 從 FG Outcomes 計算平均倍率
    const avgFgMultiplier = this.getAvgFgMultiplier();

    // 計算 Multiplier
    const multiplier = config.enableMultiplier ? config.multiplierValue : 1;

    // 計算預期 Spin 次數（與 rtp-calculator.ts 相同邏輯）
    const expectedSpins = this.calculateExpectedSpinsFromConfig(config);

    return expectedSpins * avgFgMultiplier * multiplier;
  }

  /**
   * 計算預期 Spin 次數（含 Retrigger）
   * 使用與 rtp-calculator.ts 相同的二項分布計算
   */
  private calculateExpectedSpinsFromConfig(config: FreeSpinTriggerConfig): number {
    if (!config.enableRetrigger) {
      return config.freeSpinCount;
    }

    // 計算 FG 中的 Retrigger 機率（使用 rtp-calculator.ts 的函式）
    const retriggerProbability = calculateFSTriggerProbability(
      this.symbolManager.getAll(),
      this.boardConfig,
      'fg'
    );

    // 使用 rtp-calculator.ts 的函式計算預期次數
    return calculateExpectedFreeSpins(
      config.freeSpinCount,
      retriggerProbability,
      config.enableRetrigger
    );
  }

  /**
   * 計算盤面上特定符號的數量
   * ⚠️ 假設：Scatter 觸發不受位置限制（全盤面任意位置皆可）
   *    如需位置約束，需擴展 fsTriggerConfig 增加 validReels 屬性
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
   * 取得 FG 平均倍率
   * 從 FG Outcomes 計算加權平均，作為 Free Spin 預期價值的基礎
   */
  private getAvgFgMultiplier(): number {
    const fgOutcomes = this.outcomeManager.getAll().filter(o => o.phase === 'fg');

    if (fgOutcomes.length === 0) {
      return 5; // 預設值，當沒有設定 FG Outcomes 時使用
    }

    // 計算 FG Outcomes 的加權平均倍率
    let totalWeight = 0;
    let weightedSum = 0;

    for (const outcome of fgOutcomes) {
      const avgMultiplier = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
      totalWeight += outcome.weight;
      weightedSum += avgMultiplier * outcome.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 5;
  }

  /**
   * 計算一條線的連續符號數（含 Wild 替代）
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

    // 過濾掉超出當前盤面範圍的位置
    const validPositions = positions.filter(([col, row]) =>
      col < board.cols && row < board.rows
    );

    if (validPositions.length < 3) {
      return null; // 不足 3 個有效位置，無法成獎
    }

    // 取得線上的符號
    const lineSymbols: SymbolId[] = validPositions.map(
      ([col, row]) => board.reels[col][row]
    );

    // 使用與 settlement.ts 相同的 Wild 替代邏輯
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

    // 如果全是 Wild/Scatter，不計算
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
        // 相同符號
        count++;
      } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetDef)) {
        // Wild 替代
        count++;
      } else {
        // 不匹配，停止
        break;
      }
    }

    // 至少要有 3 個連續符號才算成獎
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

