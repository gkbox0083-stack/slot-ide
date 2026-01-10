import type { SymbolDefinition } from '../types/symbol.js';
import type { SymbolId } from '../types/board.js';

/**
 * SymbolManager
 * 管理符號（種類、分數、出現權重）
 */
export class SymbolManager {
  private symbols: SymbolDefinition[] = [];

  constructor() {
    // 載入預設 Symbol
    this.loadDefaults();
  }

  /**
   * 載入預設 Symbol（V2 擴展）
   */
  private loadDefaults(): void {
    this.symbols = [
      {
        id: 'H1',
        name: '高分1',
        type: 'normal',
        category: 'high',
        payouts: {
          match3: 50,
          match4: 200,
          match5: 1000,
        },
        appearanceWeight: 5,
        ngWeight: 5,
        fgWeight: 5,
      },
      {
        id: 'H2',
        name: '高分2',
        type: 'normal',
        category: 'high',
        payouts: {
          match3: 40,
          match4: 150,
          match5: 800,
        },
        appearanceWeight: 6,
        ngWeight: 6,
        fgWeight: 6,
      },
      {
        id: 'H3',
        name: '高分3',
        type: 'normal',
        category: 'high',
        payouts: {
          match3: 30,
          match4: 100,
          match5: 500,
        },
        appearanceWeight: 8,
        ngWeight: 8,
        fgWeight: 8,
      },
      {
        id: 'L1',
        name: '低分1',
        type: 'normal',
        category: 'low',
        payouts: {
          match3: 10,
          match4: 30,
          match5: 100,
        },
        appearanceWeight: 15,
        ngWeight: 15,
        fgWeight: 15,
      },
      {
        id: 'L2',
        name: '低分2',
        type: 'normal',
        category: 'low',
        payouts: {
          match3: 10,
          match4: 30,
          match5: 100,
        },
        appearanceWeight: 15,
        ngWeight: 15,
        fgWeight: 15,
      },
      {
        id: 'L3',
        name: '低分3',
        type: 'normal',
        category: 'low',
        payouts: {
          match3: 5,
          match4: 15,
          match5: 50,
        },
        appearanceWeight: 20,
        ngWeight: 20,
        fgWeight: 20,
      },
      {
        id: 'L4',
        name: '低分4',
        type: 'normal',
        category: 'low',
        payouts: {
          match3: 5,
          match4: 15,
          match5: 50,
        },
        appearanceWeight: 20,
        ngWeight: 20,
        fgWeight: 20,
      },
      // Wild 符號
      {
        id: 'WILD',
        name: '百搭',
        type: 'wild',
        category: 'high',
        payouts: { match3: 0, match4: 0, match5: 0 },
        appearanceWeight: 5,
        ngWeight: 5,
        fgWeight: 15,
        wildConfig: { canReplaceNormal: true, canReplaceSpecial: false },
      },
      // Scatter 符號
      {
        id: 'SCATTER',
        name: '分散',
        type: 'scatter',
        category: 'high',
        payouts: { match3: 0, match4: 0, match5: 0 },
        appearanceWeight: 3,
        ngWeight: 3,
        fgWeight: 5,
        scatterConfig: {
          triggerCount: 3,
          freeSpinCount: 10,
          enableRetrigger: true,
          retriggerSpinCount: 5,
          enableMultiplier: true,
          multiplierValue: 2
        },
      },
    ];
  }

  /**
   * 取得所有 Symbol
   */
  getAll(): SymbolDefinition[] {
    return [...this.symbols];
  }

  /**
   * 根據 ID 取得單一 Symbol
   */
  getById(id: SymbolId): SymbolDefinition | undefined {
    return this.symbols.find((symbol) => symbol.id === id);
  }

  /**
   * 新增 Symbol
   */
  add(symbol: SymbolDefinition): SymbolDefinition {
    // 檢查 ID 是否已存在
    if (this.getById(symbol.id)) {
      throw new Error(`Symbol with id "${symbol.id}" already exists`);
    }
    this.symbols.push(symbol);
    return symbol;
  }

  /**
   * 修改 Symbol
   */
  update(symbol: SymbolDefinition): boolean {
    const index = this.symbols.findIndex((s) => s.id === symbol.id);
    if (index === -1) {
      return false;
    }
    this.symbols[index] = symbol;
    return true;
  }

  /**
   * 刪除 Symbol
   */
  remove(id: SymbolId): boolean {
    const index = this.symbols.findIndex((s) => s.id === id);
    if (index === -1) {
      return false;
    }
    this.symbols.splice(index, 1);
    return true;
  }

  /**
   * 設定所有 Symbols（完整替換）
   * 用於從 Store 同步設定
   */
  setSymbols(symbols: SymbolDefinition[]): void {
    this.symbols = [...symbols];
  }

