# slot-ide V2 任務文件索引

本資料夾包含所有 Cursor 執行任務的詳細規格文件。
執行任務前，請先閱讀對應的任務文件。

---

## 任務文件命名規則

```
P{Phase}-{序號}_{任務名稱}.md

範例：P1-01_type_definitions.md
```

---

## Phase 1：核心機制擴展

| 編號 | 任務 | 狀態 | 預估時間 |
|------|------|------|----------|
| [P1-01](P1-01_type_definitions.md) | 型別定義擴展 | ⏳ | 1 天 |
| [P1-02](P1-02_symbol_system.md) | Symbol 系統擴展（Wild/Scatter） | ⏳ | 2 天 |
| [P1-03](P1-03_settlement_wild.md) | Settlement 邏輯修改（Wild 結算） | ⏳ | 2 天 |
| [P1-04](P1-04_free_spin.md) | Free Spin 機制實作 | ⏳ | 3 天 |
| [P1-05](P1-05_board_5x4.md) | Board 5x4 支援 | ⏳ | 1 天 |
| [P1-06](P1-06_pool_builder.md) | Pool Builder 擴展（NG/FG） | ⏳ | 2 天 |
| [P1-07](P1-07_rtp_calculator.md) | RTP Calculator（NG/FG 分開） | ⏳ | 1 天 |

---

## Phase 2：UI 重構

| 編號 | 任務 | 狀態 | 預估時間 |
|------|------|------|----------|
| [P2-01](P2-01_layout_skeleton.md) | 三欄式佈局骨架 | ⏳ | 2 天 |
| [P2-02](P2-02_control_panel.md) | 左側 Control Panel 架構 | ⏳ | 3 天 |
| [P2-03](P2-03_game_control.md) | 右側 Game Control 架構 | ⏳ | 2 天 |
| [P2-04](P2-04_statistics_panel.md) | 底部統計區 | ⏳ | 1 天 |
| [P2-05](P2-05_symbol_panel.md) | SymbolPanel 擴展（Wild/Scatter UI） | ⏳ | 2 天 |
| [P2-06](P2-06_outcome_panel.md) | OutcomePanel 擴展（NG/FG 切換） | ⏳ | 1 天 |
| [P2-07](P2-07_lines_editor.md) | Pay Lines 視覺化編輯器 | ⏳ | 3 天 |
| [P2-08](P2-08_freespin_panel.md) | Free Spin Panel + Auto Spin | ⏳ | 1 天 |

---

## Phase 3：用戶系統與雲端

| 編號 | 任務 | 狀態 | 預估時間 |
|------|------|------|----------|
| [P3-01](P3-01_firebase_setup.md) | Firebase 專案設定 | ⏳ | 0.5 天 |
| [P3-02](P3-02_auth_module.md) | Auth 模組（Google OAuth） | ⏳ | 1 天 |
| [P3-03](P3-03_firestore_crud.md) | Firestore 模板 CRUD | ⏳ | 2 天 |
| [P3-04](P3-04_storage_upload.md) | Storage 素材上傳 | ⏳ | 1 天 |
| [P3-05](P3-05_dashboard.md) | Dashboard 頁面 | ⏳ | 2 天 |
| [P3-06](P3-06_guest_mode.md) | 訪客模式處理 | ⏳ | 1 天 |

---

## Phase 4：進階功能

| 編號 | 任務 | 狀態 | 預估時間 |
|------|------|------|----------|
| [P4-01](P4-01_simulation_modes.md) | Simulation 堆疊/比較模式 | ⏳ | 2 天 |
| [P4-02](P4-02_validation_tools.md) | 數值驗證工具 | ⏳ | 2 天 |
| [P4-03](P4-03_dark_mode.md) | 深色模式 | ⏳ | 1 天 |
| [P4-04](P4-04_integration_test.md) | 最終整合測試 | ⏳ | 2 天 |

---

## 任務文件結構

每個任務文件包含以下章節：

```markdown
# P{X}-{XX} {任務標題}

## 目標 (Objective)
明確定義本次任務的最終目標

## 範圍 (Scope)
指定需要改動的檔案路徑

## 實作細節 (Implementation Details)
### 問題根源（如適用）
### 修正方案
### 完整修正

## 驗收條件 (Acceptance Criteria)
條列式的測試清單

## 輸出格式 (Output Format)
定義完成後的輸出形式
```

---

## 使用方式

1. 按照 Phase 順序執行任務
2. 執行前閱讀對應的任務文件
3. 完成後更新任務狀態
4. 通過驗收條件後才能進入下一個任務

