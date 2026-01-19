import type { SpinPacket } from '../types/spin-packet.js';
import type { VisualConfig, AssetsPatch } from '../types/visual.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { PoolBuilder } from './pool-builder.js';
import type { Settlement } from './settlement.js';

/**
 * SpinExecutor（V3 簡化版）
 * 執行單次 Spin，返回完整 SpinPacket
 * 移除 Free Spin phase 支援
 */
export class SpinExecutor {
  constructor(
    private outcomeManager: OutcomeManager,
    private poolBuilder: PoolBuilder,
    private settlement: Settlement
  ) { }

  /**
   * 執行單次 Spin，返回完整 SpinPacket（V3 簡化版）
   * @param visual 視覺配置
   * @param assets 素材覆蓋（可選）
   * @param baseBet 投注金額（用於計算最終獲勝金額）
   */
  spin(
    visual: VisualConfig,
    assets?: AssetsPatch,
    baseBet: number = 1
  ): SpinPacket {
    // 1. 檢查盤池是否已建立
    if (!this.isReady()) {
      throw new Error('請先執行 buildPools() 建立盤池');
    }

    // 2. 抽取 Outcome（V3: 不再區分 phase）
    const outcome = this.outcomeManager.drawOutcome();

    // 3. 從盤池抽取 Board
    const board = this.poolBuilder.drawBoard(outcome.id);
    if (!board) {
      throw new Error(`Outcome「${outcome.name}」的盤池為空，請重新建立盤池`);
    }

    // 4. 結算（V3 簡化：移除 phase 和 multiplier）
    const meta = this.settlement.settle(board, outcome.id, baseBet);

    // 5. 組裝 SpinPacket
    return {
      version: '3', // V3 版本
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
        backgroundTransform: { offsetX: 0, offsetY: 0, scale: 1 },
        boardContainerTransform: { offsetX: 0, offsetY: 0, scale: 1 },
        characterTransform: { offsetX: 0, offsetY: 0, scale: 1 },
      },
    };
  }
}
