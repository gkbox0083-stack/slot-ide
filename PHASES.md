# slot-ide V2 開發階段規劃（Development Phases）

本文件定義專案的分階段開發計畫。
每個階段都有明確的範圍、交付物與驗收條件。

---

## 階段總覽

| Phase | 名稱 | 狀態 | 預估時間 |
|-------|------|------|----------|
| 0 | 文件更新 | ✅ 完成 | 1 天 |
| 1 | 核心機制擴展 | 🔄 進行中 | 12 天 |
| 2 | UI 重構 | ⏳ 待開始 | 15 天 |
| 3 | 用戶系統與雲端 | ⏳ 待開始 | 7.5 天 |
| 4 | 進階功能 | ⏳ 待開始 | 7 天 |

---

## Phase 0：文件更新 ✅

### 目標
更新所有規則文件以反映 V2 架構

### 交付物
- [x] `.cursor/rules/rule.mdc` — 新增 V2 約束
- [x] `README_ARCHITECTURE.md` — 擴展型別定義、雙層機率模型
- [x] `AI_GUIDE.md` — 更新專案目標、V2 功能說明
- [x] `P0_GATE.md` — 新增 V2 檢查項目
- [x] `PHASES.md` — 重寫為 V2 階段（本文件）
- [x] `FOLDER_GUIDE.md` — 新增 firebase/、pages/ 說明
- [x] `CHECKLIST.md` — 重寫為 V2 驗收清單
- [x] `PRD_SLOT_IDE_V2.md` — 更新 Auto Spin 功能
- [x] `prompts/` — 建立任務文件資料夾

### 驗收條件
- [x] 所有文件已更新
- [x] prompts/ 資料夾已建立

---

## Phase 1：核心機制擴展 🔄

### 目標
擴展 Math Engine 支援 Wild/Scatter/Free Spin 和 NG/FG 分離

### 任務清單

| 編號 | 任務 | 狀態 | 任務文件 |
|------|------|------|----------|
| P1-01 | 型別定義擴展 | ⏳ | `prompts/P1-01_type_definitions.md` |
| P1-02 | Symbol 系統擴展（Wild/Scatter） | ⏳ | `prompts/P1-02_symbol_system.md` |
| P1-03 | Settlement 邏輯修改（Wild 結算） | ⏳ | `prompts/P1-03_settlement_wild.md` |
| P1-04 | Free Spin 機制實作 | ⏳ | `prompts/P1-04_free_spin.md` |
| P1-05 | Board 5x4 支援 | ⏳ | `prompts/P1-05_board_5x4.md` |
| P1-06 | Pool Builder 擴展（NG/FG） | ⏳ | `prompts/P1-06_pool_builder.md` |
| P1-07 | RTP Calculator（NG/FG 分開） | ⏳ | `prompts/P1-07_rtp_calculator.md` |

### 關鍵檔案
```
src/types/
├── symbol.ts        # 擴展 SymbolDefinition
├── outcome.ts       # 新增 GamePhase
├── board.ts         # 支援 5x4
├── free-spin.ts     # 新增
└── spin-packet.ts   # 升級至 v2

src/engine/
├── settlement.ts    # Wild 結算邏輯
├── spin-executor.ts # Free Spin 流程
├── pool-builder.ts  # NG/FG Pool 分離
└── rtp-calculator.ts # 新增
```

### 驗收條件
- [ ] Wild 符號可正確替代一般符號
- [ ] Wild 符號不會替代特殊符號
- [ ] Scatter 觸發 Free Spin 正確
- [ ] Free Spin 次數正確扣減
- [ ] Retrigger 功能正常
- [ ] Multiplier 計算正確
- [ ] 5x4 盤面可正常生成
- [ ] NG/FG Pool 分開建立
- [ ] RTP 分開顯示（NG/FG/總）

---

## Phase 2：UI 重構 ⏳

### 目標
重構 IDE 介面為三欄式佈局

### 任務清單

