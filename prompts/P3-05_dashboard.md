# P3-05 Dashboard 頁面

## 目標 (Objective)

實作用戶 Dashboard 頁面，包括：
- 模板列表顯示
- 新建模板按鈕
- 最近編輯顯示
- 開啟/刪除操作
- 用戶帳號資訊

---

## 範圍 (Scope)

需要新增的檔案：
- `src/pages/Dashboard.tsx`
- `src/App.tsx` 路由修改（如需要）

依賴：
- P3-02（Auth 模組）
- P3-03（Firestore CRUD）

---

## 實作細節 (Implementation Details)

### Dashboard.tsx

```tsx
// src/pages/Dashboard.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useGameConfigStore } from '../store/useGameConfigStore';
import type { Template } from '../types/template';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, status, signIn, signOut } = useAuthStore();
  const { 
    templates, 
    isLoading, 
    error, 
    loadTemplates, 
    deleteTemplate,
    setCurrentTemplateId,
  } = useTemplateStore();
  const { loadFromTemplate, resetToDefault } = useGameConfigStore();

  // 載入模板
  useEffect(() => {
    if (status === 'authenticated') {
      loadTemplates();
    }
  }, [status, loadTemplates]);

  // 開啟模板
  const handleOpenTemplate = (template: Template) => {
    loadFromTemplate(template.config);
    setCurrentTemplateId(template.id);
    navigate('/editor');
  };

  // 新建模板
  const handleNewTemplate = () => {
    resetToDefault();
    setCurrentTemplateId(null);
    navigate('/editor');
  };

  // 刪除模板
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
      await deleteTemplate(id);
    }
  };

  // 未登入狀態
  if (status === 'guest') {
    return (
      <div className="dashboard guest">
        <div className="guest-welcome">
          <h1>🎰 slot-ide</h1>
          <p>Slot 遊戲數學模型設計工具</p>
          <button onClick={signIn} className="sign-in-btn">
            🔑 使用 Google 帳號登入
          </button>
          <p className="guest-hint">
            或 <a href="/editor">以訪客身份體驗</a>（無法儲存）
          </p>
        </div>
      </div>
    );
  }

  // 載入中
  if (status === 'loading' || isLoading) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  // 已登入狀態
  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🎰 slot-ide</h1>
        <div className="user-info">
          <img src={user?.photoURL || ''} alt="avatar" className="avatar" />
          <span>{user?.displayName}</span>
          <button onClick={signOut}>登出</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Quick Actions */}
        <section className="quick-actions">
          <button onClick={handleNewTemplate} className="new-template-btn">
            ➕ 新建模板
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Recent Templates */}
        <section className="recent-section">
          <h2>最近編輯</h2>
          {templates.length === 0 ? (
            <div className="empty-state">
              <p>尚無模板</p>
              <p>點擊上方按鈕建立第一個模板</p>
            </div>
          ) : (
            <div className="template-grid">
              {templates.slice(0, 4).map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onOpen={() => handleOpenTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id, template.name)}
                />
              ))}
            </div>
          )}
        </section>

        {/* All Templates */}
        {templates.length > 4 && (
          <section className="all-templates-section">
            <h2>所有模板 ({templates.length})</h2>
            <div className="template-list">
              {templates.map((template) => (
                <TemplateListItem
                  key={template.id}
                  template={template}
                  onOpen={() => handleOpenTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id, template.name)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/**
 * 模板卡片元件
 */
interface TemplateCardProps {
  template: Template;
  onOpen: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onOpen, onDelete }: TemplateCardProps) {
  return (
    <div className="template-card">
      <div className="card-thumbnail">
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} />
        ) : (
          <div className="placeholder">🎰</div>
        )}
      </div>
      <div className="card-content">
        <h3>{template.name}</h3>
        <p className="card-date">
          更新於 {template.updatedAt.toLocaleDateString()}
        </p>
      </div>
      <div className="card-actions">
        <button onClick={onOpen}>開啟</button>
        <button onClick={onDelete} className="delete">刪除</button>
      </div>
    </div>
  );
}

/**
 * 模板列表項目元件
 */
interface TemplateListItemProps {
  template: Template;
  onOpen: () => void;
  onDelete: () => void;
}

function TemplateListItem({ template, onOpen, onDelete }: TemplateListItemProps) {
  return (
    <div className="template-list-item">
      <span className="item-name">{template.name}</span>
      <span className="item-date">
        {template.updatedAt.toLocaleDateString()}
      </span>
      <div className="item-actions">
        <button onClick={onOpen}>開啟</button>
        <button onClick={onDelete} className="delete">刪除</button>
      </div>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 未登入時顯示歡迎頁面
- [ ] 登入後顯示模板列表
- [ ] 新建模板按鈕可用
- [ ] 最近編輯正確顯示
- [ ] 開啟模板功能正常
- [ ] 刪除模板功能正常（含確認對話框）
- [ ] 用戶帳號資訊正確顯示
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/pages/Dashboard.tsx` 完整程式碼
2. CSS 樣式
3. Dashboard 頁面截圖

