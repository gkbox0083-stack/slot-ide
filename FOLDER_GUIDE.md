# slot-ide V2 資料夾結構說明

本文件說明 `src/` 下各資料夾的用途與責任邊界。
AI 在開發時應嚴格遵守這些邊界。

---

## src/types/
**用途**：型別定義（合約層）

**包含**：
- SpinPacket v2 主合約
- Board / Outcome / VisualConfig 等子型別
- Symbol 定義（含 Wild/Scatter）
- Free Spin 型別
- Template / User 型別
- 所有跨模組共用的介面

**規則**：
- 這裡是「合約」，修改需謹慎
- 不含任何邏輯，只有型別
- 所有模組都依賴這裡

---

## src/engine/
**用途**：Math Engine（數學層）

**包含**：
- Outcome 管理（NG/FG 分離）
- Pool 建立（NG Pool / FG Pool）
- Spin 執行（含 Free Spin 流程）
- Best-line 結算（含 Wild 替代）
- RTP 計算（NG/FG 分開）

**規則**：
- 是所有結果的唯一來源
- 唯一可以有 RNG 的地方
- 不可依賴 runtime 或 ide
- Wild 結算邏輯只能在 settlement.ts
- Scatter 觸發邏輯只能在 spin-executor.ts

---

## src/runtime/
**用途**：Runtime Renderer（渲染層）

**包含**：
- SlotMachine 元件
- Reel / Symbol 元件
- 動畫邏輯

**規則**：
- 只接收 SpinPacket v2
- 不可有 RNG
- 不可生成盤面
- 不可結算
- 滾動時使用 appearanceWeight 顯示符號

---

## src/ide/
**用途**：IDE 介面（UI 層）

**包含**：
- layout/：三欄式主佈局
  - IDELayout.tsx：主容器
  - ControlPanel.tsx：左側控制面板
  - GameControl.tsx：右側遊戲控制
  - StatisticsPanel.tsx：底部統計區
- panels/：各種設定面板
  - OutcomePanel.tsx：Outcome 設定（NG/FG 切換）
  - SymbolPanel.tsx：Symbol 設定（Wild/Scatter）
  - LinesPanel.tsx：Pay Lines 視覺化編輯
  - PoolPanel.tsx：Pool 管理
  - BettingPanel.tsx：下注設定
  - SimulationPanel.tsx：模擬設定
  - HistoryPanel.tsx：歷史紀錄
  - FreeSpinPanel.tsx：Free Spin 資訊

**規則**：
- 收集使用者輸入
- 觸發 Engine 動作
- 顯示結果
- 不可直接修改 Engine 或 Runtime 內部狀態

---

## src/analytics/
**用途**：統計分析

**包含**：
- Simulator（批次 spin，支援堆疊/比較）
- 圖表元件
- CSV 匯出
- 數值驗證工具

**規則**：
- 必須使用 Engine 的 spin（不可自己實作）
- 只做統計與展示

---

## src/store/
**用途**：狀態管理（Zustand）

**包含**：
- useGameConfigStore.ts：遊戲配置狀態
- useUIStore.ts：UI 狀態
- useAuthStore.ts：用戶認證狀態
- useFreeSpinStore.ts：Free Spin 狀態
- useSimulationStore.ts：Simulation 狀態
- useTemplateStore.ts：模板管理狀態

**規則**：
- 作為 IDE 與各模組的橋樑
- 狀態結構需文件化
- Free Spin 狀態只能在 useFreeSpinStore.ts 管理

---

## src/firebase/
**用途**：Firebase 整合

**包含**：
- config.ts：Firebase 配置
- auth.ts：用戶認證（Google OAuth）
- firestore.ts：模板 CRUD
- storage.ts：素材上傳

**規則**：
- 只處理與 Firebase 的通訊
- 不包含遊戲邏輯
- 遵守安全規則（用戶只能存取自己的數據）

---

## src/pages/
**用途**：頁面元件

**包含**：
- Dashboard.tsx：用戶 Dashboard（模板列表）
- Editor.tsx：Slot IDE 編輯器

**規則**：
- 組合 layout 和 panels
- 處理路由邏輯

---

## src/utils/
**用途**：工具函式

**包含**：
- 通用輔助函式
- 不屬於特定模組的邏輯

**規則**：
- 保持純函式
- 不依賴特定模組

---

## prompts/
**用途**：Cursor 執行任務文件

**包含**：
- P0-xx_*.md：Phase 0 任務
- P1-xx_*.md：Phase 1 任務
- P2-xx_*.md：Phase 2 任務
- P3-xx_*.md：Phase 3 任務
- P4-xx_*.md：Phase 4 任務
- README.md：任務文件索引

**規則**：
- 每個任務一個文件
- 包含詳細的實作規格
- AI 執行前應先閱讀對應文件
