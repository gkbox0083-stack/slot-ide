# P1-03 Settlement 邏輯修改（Wild 結算）

## 目標 (Objective)

修改 Settlement 模組支援 Wild 符號替代邏輯，包括：
- Wild 替代一般符號
- 最佳組合選擇
- 中獎線 Wild 位置記錄

**重要**：Wild 結算邏輯只能存在於 `src/engine/settlement.ts`

---

## 範圍 (Scope)

需要修改的檔案：
- `src/engine/settlement.ts`

依賴：
- P1-01（型別定義擴展）
- P1-02（Symbol 系統擴展）

---

## 實作細節 (Implementation Details)

### 問題根源

原本的結算邏輯只檢查「連續相同符號」：

```typescript
// 原本邏輯（簡化）
function countConsecutive(line: SymbolId[], symbols: SymbolDefinition[]): number {
  const first = line[0];
  let count = 1;
  for (let i = 1; i < line.length; i++) {
    if (line[i] === first) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
```

這無法處理 Wild 替代的情況。

### 修正方案

新的結算邏輯需要：
1. 識別 Wild 符號
2. Wild 可以替代目標符號
3. 選擇最高分的組合
4. 記錄 Wild 位置

### 完整修正

```typescript
import type { Board, SymbolId } from '../types/board.js';
import type { SymbolDefinition } from '../types/symbol.js';
import type { LinesConfig } from '../types/lines.js';
import type { WinningLine, SettlementMeta } from '../types/spin-packet.js';
import type { FreeSpinMode } from '../types/free-spin.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';

/**
 * 計算單條線的連續符號數（含 Wild 替代）
 * @returns { symbol: 目標符號, count: 連續數, wildPositions: Wild 位置 }
 */
function calculateLineMatch(
  lineSymbols: SymbolId[],
  symbolDefs: SymbolDefinition[],
): { symbol: SymbolId; count: number; wildPositions: [number, number][] } | null {
  const getSymbolDef = (id: SymbolId) => symbolDefs.find(s => s.id === id);
  
  // 找出這條線上的所有符號定義
  const lineDefs = lineSymbols.map(id => getSymbolDef(id)).filter(Boolean) as SymbolDefinition[];
  
  if (lineDefs.length !== lineSymbols.length) {
    return null; // 有未知符號
  }
  
  // 找出可能的目標符號（非 Wild 的第一個符號）
  let targetSymbol: SymbolDefinition | null = null;
  let targetIndex = -1;
  
  for (let i = 0; i < lineDefs.length; i++) {
    if (!isWildSymbol(lineDefs[i]) && !isScatterSymbol(lineDefs[i])) {
      targetSymbol = lineDefs[i];
      targetIndex = i;
      break;
    }
  }
  
  // 如果全是 Wild，不計算（Wild 不單獨成線）
  if (!targetSymbol) {
    return null;
  }
  
  // 從左到右計算連續數
  let count = 0;
  const wildPositions: [number, number][] = [];
  
  for (let i = 0; i < lineDefs.length; i++) {
    const currentDef = lineDefs[i];
    
    if (currentDef.id === targetSymbol.id) {
      // 相同符號
      count++;
    } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetSymbol)) {
      // Wild 替代
      count++;
      wildPositions.push([i, 0]); // 稍後會更新 row
    } else {
      // 不匹配，停止
      break;
    }
  }
  
  // 至少 3 連才算中獎
  if (count < 3) {
    return null;
  }
  
  return {
    symbol: targetSymbol.id,
    count,
    wildPositions,
  };
}

/**
 * 計算單條線的獎金
 */
function calculateLinePayout(
  symbol: SymbolId,
  count: number,
  symbolDefs: SymbolDefinition[],
  baseBet: number,
): number {
  const symbolDef = symbolDefs.find(s => s.id === symbol);
  if (!symbolDef) return 0;
  
  const payoutKey = `match${count}` as keyof typeof symbolDef.payouts;
  const multiplier = symbolDef.payouts[payoutKey] || 0;
  
  return multiplier * baseBet;
}

/**
 * 計算盤面上的 Scatter 數量
 */
export function countScatters(board: Board, symbolDefs: SymbolDefinition[]): number {
  let count = 0;
  
  for (const reel of board.reels) {
    for (const symbolId of reel) {
      const def = symbolDefs.find(s => s.id === symbolId);
      if (def && isScatterSymbol(def)) {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * 結算盤面（V2 支援 Wild）
 */
export function settle(
  board: Board,
  symbolDefs: SymbolDefinition[],
  linesConfig: LinesConfig,
  baseBet: number,
  phase: FreeSpinMode,
  multiplier: number = 1,
): SettlementMeta {
  const winningLines: WinningLine[] = [];
  let totalWin = 0;
  
  // 遍歷所有線
  for (const linePattern of linesConfig.patterns) {
    // 取得這條線上的符號
    const lineSymbols: SymbolId[] = linePattern.positions.map(([col, row]) => {
      return board.reels[col][row];
    });
    
    // 計算連續符號（含 Wild）
    const match = calculateLineMatch(lineSymbols, symbolDefs);
    
    if (match) {
      const payout = calculateLinePayout(match.symbol, match.count, symbolDefs, baseBet);
      const multipliedPayout = payout * multiplier;
      
      // 更新 Wild 位置的 row
      const wildPositionsWithRow: [number, number][] = match.wildPositions.map(([col]) => {
        const row = linePattern.positions[col][1];
        return [col, row];
      });
      
      const winningLine: WinningLine = {
        lineIndex: linePattern.id,
        positions: linePattern.positions.slice(0, match.count) as [number, number][],
        symbol: match.symbol,
        count: match.count,
        payout: multipliedPayout,
        hasWild: wildPositionsWithRow.length > 0,
        wildPositions: wildPositionsWithRow.length > 0 ? wildPositionsWithRow : undefined,
      };
      
      winningLines.push(winningLine);
      totalWin += multipliedPayout;
    }
  }
  
  // 計算 Scatter 數量
  const scatterCount = countScatters(board, symbolDefs);
  
  // 找出最佳線
  const bestLine = winningLines.length > 0
    ? winningLines.reduce((best, current) => 
        current.payout > best.payout ? current : best
      )
    : undefined;
  
  // 判斷是否觸發 Free Spin
  const scatterDef = symbolDefs.find(s => isScatterSymbol(s));
  const triggerCount = scatterDef?.scatterConfig?.triggerCount ?? 3;
  const triggeredFreeSpin = phase === 'base' && scatterCount >= triggerCount;
  
  return {
    outcomeId: '', // 由 spin-executor 填入
    phase,
    win: totalWin,
    multiplier,
    winningLines,
    bestLine,
    scatterCount,
    triggeredFreeSpin,
  };
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] Wild 正確替代一般符號
- [ ] Wild 不替代特殊符號（當 canReplaceSpecial = false）
- [ ] 選擇最高分組合（當 Wild 可組成多種組合時）
- [ ] winningLine 包含 hasWild 和 wildPositions
- [ ] Scatter 計數正確
- [ ] triggeredFreeSpin 判斷正確
- [ ] Wild 邏輯只存在於 settlement.ts（P0 Gate 檢查）
- [ ] `npm run build` 成功

---

## 測試案例

### 案例 1：純符號連線
```
盤面：[H1, H1, H1, L1, L2]
預期：H1 x3 中獎
```

### 案例 2：Wild 替代
```
盤面：[H1, WILD, H1, L1, L2]
預期：H1 x3 中獎，hasWild = true，wildPositions = [[1, row]]
```

### 案例 3：開頭 Wild
```
盤面：[WILD, H1, H1, L1, L2]
預期：H1 x3 中獎（WILD 替代 H1）
```

### 案例 4：Scatter 計數
```
盤面包含 3 個 SCATTER
預期：scatterCount = 3，triggeredFreeSpin = true（在 base 模式）
```

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/engine/settlement.ts` 完整程式碼
2. 測試案例執行結果
3. P0 Gate 檢查結果（確認 Wild 邏輯唯一）

