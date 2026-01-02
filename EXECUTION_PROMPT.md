# slot-ide Execution Prompt（實作指令）

本文件用於指導 AI 進行完整產品實作。
在使用前，請確保已閱讀 AI_GUIDE.md 與 SYSTEM_PROMPT.md。

---

## 目標

完成 slot-ide 這個完整產品。

這不是 MVP，也不是實驗。
請直接以最終產品架構實作。

---

## 必須遵守的架構

- 單一 Vite + React App
- SpinPacket 為唯一資料主幹
- Math Engine → SpinPacket → Runtime Renderer
- Runtime 不得生成盤面
- 不得有 iframe 或 postMessage

---

## 必須完成的功能

### 1) 數學層
- Outcome（倍率區間、權重）
- Pool-based 盤池生成（cap）
- Best-line 結算
- 單次 Spin

### 2) Runtime Renderer
- SlotMachine / Reel
- 動畫完全由 SpinPacket.visual 控制
- 最終停輪必須等於 board

### 3) IDE UI
- 右側參數面板
- Build Pools / Spin / Simulation
- 動畫參數控制
- 素材上傳（symbol / 背景 / 框）

### 4) Simulation / Analytics
- N 次 spin
- RTP / HitRate / AvgWin / TotalWin
- 圖表顯示
- CSV 匯出

---

## 禁止事項

- 禁止新增第二套 RNG
- 禁止新增第二套資料合約
- 禁止暫時 hack
- 禁止 scope creep

---

## 驗收條件

- `npm run dev` 可執行完整產品
- 單次 Spin 與動畫正確
- Simulation 數據正確
- 素材與動畫即時反映
- 程式符合 README_ARCHITECTURE.md

---

## 輸出要求

- 列出修改與新增的檔案
- 簡述資料流（Math → SpinPacket → Runtime）
- 僅在必要時列出 TODO
