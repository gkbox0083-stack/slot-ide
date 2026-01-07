# slot-ide V2 驗收清單（Acceptance Checklist）

本文件提供每個 Phase 的驗收清單，完成後逐項打勾。
**所有項目通過後，才能進入 P0 Gate。**

---

## 使用方式

1. 複製對應 Phase 的清單
2. 逐項驗證並打勾
3. 全部通過 → 進入 P0 Gate
4. 有失敗 → 修復後重新驗證

---

## Phase 0：文件更新

### 規則文件
- [ ] `.cursor/rules/rule.mdc` 已更新（V2 約束）
- [ ] `README_ARCHITECTURE.md` 已更新（型別定義、雙層機率模型）
- [ ] `AI_GUIDE.md` 已更新（V2 功能說明）
- [ ] `P0_GATE.md` 已更新（V2 檢查項目）
- [ ] `PHASES.md` 已更新（V2 階段規劃）
- [ ] `FOLDER_GUIDE.md` 已更新（新資料夾說明）
- [ ] `CHECKLIST.md` 已更新（本文件）

### 任務文件
- [ ] `prompts/` 資料夾已建立
- [ ] 所有 Phase 的任務文件已生成
- [ ] `prompts/README.md` 任務索引已建立

### PRD
- [ ] `PRD_SLOT_IDE_V2.md` Auto Spin 功能已更新

---

## Phase 1：核心機制擴展

### P1-01：型別定義擴展
- [ ] `src/types/symbol.ts` 新增 SymbolType, WildConfig, ScatterConfig
- [ ] `src/types/symbol.ts` 新增 ngWeight, fgWeight
- [ ] `src/types/outcome.ts` 新增 GamePhase
- [ ] `src/types/board.ts` 支援 BoardRows (3 | 4)
- [ ] `src/types/free-spin.ts` 新增 FreeSpinConfig, FreeSpinState
- [ ] `src/types/spin-packet.ts` 升級至 v2
- [ ] 所有型別可正確 import
- [ ] 無 `any` 型別

### P1-02：Symbol 系統擴展
- [ ] SymbolManager 支援 type 屬性
- [ ] Wild 符號可正確識別
- [ ] Scatter 符號可正確識別
- [ ] ngWeight/fgWeight 可正確讀取

### P1-03：Settlement Wild 結算
- [ ] Wild 替代邏輯只在 settlement.ts
- [ ] Wild 正確替代一般符號
- [ ] Wild 不替代特殊符號（當 canReplaceSpecial = false）
- [ ] Wild 組合選擇最高分
- [ ] winningLine 包含 hasWild 和 wildPositions

### P1-04：Free Spin 機制
- [ ] Scatter 觸發邏輯只在 spin-executor.ts
- [ ] Free Spin 狀態機只在 useFreeSpinStore.ts
- [ ] 觸發條件正確（Scatter >= triggerCount）
- [ ] Free Spin 次數正確扣減
- [ ] Retrigger 正確延長次數
- [ ] Multiplier 正確計算
- [ ] Free Spin 結束後正確返回 NG

### P1-05：Board 5x4 支援
- [ ] Board 型別支援 rows: 3 | 4
- [ ] Pool Builder 可生成 5x4 盤面
- [ ] Settlement 可處理 5x4 盤面
- [ ] 切換時清空 Pool

### P1-06：Pool Builder NG/FG
- [ ] NG Pool 和 FG Pool 分開建立
- [ ] NG Pool 使用 ngWeight
- [ ] FG Pool 使用 fgWeight
- [ ] Pool Builder 不使用 appearanceWeight
- [ ] NG 模式只使用 NG Pool
- [ ] FG 模式只使用 FG Pool

### P1-07：RTP Calculator
- [ ] NG RTP 正確計算
- [ ] FG RTP 正確計算
- [ ] 總 RTP = NG RTP + FG RTP 貢獻
- [ ] FG 觸發機率正確計算

### 數據驗證
- [ ] 1000 次 spin，RTP 趨近預期值（±5%）
- [ ] Free Spin 觸發率趨近理論值
- [ ] Wild 出現率符合權重設定

---

## Phase 2：UI 重構

### P2-01：三欄式佈局骨架
- [ ] IDELayout 顯示三欄
- [ ] 左側 25% / 中間 50% / 右側 25%
- [ ] 響應式佈局正常

