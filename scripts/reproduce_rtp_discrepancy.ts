
import { SymbolManager } from '../src/engine/symbol-manager';
import { LinesManager } from '../src/engine/lines-manager';
import { OutcomeManager } from '../src/engine/outcome-manager';
import { PoolBuilder } from '../src/engine/pool-builder';
import { Settlement } from '../src/engine/settlement';
import { calculateTheoreticalRTPBreakdown } from '../src/engine/rtp-calculator';
import { Outcome } from '../src/types/outcome';
import { BoardConfig } from '../src/types/board';

async function runReproduction() {
    console.log('--- Starting RTP Discrepancy Reproduction ---');

    // 1. Initialize Engine
    const symbolManager = new SymbolManager();
    const linesManager = new LinesManager();
    const outcomeManager = new OutcomeManager();
    const poolBuilder = new PoolBuilder(outcomeManager, symbolManager, linesManager);
    const settlement = new Settlement(symbolManager, linesManager);

    // 2. Setup Simplified Configuration
    // Use 5x3 Board
    const boardConfig: BoardConfig = { cols: 5, rows: 3 };
    poolBuilder.setBoardConfig(boardConfig);

    // Override Outcomes:
    // Outcome A: Loss (0x), Weight 90
    // Outcome B: Win (5x-5x), Weight 10
    // Total Weight: 100
    // Theoretical Line RTP: (0.9 * 0) + (0.1 * 5) = 0.5 = 50%
    const testOutcomes: Outcome[] = [
        { id: 'LOSS', name: 'Loss', multiplierRange: { min: 0, max: 0 }, weight: 90 },
        { id: 'WIN', name: 'Win', multiplierRange: { min: 5, max: 5 }, weight: 10 }
    ];
    outcomeManager.setOutcomes(testOutcomes);

    // Ensure we have a high paying Scatter
    // Default Scatter (SCATTER) pays? checks symbol-manager defaults.
    // Default Scatter payouts are 0, but configured in `scatterConfig`. It has multiplierValue: 2?
    // Wait, let's check calculateScatterRTPContribution in rtp-calculator.
    // It uses `config.payoutByCount`.
    // Default symbol-manager's Scatter config doesn't show `payoutByCount` in the code I viewed?
    // Let me check `symbol-manager` output again.
    // Line 141: `scatterConfig: { ... multiplierValue: 2 }`.
    // It seems the new `payoutByCount` might not be in the default `createDefaultScatterSymbol` in the file I saw, OR I missed it.
    // `rtp-calculator` uses `payoutByCount`.
    // If the Scatter config structure changed, I need to make sure my mock Scatter has `payoutByCount`.

    // Let's force a Scatter symbol with explicit payoutByCount
    // We must use the new `scatterPayoutConfig` property, not the deprecated `scatterConfig`.
    const scatterSymbol = symbolManager.getById('SCATTER');
    if (scatterSymbol) {
        scatterSymbol.scatterPayoutConfig = {
            minCount: 3,
            payoutByCount: {
                3: 5,   // 3 Scatters = 5x
                4: 20,  // 4 Scatters = 20x
                5: 100  // 5 Scatters = 100x
            }
        };
        symbolManager.update(scatterSymbol);
    }

    // 3. Calculate Theoretical RTP
    console.log('\n[Theoretical Calculation]');
    const theoretical = calculateTheoreticalRTPBreakdown(
        symbolManager.getAll(),
        outcomeManager.getAll(),
        boardConfig
    );
    console.log(`Theoretical Line RTP: ${theoretical.lineRTP.toFixed(2)}%`);
    console.log(`Theoretical Scatter RTP: ${theoretical.scatterRTP.toFixed(2)}%`);
    console.log(`Theoretical Total RTP: ${theoretical.totalRTP.toFixed(2)}%`);

    // 4. Build Pools & Calculate Actual RTP
    console.log('\n[Actual Simulation]');
    const buildResult = poolBuilder.buildPools(100); // 100 boards per outcome

    if (!buildResult.success) {
        console.error('Pool build failed:', buildResult.errors);
    }

    let totalBet = 0;
    let totalWin = 0;
    let actualLineRTPVal = 0;
    let actualScatterRTPVal = 0;

    let totalBoards = 0;
    let scatterHitCount = 0;

    for (const outcome of testOutcomes) {
        const pool = poolBuilder.getPool(outcome.id);
        if (!pool) continue;

        // Weight * Count
        // To get correct "RTP", we should simulate drawing based on weights?
        // Or just sum up everything relative to generated counts?
        // Theoretical assumes infinite draws.
        // We generated 100 boards for *each* outcome.
        // We need to weight them according to outcome weights.
        // Loss: Weight 90. Win: Weight 10.
        // So we should count 'Loss' results 9 times more than 'Win' results?
        // Or simpler: Just calculate average win of each pool, then weight-average them.

        let poolTotalWin = 0;
        let poolLineWin = 0;
        let poolScatterWin = 0;

        for (const board of pool.boards) {
            const result = settlement.settle(board, outcome.id, 1);
            poolTotalWin += result.win;

            // Extract line vs scatter win
            // Settle returns `win`, `scatterPayout`.
            // result.win = line + scatter
            const sWin = result.scatterPayout || 0;
            const lWin = result.win - sWin;

            poolLineWin += lWin;
            poolScatterWin += sWin;

            if (sWin > 0) scatterHitCount++;
        }

        const avgPoolWin = poolTotalWin / pool.boards.length;
        const avgPoolLine = poolLineWin / pool.boards.length;
        const avgPoolScatter = poolScatterWin / pool.boards.length;

        // Add to global stats weighted by Outcome Weight
        // Outcome Weight is relative.
        const probability = outcome.weight / 100; // Total is 100

        totalWin += avgPoolWin * probability;
        actualLineRTPVal += avgPoolLine * probability;
        actualScatterRTPVal += avgPoolScatter * probability;

        console.log(`Outcome ${outcome.name}: Avg Win ${avgPoolWin.toFixed(2)} (Line ${avgPoolLine.toFixed(2)} + Scatter ${avgPoolScatter.toFixed(2)})`);
    }

    const actualTotalRTP = (totalWin / 1) * 100; // BaseBet is 1

    console.log(`\nActual Line RTP: ${(actualLineRTPVal * 100).toFixed(2)}%`);
    console.log(`Actual Scatter RTP: ${(actualScatterRTPVal * 100).toFixed(2)}%`);
    console.log(`Actual Total RTP: ${(actualTotalRTP).toFixed(2)}%`);

    console.log(`\nDiscrepancy: ${(theoretical.totalRTP - actualTotalRTP).toFixed(2)}%`);

    if (Math.abs(theoretical.totalRTP - actualTotalRTP) > 0.1) {
        console.log('>>> DISCREPANCY DETECTED <<<');
    } else {
        console.log('>>> NO DISCREPANCY <<<');
    }
}

runReproduction().catch(console.error);