| 編號 | 任務 | 狀態 | 任務文件 |
|------|------|------|----------|
| P2-01 | 三欄式佈局骨架 | ⏳ | `prompts/P2-01_layout_skeleton.md` |
| P2-02 | 左側 Control Panel 架構 | ⏳ | `prompts/P2-02_control_panel.md` |
| P2-03 | 右側 Game Control 架構 | ⏳ | `prompts/P2-03_game_control.md` |
| P2-04 | 底部統計區 | ⏳ | `prompts/P2-04_statistics_panel.md` |
| P2-05 | SymbolPanel 擴展（Wild/Scatter UI） | ⏳ | `prompts/P2-05_symbol_panel.md` |
| P2-06 | OutcomePanel 擴展（NG/FG 切換） | ⏳ | `prompts/P2-06_outcome_panel.md` |
| P2-07 | Pay Lines 視覺化編輯器 | ⏳ | `prompts/P2-07_lines_editor.md` |
| P2-08 | Free Spin Panel + Auto Spin | ⏳ | `prompts/P2-08_freespin_panel.md` |

### 關鍵檔案
```
src/ide/
├── layout/
│   ├── IDELayout.tsx      # 重構為三欄式
│   ├── ControlPanel.tsx   # 新增
│   ├── GameControl.tsx    # 新增
│   └── StatisticsPanel.tsx # 新增
└── panels/
    ├── SymbolPanel.tsx    # 擴展
    ├── OutcomePanel.tsx   # 擴展
    ├── LinesPanel.tsx     # 視覺化編輯器
    ├── PoolPanel.tsx      # 新增
    ├── BettingPanel.tsx   # 新增
    ├── SimulationPanel.tsx # 新增
    ├── HistoryPanel.tsx   # 新增
    └── FreeSpinPanel.tsx  # 新增
```

### 驗收條件
- [ ] 三欄式佈局正確顯示
- [ ] 左側 Tab 切換正常
- [ ] 右側 Tab 切換正常
- [ ] 底部統計區可收合
- [ ] SymbolPanel Wild/Scatter 設定正常
- [ ] OutcomePanel NG/FG 切換正常
- [ ] Pay Lines 視覺化編輯可用
- [ ] Auto Spin 功能正常
- [ ] 盤面模式切換有確認彈窗

---

## Phase 3：用戶系統與雲端 ⏳

### 目標
整合 Firebase 實現用戶系統和雲端模板管理

### 任務清單

| 編號 | 任務 | 狀態 | 任務文件 |
|------|------|------|----------|
| P3-01 | Firebase 專案設定 | ⏳ | `prompts/P3-01_firebase_setup.md` |
| P3-02 | Auth 模組（Google OAuth） | ⏳ | `prompts/P3-02_auth_module.md` |
| P3-03 | Firestore 模板 CRUD | ⏳ | `prompts/P3-03_firestore_crud.md` |
| P3-04 | Storage 素材上傳 | ⏳ | `prompts/P3-04_storage_upload.md` |
| P3-05 | Dashboard 頁面 | ⏳ | `prompts/P3-05_dashboard.md` |
| P3-06 | 訪客模式處理 | ⏳ | `prompts/P3-06_guest_mode.md` |

### 關鍵檔案
```
src/firebase/
├── config.ts
├── auth.ts
├── firestore.ts
└── storage.ts

src/store/
├── useAuthStore.ts
└── useTemplateStore.ts

src/pages/
├── Dashboard.tsx
└── Editor.tsx
```

### 驗收條件
- [ ] Google 登入/登出正常
- [ ] 模板可儲存到雲端
- [ ] 模板可從雲端讀取
- [ ] 模板可刪除
- [ ] Dashboard 顯示正確
- [ ] 訪客無法儲存/匯出

---

## Phase 4：進階功能 ⏳

### 目標
實現進階功能和最終整合

### 任務清單

| 編號 | 任務 | 狀態 | 任務文件 |
|------|------|------|----------|
| P4-01 | Simulation 堆疊/比較模式 | ⏳ | `prompts/P4-01_simulation_modes.md` |
| P4-02 | 數值驗證工具 | ⏳ | `prompts/P4-02_validation_tools.md` |
| P4-03 | 深色模式 | ⏳ | `prompts/P4-03_dark_mode.md` |
| P4-04 | 最終整合測試 | ⏳ | `prompts/P4-04_integration_test.md` |

### 驗收條件
- [ ] Simulation 堆疊模式正確累加
- [ ] Simulation 比較模式並排顯示
- [ ] 數值驗證工具可檢測矛盾
- [ ] 深色模式可切換
- [ ] 所有功能整合測試通過

---

## 注意事項

- 每個 Phase 完成後，需經過驗收再進入下一階段
- 不可跨階段開發（例如 Phase 1 未完成就做 Phase 2）
- 遇到架構疑問，回到 README_ARCHITECTURE.md 查閱
- 每個任務的詳細規格請參考 `prompts/` 資料夾中的對應文件