### P2-02：左側 Control Panel
- [ ] Tab 切換器顯示（數值/視覺/Pool）
- [ ] 數值設定 Tab 內容正確
- [ ] 視覺設定 Tab 內容正確
- [ ] Pool Tab 內容正確

### P2-03：右側 Game Control
- [ ] 頂部快捷鍵顯示（SPIN/SIM/AUTO SPIN）
- [ ] Tab 切換器顯示（Betting/Simulation/History/Free Spin）
- [ ] 各 Tab 內容正確

### P2-04：底部統計區
- [ ] 統計區顯示三個圖表
- [ ] 可收合/展開
- [ ] CSV 匯出按鈕可用

### P2-05：SymbolPanel Wild/Scatter UI
- [ ] Symbol 類別選擇（normal/wild/scatter）
- [ ] Wild 選擇後顯示 WildConfig 設定
- [ ] Scatter 選擇後顯示 ScatterConfig 設定
- [ ] ngWeight/fgWeight 雙欄顯示

### P2-06：OutcomePanel NG/FG 切換
- [ ] 頂部切換器 [Base Game | Free Game]
- [ ] 切換後顯示對應 Outcomes
- [ ] CRUD 操作正確

### P2-07：Pay Lines 視覺化編輯器
- [ ] 盤面格子顯示
- [ ] 點擊設定線路
- [ ] 拖拉調整線路
- [ ] 新增/刪除線路
- [ ] 最多 50 條線限制

### P2-08：Free Spin Panel + Auto Spin
- [ ] 當前模式顯示（NG/FG）
- [ ] Free Spin 剩餘次數顯示
- [ ] 累積獎金顯示
- [ ] Auto Spin 啟動/停止功能
- [ ] Auto Spin 持續執行直到取消

### 盤面模式切換
- [ ] 5x3/5x4 切換 UI
- [ ] 切換時彈出確認對話框
- [ ] 確認後清空 Pool 並更新佈局

---

## Phase 3：用戶系統與雲端

### P3-01：Firebase 專案設定
- [ ] Firebase 專案已建立
- [ ] config.ts 配置正確
- [ ] 環境變數設定正確

### P3-02：Auth 模組
- [ ] Google OAuth 登入正常
- [ ] 登出正常
- [ ] useAuthStore 狀態正確
- [ ] 用戶資訊顯示正確

### P3-03：Firestore 模板 CRUD
- [ ] 模板可儲存
- [ ] 模板可讀取
- [ ] 模板可更新
- [ ] 模板可刪除
- [ ] 安全規則：用戶只能存取自己的模板

### P3-04：Storage 素材上傳
- [ ] 圖片可上傳到 Storage
- [ ] 上傳後返回 URL
- [ ] 圖片可刪除

### P3-05：Dashboard 頁面
- [ ] 模板列表顯示
- [ ] 新建模板按鈕
- [ ] 最近編輯顯示
- [ ] 開啟/刪除操作正常

### P3-06：訪客模式處理
- [ ] 訪客可使用 Default 模板
- [ ] 訪客可調整參數
- [ ] 訪客無法儲存
- [ ] 訪客無法匯出規格書
- [ ] 登入提示顯示

---

## Phase 4：進階功能

### P4-01：Simulation 堆疊/比較模式
- [ ] 堆疊模式正確累加結果
- [ ] 比較模式並排顯示
- [ ] 模式切換正常
- [ ] 清除累計功能正常

### P4-02：數值驗證工具
- [ ] 賠率分佈圖顯示
- [ ] 實際 vs 理論對比
- [ ] 矛盾警示功能
- [ ] 警示等級區分（Error/Warning/Info）

### P4-03：深色模式
- [ ] 深色模式可切換
- [ ] 所有元件顏色正確
- [ ] 偏好設定可儲存

### P4-04：最終整合測試
- [ ] 完整流程測試通過
- [ ] 所有功能正常運作
- [ ] 無 console 錯誤
- [ ] 效能正常

---

## 通用檢查（每個 Phase 結束時）

- [ ] 只修改了指定範圍的檔案
- [ ] diff 最小化
- [ ] 無新增 `any` 型別
- [ ] 無新增 TODO hack
- [ ] `npm run build` 成功
- [ ] Wild 邏輯只在 settlement.ts
- [ ] Free Spin 狀態只在 useFreeSpinStore.ts
- [ ] NG/FG Pool 分離正確
- [ ] 雙層機率模型分離正確
