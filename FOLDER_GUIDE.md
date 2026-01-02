# slot-ide 資料夾結構說明

本文件說明 `src/` 下各資料夾的用途與責任邊界。
AI 在開發時應嚴格遵守這些邊界。

---

## src/types/
**用途**：型別定義（合約層）

**包含**：
- SpinPacket 主合約
- Board / Outcome / VisualConfig 等子型別
- 所有跨模組共用的介面

**規則**：
- 這裡是「合約」，修改需謹慎
- 不含任何邏輯，只有型別
- 所有模組都依賴這裡

---

## src/engine/
**用途**：Math Engine（數學層）

**包含**：
- Outcome 管理
- Pool 建立
- Spin 執行
- Best-line 結算

**規則**：
- 是所有結果的唯一來源
- 唯一可以有 RNG 的地方
- 不可依賴 runtime 或 ide

---

## src/runtime/
**用途**：Runtime Renderer（渲染層）

**包含**：
- SlotMachine 元件
- Reel / Symbol 元件
- 動畫邏輯

**規則**：
- 只接收 SpinPacket
- 不可有 RNG
- 不可生成盤面
- 不可結算

---

## src/ide/
**用途**：IDE 介面（UI 層）

**包含**：
- panels/：各種設定面板
- layout/：整體佈局

**規則**：
- 收集使用者輸入
- 觸發 Engine 動作
- 顯示結果
- 不可直接修改 Engine 或 Runtime 內部狀態

---

## src/analytics/
**用途**：統計分析

**包含**：
- Simulator（批次 spin）
- 圖表元件
- CSV 匯出

**規則**：
- 必須使用 Engine 的 spin（不可自己實作）
- 只做統計與展示

---

## src/store/
**用途**：狀態管理

**包含**：
- 全域狀態定義
- 狀態更新邏輯

**規則**：
- 作為 IDE 與各模組的橋樑
- 狀態結構需文件化

---

## src/utils/
**用途**：工具函式

**包含**：
- 通用輔助函式
- 不屬於特定模組的邏輯

**規則**：
- 保持純函式
- 不依賴特定模組
