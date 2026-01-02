import type { LinesConfig, LinePattern } from '../types/lines.js';

/**
 * LinesManager
 * 管理連線配置（預設 20 條線）
 */
export class LinesManager {
  private config: LinesConfig;

  constructor() {
    // 載入預設 20 條線
    this.config = this.createDefaultConfig();
  }

  /**
   * 建立預設 20 條線配置
   */
  private createDefaultConfig(): LinesConfig {
    const patterns: LinePattern[] = [
      {
        id: 0,
        positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // 中間橫線
      },
      {
        id: 1,
        positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // 上面橫線
      },
      {
        id: 2,
        positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // 下面橫線
      },
      {
        id: 3,
        positions: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]], // V 形
      },
      {
        id: 4,
        positions: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]], // 倒 V 形
      },
      {
        id: 5,
        positions: [[0, 0], [1, 0], [2, 1], [3, 0], [4, 0]], // 上平 V
      },
      {
        id: 6,
        positions: [[0, 2], [1, 2], [2, 1], [3, 2], [4, 2]], // 下平倒 V
      },
      {
        id: 7,
        positions: [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]], // 上凸形
      },
      {
        id: 8,
        positions: [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]], // 下凸形
      },
      {
        id: 9,
        positions: [[0, 1], [1, 0], [2, 1], [3, 0], [4, 1]], // 淺倒 V
      },
      {
        id: 10,
        positions: [[0, 1], [1, 2], [2, 1], [3, 2], [4, 1]], // 淺 V
      },
      {
        id: 11,
        positions: [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]], // 上鋸齒
      },
      {
        id: 12,
        positions: [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]], // 下鋸齒
      },
      {
        id: 13,
        positions: [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]], // 中上波
      },
      {
        id: 14,
        positions: [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]], // 中下波
      },
      {
        id: 15,
        positions: [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]], // 左下斜
      },
      {
        id: 16,
        positions: [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]], // 左上斜
      },
      {
        id: 17,
        positions: [[0, 1], [1, 1], [2, 0], [3, 1], [4, 1]], // 中頂凸
      },
      {
        id: 18,
        positions: [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]], // 中底凸
      },
      {
        id: 19,
        positions: [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]], // W 形
      },
    ];

    return {
      count: 20,
      patterns,
    };
  }

  /**
   * 取得線條配置
   */
  getConfig(): LinesConfig {
    return {
      count: this.config.count,
      patterns: [...this.config.patterns],
    };
  }

  /**
   * 設定線數（會截取或補齊 patterns）
   * @param count 新的線數
   */
  setCount(count: number): void {
    if (count < 1) {
      throw new Error('Line count must be at least 1');
    }

    const currentPatterns = this.config.patterns;
    const newPatterns: LinePattern[] = [];

    if (count <= currentPatterns.length) {
      // 截取：只保留前 count 條線
      newPatterns.push(...currentPatterns.slice(0, count));
    } else {
      // 補齊：保留現有線，不足的部分用預設模式補齊
      newPatterns.push(...currentPatterns);

      // 使用中間橫線作為預設模式來補齊
      const defaultPattern: [number, number][] = [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]];

      for (let i = currentPatterns.length; i < count; i++) {
        newPatterns.push({
          id: i,
          positions: [...defaultPattern],
        });
      }
    }

    this.config = {
      count,
      patterns: newPatterns,
    };
  }

  /**
   * 取得指定線的路徑
   * @param lineIndex 線條索引（0-based）
   */
  getPattern(lineIndex: number): LinePattern | undefined {
    return this.config.patterns[lineIndex];
  }

  /**
   * 取得所有線的路徑
   */
  getAllPatterns(): LinePattern[] {
    return [...this.config.patterns];
  }

  /**
   * 取得目前線數
   */
  getCount(): number {
    return this.config.count;
  }
}

