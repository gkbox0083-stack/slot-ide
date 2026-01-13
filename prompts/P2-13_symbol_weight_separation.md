# P2-13 符號權重分離：視覺層與數學層

## 問題背景

### 發現過程

在 P2-12 討論中確認：
- 現有 `ngWeight`/`fgWeight` 同時影響視覺層（滾動動畫）與數學層（Pool 生成）
- 這導致「符號權重」與「Outcome 權重」產生衝突
- 理論 RTP 公式無法準確計算

### 設計原意

符號權重**最初的設計意圖**是「僅影響滾動動畫中的假符號」，不應影響中獎結果。

---

## 解決方案

### 核心原則

```
視覺層（滾動動畫）：使用 appearanceWeight　→ 影響滾動中顯示的符號頻率
數學層（Pool 生成）：符號均勻分布　　　　→ 不受權重影響
```

### 選擇方案

**選項 A：保留權重欄位但標註為「僅視覺用」**

- 將 `ngWeight`/`fgWeight` 在 UI 上標註為僅影響動畫
- Pool 生成改為均勻分布
- 不刪除欄位，保持向下相容

---

## Proposed Changes

### Types Layer

#### [MODIFY] [symbol.ts](file:///d:/Projects/slot-ide/src/types/symbol.ts)

標註欄位用途：

```typescript
interface SymbolDefinition {
  // 視覺層權重（僅影響滾動動畫）
  appearanceWeight: number;  // 滾動動畫中出現頻率
  
  // 以下欄位保留但不影響數學結果（向下相容）
  /** @deprecated 不影響 Pool 生成，僅供參考 */
  ngWeight: number;
  /** @deprecated 不影響 Pool 生成，僅供參考 */
  fgWeight: number;
}
```

---

### Engine Layer

#### [MODIFY] [pool-builder.ts](file:///d:/Projects/slot-ide/src/engine/pool-builder.ts)

修改 `generateRandomBoard()` 改為均勻分布：

```typescript
/**
 * 生成隨機盤面（均勻分布）
 * 符號權重不影響數學層，僅視覺層使用
 */
private generateRandomBoard(): Board {
  const { cols, rows } = this.boardConfig;
  const symbols = this.symbolManager.getAll();
  const reels: SymbolId[][] = [];

  for (let col = 0; col < cols; col++) {
    const reel: SymbolId[] = [];
    for (let row = 0; row < rows; row++) {
      // 均勻分布抽取，不使用權重
      const randomIndex = Math.floor(Math.random() * symbols.length);
      reel.push(symbols[randomIndex].id);
    }
    reels.push(reel);
  }

  return { reels, cols, rows };
}
```

---

#### [MODIFY] [symbol-manager.ts](file:///d:/Projects/slot-ide/src/engine/symbol-manager.ts)

區分兩種抽取方法：

```typescript
/**
 * 視覺層抽取（滾動動畫用）
 * 使用 appearanceWeight
 */
drawSymbolForAnimation(): SymbolId {
  const symbols = this.symbols;
  const totalWeight = symbols.reduce((sum, s) => sum + s.appearanceWeight, 0);
  let random = Math.random() * totalWeight;
  
  for (const symbol of symbols) {
    random -= symbol.appearanceWeight;
    if (random <= 0) {
      return symbol.id;
    }
  }
  return symbols[0].id;
}

/**
 * 數學層抽取（Pool 生成用）
 * 均勻分布，不使用權重
 */
drawSymbolForPool(): SymbolId {
  const symbols = this.symbols;
  const randomIndex = Math.floor(Math.random() * symbols.length);
  return symbols[randomIndex].id;
}

/**
 * @deprecated 請使用 drawSymbolForAnimation() 或 drawSymbolForPool()
 */
drawSymbol(): SymbolId {
  return this.drawSymbolForPool();
}
```

---

#### [MODIFY] [rtp-calculator.ts](file:///d:/Projects/slot-ide/src/engine/rtp-calculator.ts)

修改 FS 觸發機率計算為均勻分布：

```typescript
/**
 * 計算 Free Spin 觸發機率（理論值）
 * 基於均勻分布（符號權重不影響數學層）
 */
export function calculateFSTriggerProbability(
  symbols: SymbolDefinition[],
  boardConfig: BoardConfig,
  phase: 'ng' | 'fg' = 'ng',
): number {
  const triggerSymbol = symbols.find(s => s.fsTriggerConfig?.enabled);
  if (!triggerSymbol || !triggerSymbol.fsTriggerConfig) return 0;

  // 均勻分布：每個符號出現機率相同
  const probPerCell = 1 / symbols.length;
  const totalCells = boardConfig.cols * boardConfig.rows;
  const triggerCount = triggerSymbol.fsTriggerConfig.triggerCount;

  // 二項分布計算
  let probability = 0;
  for (let k = triggerCount; k <= totalCells; k++) {
    probability += binomialProbability(totalCells, k, probPerCell);
  }

  return probability * 100;
}
```

---

### UI Layer

#### [MODIFY] [SymbolSettings.tsx](file:///d:/Projects/slot-ide/src/components/SymbolSettings.tsx)

更新 UI 標籤：

```tsx
// 權重設定區塊
<div className="weight-section">
  <label>
    視覺權重
    <span className="hint">（僅影響滾動動畫，不影響中獎結果）</span>
  </label>
  <input 
    type="number" 
    value={symbol.appearanceWeight}
    onChange={...}
  />
</div>

{/* 隱藏或移除 ngWeight/fgWeight 輸入欄位 */}
```

---

### Runtime Layer

#### [MODIFY] Reel 動畫相關

確保滾動動畫使用 `drawSymbolForAnimation()`：

```typescript
// 生成 dummy 符號時
const dummySymbol = symbolManager.drawSymbolForAnimation();
```

---

## 驗收條件

- [ ] Pool Builder 使用均勻分布生成盤面
- [ ] 滾動動畫使用 appearanceWeight 生成 dummy 符號
- [ ] FS 觸發機率基於均勻分布計算
- [ ] 理論 RTP = Σ(Outcome 權重 × 平均倍率)
- [ ] UI 標註權重僅影響視覺
- [ ] `npm run build` 成功

---

## Verification Plan

### Manual Verification

1. **RTP 一致性測試**
   - 設定 Outcome: 小獎 0-5x (50%), 大獎 5-10x (50%)
   - 理論 RTP: 0.5×2.5 + 0.5×7.5 = 5.0 = 500%
   - 跑 Simulation 10 萬次
   - ✅ 預期：實際 RTP ≈ 500% (±2%)

2. **視覺權重測試**
   - 設定符號 A 視覺權重 = 100, 符號 B = 10
   - 觀察滾動動畫
   - ✅ 預期：符號 A 在動畫中出現頻率較高

3. **Pool 建池測試**
   - 設定多種符號（不同 appearanceWeight）
   - Build Pool
   - ✅ 預期：Pool 內各符號出現頻率大致相等

---

## 風險評估

> [!WARNING]
> 此變更會改變 Pool 生成邏輯，可能導致：
> - 現有用戶的設定產生不同結果
> - 習慣使用符號權重控制 RTP 的用戶需要重新學習

> [!NOTE]
> 建議在版本更新說明中明確告知：
> 「符號權重現僅影響視覺動畫，RTP 由 Outcome 權重決定」

---

## 相關 Issue

- P2-12 RTP 公式重新設計
- P2-11 Scatter 價值計算（已回滾，待 P2-13 完成後重新評估）
