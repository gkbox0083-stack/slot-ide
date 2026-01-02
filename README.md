# slot-ide

單頁 Slot IDE — 設計、模擬、驗證你的老虎機數學模型

---

## 功能

- 🎰 設定老虎機數學（Outcome、倍率、權重）
- 🏊 Pool-based 盤池生成
- 🎬 內建動畫 Runtime
- 📊 Simulation 統計分析
- 📁 CSV 匯出

---

## 快速開始

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

---

## 專案結構

```
src/
├── types/      # 型別定義
├── engine/     # 數學引擎
├── runtime/    # 動畫渲染器
├── ide/        # IDE 介面
├── analytics/  # 統計分析
├── store/      # 狀態管理
└── utils/      # 工具函式
```

---

## 開發文件

- [AI_GUIDE.md](./AI_GUIDE.md) — AI 協作指南
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) — 開發規範
- [README_ARCHITECTURE.md](./README_ARCHITECTURE.md) — 架構規格
- [PHASES.md](./PHASES.md) — 開發階段
- [CURSOR_PROMPTS.md](./CURSOR_PROMPTS.md) — Cursor prompt 範本

---

## 技術棧

- Vite
- React
- TypeScript

---

## License

MIT
