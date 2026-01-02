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
   * 載入預設 Symbol
   */
  private loadDefaults(): void {
    this.symbols = [
      {
        id: 'H1',
        name: '高分1',
        category: 'high',
        payouts: {
          match3: 50,
          match4: 200,
          match5: 1000,
        },
        appearanceWeight: 5,
      },
      {
        id: 'H2',
        name: '高分2',
        category: 'high',
        payouts: {
          match3: 40,
          match4: 150,
          match5: 800,
        },
        appearanceWeight: 6,
      },
      {
        id: 'H3',
        name: '高分3',
        category: 'high',
        payouts: {
          match3: 30,
          match4: 100,
          match5: 500,
        },
        appearanceWeight: 8,
      },
      {
        id: 'L1',
        name: '低分1',
        category: 'low',
        payouts: {
          match3: 10,
          match4: 30,
          match5: 100,
        },
        appearanceWeight: 15,
      },
      {
        id: 'L2',
        name: '低分2',
        category: 'low',
        payouts: {
          match3: 10,
          match4: 30,
          match5: 100,
        },
        appearanceWeight: 15,
      },
      {
        id: 'L3',
        name: '低分3',
        category: 'low',
        payouts: {
          match3: 5,
          match4: 15,
          match5: 50,
        },
        appearanceWeight: 20,
      },
      {
        id: 'L4',
        name: '低分4',
        category: 'low',
        payouts: {
          match3: 5,
          match4: 15,
          match5: 50,
        },
        appearanceWeight: 20,
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
   * 計算總權重
   */
  private getTotalWeight(): number {
    return this.symbols.reduce((sum, symbol) => sum + symbol.appearanceWeight, 0);
  }

  /**
   * 根據出現權重隨機抽一個符號（用於盤池生成）
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
   * 取得符號總數
   */
  getCount(): number {
    return this.symbols.length;
  }
}

