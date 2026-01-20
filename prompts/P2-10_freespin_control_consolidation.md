# P2-10 Free Spin 控制整合方案

> **⚠️ 已過時 (DEPRECATED)**
>
> 此任務文件已於 V3 簡化版中標記為過時。
> V3 版本移除了 Free Spin 機制，此問題不再適用。
> 保留此文件僅供歷史參考。

---

## 問題摘要

目前存在 **兩套重複的 Free Spin 配置**，導致 UI 與結算邏輯不同步：

| 配置來源 | 位置 | 被誰使用 |
|---------|------|---------|
| `FreeSpinConfig` | `useGameConfigStore.freeSpinConfig` | FS 面板 UI、`GameControlBar` 觸發邏輯 |
| `ScatterConfig` | `symbols[].scatterConfig` | Settlement 結算引擎（觸發判斷） |

### 衍生問題對照

| 問題 | 根因 |
|------|------|
| FS Panel「觸發條件」無效 | `FreeSpinConfig.triggerCount` 未被 settlement 使用，settlement 直接讀取 `scatterConfig.triggerCount` |
| FS Panel「基礎次數」有效 | `GameControlBar` 使用 `freeSpinConfig.baseSpinCount` 來初始化 Free Spin |
| Symbol「Free Spin 次數」無效 | `scatterConfig.freeSpinCount` 未被任何邏輯讀取 |
| Retrigger 功能異常 | 關閉時阻擋 NG 觸發是因為 `freeSpinConfig.enabled` 被當作總開關 |

---

## 整合方案

### 設計原則

**「符號設定是唯一真相來源」** — 所有 Free Spin 相關配置都應該定義在 Scatter 符號的 `scatterConfig` 中，避免重複配置。

### 控制項整併對照表

| 原 FS Panel 控制項 | 整併至 Scatter 設定 | 動作 |
|-------------------|-------------------|------|
| Free Spin 功能開關 | 移除（常駐開啟） | DELETE |
| 觸發條件（2/3/4/5個） | `scatterConfig.triggerCount` | 已存在 ✅ |
| 基礎 Free Spin 次數 | `scatterConfig.freeSpinCount` | 已存在 ✅ |
| Retrigger 開關 | `scatterConfig.enableRetrigger` | 已存在 ✅ |
| Retrigger 額外次數 | `scatterConfig.retriggerSpinCount` | 需新增 ⚠️ |
| Multiplier 開關 | `scatterConfig.enableMultiplier` | 已存在 ✅ |
| Multiplier 倍率 | `scatterConfig.multiplierValue` | 已存在 ✅ |

---

## User Review Required

> [!IMPORTANT]
> 以下變更需要您確認：

1. **刪除 `FreeSpinConfig` 類型和 `freeSpinConfig` store 欄位**
   - FS 面板將只顯示「Free Spin 進行中」狀態區塊
   - 所有配置項從 FS 面板移除

2. **擴展 `ScatterConfig` 類型**
   - 新增 `retriggerSpinCount` 欄位（預設為 5）
   
3. **修改結算邏輯**
   - `GameControlBar.handleSpin` 直接讀取 Scatter 符號的 `scatterConfig`

---

## Proposed Changes

### Types Layer

#### [MODIFY] [symbol.ts](file:///d:/Projects/slot-ide/src/types/symbol.ts)

新增 `retriggerSpinCount` 至 `ScatterConfig`:

```diff
 export interface ScatterConfig {
   triggerCount: number;
   freeSpinCount: number;
   enableRetrigger: boolean;
+  retriggerSpinCount: number;  // Retrigger 額外次數（預設 5）
   enableMultiplier: boolean;
   multiplierValue: number;
 }
```

#### [DELETE] 部分欄位自 [free-spin.ts](file:///d:/Projects/slot-ide/src/types/free-spin.ts)

移除 `FreeSpinConfig.triggerCount`, `baseSpinCount` 等重複欄位（或完全刪除 `FreeSpinConfig` 類型）

---

### Store Layer

#### [MODIFY] [useGameConfigStore.ts](file:///d:/Projects/slot-ide/src/store/useGameConfigStore.ts)

1. 移除 `freeSpinConfig` state 和相關 actions
2. 更新預設 Scatter 符號的 `scatterConfig`：
   ```typescript
   scatterConfig: {
     triggerCount: 3,
     freeSpinCount: 10,
     enableRetrigger: true,
     retriggerSpinCount: 5,
     enableMultiplier: true,
     multiplierValue: 2,
   }
   ```

