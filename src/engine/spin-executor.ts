import type { SpinPacket } from '../types/spin-packet.js';
import type { VisualConfig, AssetsPatch } from '../types/visual.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { PoolBuilder } from './pool-builder.js';
import type { Settlement } from './settlement.js';

/**
 * SpinExecutor
 * 執行單次 Spin，返回完整 SpinPacket
 */
export class SpinExecutor {
  constructor(
    private outcomeManager: OutcomeManager,
    private poolBuilder: PoolBuilder,
    private settlement: Settlement
  ) {}

  /**
   * 執行單次 Spin，返回完整 SpinPacket
   * @param visual 視覺配置
   * @param assets 素材覆蓋（可選）
   */
  spin(visual: VisualConfig, assets?: AssetsPatch): SpinPacket {
    // 1. 檢查盤池是否已建立
    if (!this.isReady()) {
      throw new Error('請先執行 buildPools() 建立盤池');
    }

    // 2. 抽取 Outcome
    const outcome = this.outcomeManager.drawOutcome();

    // 3. 從盤池抽取 Board
    const board = this.poolBuilder.drawBoard(outcome.id);
    if (!board) {
      throw new Error(`Outcome「${outcome.name}」的盤池為空，請重新建立盤池`);
    }

    // 4. 結算
    const meta = this.settlement.settle(board, outcome.id);

    // 5. 組裝 SpinPacket
    return {
      version: '1',
      board,
      visual,
      assets,
      meta,
    };
  }

  /**
   * 檢查盤池是否已建立
   */
  isReady(): boolean {
    const statuses = this.poolBuilder.getAllPoolStatus();
    // 至少有一個盤池有內容才算 ready
    return statuses.some((status) => status.generated > 0);
  }

  /**
   * 取得預設 VisualConfig
   */
  getDefaultVisualConfig(): VisualConfig {
    return {
      animation: {
        spinSpeed: 20,
        spinDuration: 2000,
        reelStopDelay: 200,
        easeStrength: 0.5,
        bounceStrength: 0.3,
      },
      layout: {
        reelGap: 10,
        symbolScale: 1,
        boardScale: 1,
      },
    };
  }
}