  /**
   * 取得指定符號的連線分數
   * @param id 符號 ID
   * @param count 連線數量
   * @returns 分數（count < 3 返回 0）
   */
  getPayout(id: SymbolId, count: number): number {
    const symbol = this.getById(id);
    if (!symbol) {
      return 0;
    }

    if (count < 3) {
      return 0;
    } else if (count === 3) {
      return symbol.payouts.match3;
    } else if (count === 4) {
      return symbol.payouts.match4;
    } else {
      // count >= 5
      return symbol.payouts.match5;
    }
  }

  /**
   * 計算總權重（使用 appearanceWeight，視覺層）
   */
  private getTotalWeight(): number {
    return this.symbols.reduce((sum, symbol) => sum + symbol.appearanceWeight, 0);
  }

  /**
   * 計算指定階段的總權重
   */
  private getTotalWeightByPhase(phase: 'ng' | 'fg'): number {
    return this.symbols.reduce(
      (sum, symbol) => sum + (phase === 'ng' ? symbol.ngWeight : symbol.fgWeight),
      0
    );
  }

  /**
   * 根據出現權重隨機抽一個符號（用於滾動動畫）
   */
  drawSymbol(): SymbolId {
    const totalWeight = this.getTotalWeight();
    if (totalWeight === 0) {
      throw new Error('No symbols available or all weights are zero');
    }

    // 生成 0 到總權重之間的隨機數
    let random = Math.random() * totalWeight;

    // 遍歷所有 Symbol，累加權重直到超過隨機數
    for (const symbol of this.symbols) {
      random -= symbol.appearanceWeight;
      if (random <= 0) {
        return symbol.id;
      }
    }

    // 理論上不會執行到這裡，但為了型別安全返回最後一個
    return this.symbols[this.symbols.length - 1].id;
  }

  /**
   * 根據遊戲階段權重隨機抽一個符號（用於 Pool 生成）
   */
  drawSymbolByPhase(phase: 'ng' | 'fg'): SymbolId {
    const totalWeight = this.getTotalWeightByPhase(phase);
    if (totalWeight === 0) {
      throw new Error('No symbols available or all weights are zero');
    }

    let random = Math.random() * totalWeight;

    for (const symbol of this.symbols) {
      const weight = phase === 'ng' ? symbol.ngWeight : symbol.fgWeight;
      random -= weight;
      if (random <= 0) {
        return symbol.id;
      }
    }

    return this.symbols[this.symbols.length - 1].id;
  }

  /**
   * 取得 Wild 符號
   */
  getWildSymbols(): SymbolDefinition[] {
    return this.symbols.filter((s) => s.type === 'wild');
  }

  /**
   * 取得 Scatter 符號
   */
  getScatterSymbols(): SymbolDefinition[] {
    return this.symbols.filter((s) => s.type === 'scatter');
  }

  /**
   * 取得一般符號
   */
  getNormalSymbols(): SymbolDefinition[] {
    return this.symbols.filter((s) => s.type === 'normal');
  }

  /**
   * 取得符號總數
   */
  getCount(): number {
    return this.symbols.length;
  }
}

// ========== V2 新增函式 ==========

/**
 * 判斷符號是否為 Wild
 */
export function isWildSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'wild';
}

/**
 * 判斷符號是否為 Scatter
 */
export function isScatterSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'scatter';
}

/**
 * 判斷符號是否為一般符號
 */
export function isNormalSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'normal';
}

/**
 * 取得 Wild 符號列表
 */
export function getWildSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isWildSymbol);
}

/**
 * 取得 Scatter 符號列表
 */
export function getScatterSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isScatterSymbol);
}

/**
 * 取得一般符號列表
 */
export function getNormalSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isNormalSymbol);
}

/**
 * 檢查 Wild 是否可以替代指定符號
 */
export function canWildReplace(
  wild: SymbolDefinition,
  target: SymbolDefinition
): boolean {
  if (!isWildSymbol(wild) || !wild.wildConfig) {
    return false;
  }

  if (isNormalSymbol(target)) {
    return wild.wildConfig.canReplaceNormal;
  }

  // target 是 wild 或 scatter
  return wild.wildConfig.canReplaceSpecial;
}

/**
 * 根據遊戲階段取得符號權重
 */
export function getSymbolWeight(
  symbol: SymbolDefinition,
  phase: 'ng' | 'fg'
): number {
  return phase === 'ng' ? symbol.ngWeight : symbol.fgWeight;
}

/**
 * 建立預設 Wild 符號
 */
export function createDefaultWildSymbol(): SymbolDefinition {
  return {
    id: 'WILD',
    name: '百搭',
    type: 'wild',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 5,
    ngWeight: 5,
    fgWeight: 15,
    wildConfig: {
      canReplaceNormal: true,
      canReplaceSpecial: false,
    },
  };
}

/**
 * 建立預設 Scatter 符號
 */
export function createDefaultScatterSymbol(): SymbolDefinition {
  return {
    id: 'SCATTER',
    name: '分散',
    type: 'scatter',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 3,
    ngWeight: 3,
    fgWeight: 5,
    scatterConfig: {
      triggerCount: 3,
      freeSpinCount: 10,
      enableRetrigger: true,
      retriggerSpinCount: 5,
      enableMultiplier: true,
      multiplierValue: 2,
    },
  };
}