---

### UI Layer

#### [MODIFY] [FreeSpinPanel.tsx](file:///d:/Projects/slot-ide/src/ide/panels/FreeSpinPanel.tsx)

簡化為只顯示「Free Spin 進行中」狀態區塊。移除：
- Free Spin 功能開關
- 觸發條件設定
- 基礎次數設定
- Retrigger 設定
- Multiplier 設定
- 配置摘要

#### [MODIFY] [SymbolPanel.tsx](file:///d:/Projects/slot-ide/src/ide/panels/SymbolPanel.tsx)

擴展 Scatter 設定區塊，新增 Retrigger 額外次數輸入：

```tsx
{editedSymbol.scatterConfig.enableRetrigger && (
  <div>
    <label>Retrigger 額外次數</label>
    <input
      type="number"
      value={editedSymbol.scatterConfig.retriggerSpinCount}
      onChange={...}
    />
  </div>
)}
```

---

### Engine Layer

#### [MODIFY] [GameControlBar.tsx](file:///d:/Projects/slot-ide/src/ide/layout/GameControlBar.tsx)

修改 `handleSpin` 函式，改為從 Scatter 符號讀取配置：

```typescript
// 取得 Scatter 配置（唯一真相來源）
const symbols = useGameConfigStore.getState().symbols;
const scatterSymbol = symbols.find(s => s.type === 'scatter');
const scatterConfig = scatterSymbol?.scatterConfig;

// 觸發 Free Spin
if (packet.meta?.triggeredFreeSpin && !isInFreeSpin && scatterConfig) {
  freeSpinState.triggerFreeSpin(
    packet.meta.scatterCount || 0,
    scatterConfig.freeSpinCount,
    scatterConfig.enableMultiplier ? scatterConfig.multiplierValue : 1
  );
}

// Retrigger
if (packet.meta?.triggeredFreeSpin && isInFreeSpin && scatterConfig?.enableRetrigger) {
  freeSpinState.retrigger(scatterConfig.retriggerSpinCount);
}
```

#### [MODIFY] [useFreeSpinStore.ts](file:///d:/Projects/slot-ide/src/store/useFreeSpinStore.ts)

更新 `triggerFreeSpin` signature：

```typescript
triggerFreeSpin: (
  scatterCount: number,
  baseSpinCount: number,
  multiplier: number
) => void;
```

---

### Other Affected Files

- [PoolPanel.tsx](file:///d:/Projects/slot-ide/src/ide/panels/PoolPanel.tsx) - 移除 `freeSpinConfig.enabled` 顯示
- [SimulationPanel.tsx](file:///d:/Projects/slot-ide/src/ide/panels/SimulationPanel.tsx) - 改用 `scatterConfig`
- [rtp-calculator.ts](file:///d:/Projects/slot-ide/src/engine/rtp-calculator.ts) - 改用 `scatterConfig`
- [HistoryPanel.tsx](file:///d:/Projects/slot-ide/src/ide/panels/HistoryPanel.tsx) - 移除 `freeSpinConfig` 依賴

---

## Verification Plan

### Automated Tests

目前專案沒有單元測試。建議手動驗證。

### Manual Verification

1. **觸發條件測試**
   - 開啟 `http://localhost:5173`
   - 進入 [數值] → 符號設定 → SCATTER → Scatter 設定
   - 設定「觸發數量」為 3
   - 設定 SCATTER 的 ngWeight 為 3000
   - 點擊 Pool → Build Pools
   - 重複 Spin 直到觸發 Free Spin
   - ✅ 預期：3 個 Scatter 時觸發

2. **Free Spin 次數測試**
   - 設定「Free Spin 次數」為 5
   - 觸發 Free Spin
   - ✅ 預期：顯示 5/5 次

3. **Retrigger 測試**
   - 勾選「啟用 Retrigger」並設定額外次數為 3
   - 觸發 Free Spin
   - 在 FG 期間再次出現 3+ Scatter
   - ✅ 預期：次數增加 3

4. **Multiplier 測試**
   - 勾選「啟用 Multiplier」並設定為 2x
   - 觸發 Free Spin
   - ✅ 預期：獎金顯示 2x 倍率

5. **FS 面板簡化確認**
   - ✅ 預期：FS 面板只顯示「Free Spin 進行中」狀態區塊，無配置控制項
