/**
 * 數據測試腳本
 * 測試 Build Pools 和 100 次 Spin 的數據合理性
 */

import {
  poolBuilder,
  spinExecutor,
  outcomeManager,
} from './engine/index.js';

/**
 * 執行數據測試
 */
export async function testData(): Promise<void> {
  console.log('=== 開始數據測試 ===\n');

  // 1. Build Pools
  console.log('1. 建立盤池...');
  const buildResult = poolBuilder.buildPools(100);
  
  if (!buildResult.success) {
    console.warn('⚠️ 建池警告:');
    buildResult.errors.forEach((error) => console.warn(`  - ${error}`));
  } else {
    console.log('✅ 所有盤池建立成功');
  }

  // 顯示盤池狀態
  console.log('\n盤池狀態:');
  buildResult.pools.forEach((pool) => {
    const status = pool.isFull ? '✅' : '⚠️';
    console.log(`  ${status} ${pool.outcomeName}: ${pool.generated}/${pool.cap}`);
  });

  // 2. 執行 100 次 Spin
  console.log('\n2. 執行 100 次 Spin...');
  const visual = spinExecutor.getDefaultVisualConfig();
  const spins: Array<{ outcomeId: string; outcomeName: string; win: number }> = [];

  for (let i = 0; i < 100; i++) {
    try {
      const spinPacket = spinExecutor.spin(visual);
      const outcome = outcomeManager.getById(spinPacket.meta?.outcomeId || '');
      spins.push({
        outcomeId: spinPacket.meta?.outcomeId || '',
        outcomeName: outcome?.name || '未知',
        win: spinPacket.meta?.win || 0,
      });
    } catch (error) {
      console.error(`Spin ${i + 1} 失敗:`, error);
    }
  }

  console.log(`✅ 完成 ${spins.length} 次 Spin\n`);

  // 3. 計算統計數據
  console.log('=== 統計結果 ===\n');

  // 計算各 Outcome 命中次數
  const outcomeCounts = new Map<string, { name: string; count: number }>();
  const outcomes = outcomeManager.getAll();
  
  outcomes.forEach((outcome) => {
    outcomeCounts.set(outcome.id, { name: outcome.name, count: 0 });
  });

  spins.forEach((spin) => {
    const count = outcomeCounts.get(spin.outcomeId);
    if (count) {
      count.count++;
    }
  });

  console.log('各 Outcome 命中次數:');
  outcomeCounts.forEach((value, id) => {
    const outcome = outcomeManager.getById(id);
    const probability = outcome ? outcomeManager.getProbability(id) : 0;
    const expected = (probability / 100) * spins.length;
    const diff = value.count - expected;
    console.log(
      `  ${value.name}: ${value.count} 次 (預期: ${expected.toFixed(1)}, 差異: ${diff > 0 ? '+' : ''}${diff.toFixed(1)})`
    );
  });

  // 計算 RTP
  const totalWin = spins.reduce((sum, spin) => sum + spin.win, 0);
  const totalSpins = spins.length;
  const baseBet = 1; // 假設 Base Bet = 1
  const totalBet = totalSpins * baseBet;
  const rtp = (totalWin / totalBet) * 100;

  console.log(`\nRTP (Return to Player):`);
  console.log(`  總投注: ${totalBet}`);
  console.log(`  總獲勝: ${totalWin}`);
  console.log(`  RTP: ${rtp.toFixed(2)}%`);

  // 計算 Hit Rate
  const hitCount = spins.filter((spin) => spin.win > 0).length;
  const hitRate = (hitCount / totalSpins) * 100;

  console.log(`\nHit Rate (中獎率):`);
  console.log(`  中獎次數: ${hitCount}`);
  console.log(`  總次數: ${totalSpins}`);
  console.log(`  Hit Rate: ${hitRate.toFixed(2)}%`);

  // 計算平均獲勝
  const avgWin = hitCount > 0 ? totalWin / hitCount : 0;
  console.log(`\n平均獲勝 (僅計算中獎): ${avgWin.toFixed(2)}`);

  // 計算各 Outcome 的實際倍率
  console.log(`\n各 Outcome 實際倍率分析:`);
  outcomeCounts.forEach((value, id) => {
    if (value.count > 0) {
      const outcome = outcomeManager.getById(id);
      if (outcome) {
        const outcomeSpins = spins.filter((s) => s.outcomeId === id);
        const outcomeWins = outcomeSpins.reduce((sum, s) => sum + s.win, 0);
        const avgWinForOutcome = outcomeWins / value.count;
        console.log(
          `  ${value.name}: 平均 ${avgWinForOutcome.toFixed(2)} (區間: ${outcome.multiplierRange.min}-${outcome.multiplierRange.max})`
        );
      }
    }
  });

  console.log('\n=== 測試完成 ===');
}

