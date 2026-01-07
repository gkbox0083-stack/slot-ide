# P1-02 Symbol 系統擴展（Wild/Scatter）

## 目標 (Objective)

擴展 Symbol Manager 支援 Wild 和 Scatter 符號類型，包括：
- 符號類型識別
- Wild/Scatter 配置管理
- 預設符號更新

---

## 範圍 (Scope)

需要修改的檔案：
- `src/engine/symbol-manager.ts`
- `src/store/useGameConfigStore.ts`

依賴：
- P1-01（型別定義擴展）必須先完成

---

## 實作細節 (Implementation Details)

### 1. symbol-manager.ts 擴展

需要新增以下功能：

```typescript
/**
 * 判斷符號是否為 Wild
 */
export function isWildSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'wild';
}

/**
 * 判斷符號是否為 Scatter
 */
export function isScatterSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'scatter';
}

/**
 * 判斷符號是否為一般符號
 */
export function isNormalSymbol(symbol: SymbolDefinition): boolean {
  return symbol.type === 'normal';
}

/**
 * 取得 Wild 符號列表
 */
export function getWildSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isWildSymbol);
}

/**
 * 取得 Scatter 符號列表
 */
export function getScatterSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isScatterSymbol);
}

/**
 * 取得一般符號列表
 */
export function getNormalSymbols(symbols: SymbolDefinition[]): SymbolDefinition[] {
  return symbols.filter(isNormalSymbol);
}

/**
 * 檢查 Wild 是否可以替代指定符號
 */
export function canWildReplace(
  wild: SymbolDefinition, 
  target: SymbolDefinition
): boolean {
  if (!isWildSymbol(wild) || !wild.wildConfig) {
    return false;
  }
  
  if (isNormalSymbol(target)) {
    return wild.wildConfig.canReplaceNormal;
  }
  
  // target 是 wild 或 scatter
  return wild.wildConfig.canReplaceSpecial;
}

/**
 * 根據遊戲階段取得符號權重
 */
export function getSymbolWeight(
  symbol: SymbolDefinition, 
  phase: 'ng' | 'fg'
): number {
  return phase === 'ng' ? symbol.ngWeight : symbol.fgWeight;
}

/**
 * 建立預設 Wild 符號
 */
export function createDefaultWildSymbol(): SymbolDefinition {
  return {
    id: 'WILD',
    name: '百搭',
    type: 'wild',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 5,
    ngWeight: 5,
    fgWeight: 15,
    wildConfig: {
      canReplaceNormal: true,
      canReplaceSpecial: false,
    },
  };
}

/**
 * 建立預設 Scatter 符號
 */
export function createDefaultScatterSymbol(): SymbolDefinition {
  return {
    id: 'SCATTER',
    name: '分散',
    type: 'scatter',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 3,
    ngWeight: 3,
    fgWeight: 5,
    scatterConfig: {
      triggerCount: 3,
      freeSpinCount: 10,
      enableRetrigger: true,
      enableMultiplier: true,
      multiplierValue: 2,
    },
  };
}
```

### 2. useGameConfigStore.ts 更新預設符號

更新 `defaultSymbols` 以包含新欄位：

```typescript
const defaultSymbols: SymbolDefinition[] = [
  // 高分符號
  { 
    id: 'H1', 
    name: '皇冠', 
    type: 'normal',
    category: 'high', 
    payouts: { match3: 50, match4: 100, match5: 200 }, 
    appearanceWeight: 10,
    ngWeight: 10,
    fgWeight: 10,
  },
  { 
    id: 'H2', 
    name: '鑽石', 
    type: 'normal',
    category: 'high', 
    payouts: { match3: 40, match4: 80, match5: 160 }, 
    appearanceWeight: 15,
    ngWeight: 15,
    fgWeight: 15,
  },
  { 
    id: 'H3', 
    name: '金幣', 
    type: 'normal',
    category: 'high', 
    payouts: { match3: 30, match4: 60, match5: 120 }, 
    appearanceWeight: 20,
    ngWeight: 20,
    fgWeight: 20,
  },
  // 低分符號
  { 
    id: 'L1', 
    name: 'A', 
    type: 'normal',
    category: 'low', 
    payouts: { match3: 10, match4: 20, match5: 40 }, 
    appearanceWeight: 30,
    ngWeight: 30,
    fgWeight: 30,
  },
  { 
    id: 'L2', 
    name: 'K', 
    type: 'normal',
    category: 'low', 
    payouts: { match3: 8, match4: 16, match5: 32 }, 
    appearanceWeight: 35,
    ngWeight: 35,
    fgWeight: 35,
  },
  { 
    id: 'L3', 
    name: 'Q', 
    type: 'normal',
    category: 'low', 
    payouts: { match3: 6, match4: 12, match5: 24 }, 
    appearanceWeight: 40,
    ngWeight: 40,
    fgWeight: 40,
  },
  { 
    id: 'L4', 
    name: 'J', 
    type: 'normal',
    category: 'low', 
    payouts: { match3: 4, match4: 8, match5: 16 }, 
    appearanceWeight: 45,
    ngWeight: 45,
    fgWeight: 45,
  },
  // Wild 符號
  {
    id: 'WILD',
    name: '百搭',
    type: 'wild',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 5,
    ngWeight: 5,
    fgWeight: 15,
    wildConfig: {
      canReplaceNormal: true,
      canReplaceSpecial: false,
    },
  },
  // Scatter 符號
  {
    id: 'SCATTER',
    name: '分散',
    type: 'scatter',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 3,
    ngWeight: 3,
    fgWeight: 5,
    scatterConfig: {
      triggerCount: 3,
      freeSpinCount: 10,
      enableRetrigger: true,
      enableMultiplier: true,
      multiplierValue: 2,
    },
  },
];
```

### 3. 新增 Symbol 管理 Actions

在 Store 中新增：

```typescript
// 新增符號
addSymbol: (symbol: Omit<SymbolDefinition, 'id'>) => void;

// 刪除符號
removeSymbol: (id: string) => void;

// 更新 Wild 配置
updateWildConfig: (symbolId: string, config: WildConfig) => void;

// 更新 Scatter 配置
updateScatterConfig: (symbolId: string, config: ScatterConfig) => void;
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] `isWildSymbol()` 正確識別 Wild 符號
- [ ] `isScatterSymbol()` 正確識別 Scatter 符號
- [ ] `canWildReplace()` 正確判斷替代邏輯
- [ ] `getSymbolWeight()` 根據 phase 返回正確權重
- [ ] 預設符號包含 Wild 和 Scatter
- [ ] 所有 normal 符號包含 ngWeight 和 fgWeight
- [ ] Store 可正確新增/刪除符號
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/engine/symbol-manager.ts` 完整程式碼
2. `src/store/useGameConfigStore.ts` 修改片段
3. 單元測試結果（如有）

