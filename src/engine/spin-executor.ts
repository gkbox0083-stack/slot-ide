import type { SpinPacket } from '../types/spin-packet.js';
import type { VisualConfig, AssetsPatch } from '../types/visual.js';
import type { OutcomeManager } from './outcome-manager.js';
import type { PoolBuilder } from './pool-builder.js';
import type { Settlement } from './settlement.js';
import type { FreeSpinMode } from '../types/free-spin.js';

/**
 * SpinExecutor
 * 執行單次 Spin，返回完整 SpinPacket（V2 支援 Free Spin）
 */
export class SpinExecutor {
  constructor(
    private outcomeManager: OutcomeManager,
    private poolBuilder: PoolBuilder,
    private settlement: Settlement
  ) { }

  /**
   * 執行單次 Spin，返回完整 SpinPacket（V2 擴展）
   * @param visual 視覺配置
   * @param assets 素材覆蓋（可選）
   * @param phase 遊戲階段
   * @param multiplier Multiplier 倍率
   * @param baseBet 投注金額（用於計算最終獲勝金額）
   */
  spin(
    visual: VisualConfig,
    assets?: AssetsPatch,
    phase: FreeSpinMode = 'base',
    multiplier: number = 1,
    baseBet: number = 1
  ): SpinPacket {
    // 1. 檢查盤池是否已建立
    if (!this.isReady()) {
      throw new Error('請先執行 buildPools() 建立盤池');
    }

    // 2. 抽取 Outcome (依據階段)
    const outcomePhase = phase === 'base' ? 'ng' : 'fg';
    const outcome = this.outcomeManager.drawOutcomeByPhase(outcomePhase);

    // 3. 從盤池抽取 Board
    const board = this.poolBuilder.drawBoard(outcome.id);
    if (!board) {
      throw new Error(`Outcome「${outcome.name}」的盤池為空，請重新建立盤池`);
    }

    // 4. 結算（V2 支援 Wild 和 phase，含 baseBet）
    const meta = this.settlement.settle(board, outcome.id, phase, multiplier, baseBet);

    // 5. 組裝 SpinPacket（V2）
    return {
      version: '2',
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
