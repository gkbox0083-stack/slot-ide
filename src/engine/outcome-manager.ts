import type { Outcome } from '../types/outcome.js';

/**
 * OutcomeManager（V3 簡化版）
 * 管理結果類型（倍率區間 + 權重）
 * 移除 NG/FG 分離邏輯
 */
export class OutcomeManager {
  private outcomes: Outcome[] = [];

  constructor() {
    this.loadDefaults();
  }

  /**
   * 載入預設 Outcome（V3 簡化版，移除 phase）
   */
  private loadDefaults(): void {
    this.outcomes = [
      {
        id: this.generateId(),
        name: '大獎',
        multiplierRange: { min: 100, max: 500 },
        weight: 10,
      },
      {
        id: this.generateId(),
        name: '中獎',
        multiplierRange: { min: 10, max: 50 },
        weight: 50,
      },
      {
        id: this.generateId(),
        name: '小獎',
        multiplierRange: { min: 2, max: 5 },
        weight: 200,
      },
      {
        id: this.generateId(),
        name: '無獎',
        multiplierRange: { min: 0, max: 0 },
        weight: 740,
      },
    ];
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `outcome_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 取得所有 Outcome
   */
  getAll(): Outcome[] {
    return [...this.outcomes];
  }

  /**
   * 根據 ID 取得單一 Outcome
   */
  getById(id: string): Outcome | undefined {
    return this.outcomes.find((outcome) => outcome.id === id);
  }

  /**
   * 新增 Outcome（自動生成 ID）
   */
  add(outcome: Omit<Outcome, 'id'>): Outcome {
    const newOutcome: Outcome = {
      ...outcome,
      id: this.generateId(),
    };
    this.outcomes.push(newOutcome);
    return newOutcome;
  }

  /**
   * 修改 Outcome
   */
  update(outcome: Outcome): boolean {
    const index = this.outcomes.findIndex((o) => o.id === outcome.id);
    if (index === -1) {
      return false;
    }
    this.outcomes[index] = outcome;
    return true;
  }

  /**
   * 刪除 Outcome
   */
  remove(id: string): boolean {
    const index = this.outcomes.findIndex((o) => o.id === id);
    if (index === -1) {
      return false;
    }
    this.outcomes.splice(index, 1);
    return true;
  }

  /**
   * 設定所有 Outcomes（完整替換）
   * 用於從 Store 同步設定
   */
  setOutcomes(outcomes: Outcome[]): void {
    this.outcomes = [...outcomes];
  }

  /**
   * 計算總權重
   */
  private getTotalWeight(): number {
    return this.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  }

  /**
   * 根據權重隨機抽取一個 Outcome（V3 簡化版）
   */
  drawOutcome(): Outcome {
    const totalWeight = this.getTotalWeight();
    if (totalWeight === 0) {
      throw new Error('No outcomes available or all weights are zero');
    }

    let random = Math.random() * totalWeight;

    for (const outcome of this.outcomes) {
      random -= outcome.weight;
      if (random <= 0) {
        return outcome;
      }
    }

    return this.outcomes[this.outcomes.length - 1];
  }

  /**
   * 計算指定 Outcome 的機率百分比（顯示用）
   */
  getProbability(id: string): number {
    const outcome = this.getById(id);
    if (!outcome) {
      return 0;
    }

    const totalWeight = this.getTotalWeight();
    if (totalWeight === 0) {
      return 0;
    }

    return (outcome.weight / totalWeight) * 100;
  }

  /**
   * 取得所有 Outcome 的機率列表
   */
  getAllProbabilities(): { id: string; name: string; probability: number }[] {
    const totalWeight = this.getTotalWeight();
    if (totalWeight === 0) {
      return this.outcomes.map((o) => ({
        id: o.id,
        name: o.name,
        probability: 0,
      }));
    }

    return this.outcomes.map((outcome) => ({
      id: outcome.id,
      name: outcome.name,
      probability: (outcome.weight / totalWeight) * 100,
    }));
  }
}
