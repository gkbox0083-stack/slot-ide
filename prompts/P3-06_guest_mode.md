# P3-06 訪客模式處理

## 目標 (Objective)

實作訪客模式處理，包括：
- 訪客可使用預設模板
- 訪客可調整參數
- 訪客無法儲存
- 訪客無法匯出規格書
- 登入提示顯示

---

## 範圍 (Scope)

需要修改的檔案：
- `src/ide/layout/IDELayout.tsx`
- `src/ide/panels/` 相關面板（需檢查儲存功能）
- `src/components/GuestBanner.tsx`（新增）

依賴：
- P3-02（Auth 模組）

---

## 實作細節 (Implementation Details)

### GuestBanner.tsx

```tsx
// src/components/GuestBanner.tsx

import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function GuestBanner() {
  const { status, signIn } = useAuthStore();

  if (status !== 'guest') return null;

  return (
    <div className="guest-banner">
      <span className="banner-text">
        👋 你正在以訪客身份使用。
        登入後可儲存模板和匯出規格書。
      </span>
      <button onClick={signIn} className="banner-btn">
        🔑 登入
      </button>
    </div>
  );
}
```

### IDELayout.tsx 修改

```tsx
// src/ide/layout/IDELayout.tsx (修改片段)

import { GuestBanner } from '../../components/GuestBanner';

export function IDELayout() {
  return (
    <div className="ide-layout">
      {/* Guest Banner */}
      <GuestBanner />
      
      {/* Header */}
      <header className="ide-header">
        {/* ... */}
      </header>
      
      {/* ... 其他內容 */}
    </div>
  );
}
```

### 儲存按鈕保護

```tsx
// 通用的儲存按鈕元件

import { useAuthStore } from '../store/useAuthStore';

interface SaveButtonProps {
  onSave: () => void;
  children: React.ReactNode;
}

export function SaveButton({ onSave, children }: SaveButtonProps) {
  const { status, signIn } = useAuthStore();
  const isGuest = status === 'guest';

  const handleClick = () => {
    if (isGuest) {
      if (confirm('儲存功能需要登入。是否現在登入？')) {
        signIn();
      }
    } else {
      onSave();
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={isGuest ? 'disabled-for-guest' : ''}
      title={isGuest ? '登入後可使用此功能' : ''}
    >
      {children}
      {isGuest && <span className="lock-icon">🔒</span>}
    </button>
  );
}
```

### 匯出功能保護

```tsx
// src/analytics/csv-export.ts (修改片段)

export function exportToCSV(
  results: SimulationResult[],
  isAuthenticated: boolean
): boolean {
  if (!isAuthenticated) {
    alert('匯出功能需要登入');
    return false;
  }
  
  // ... 原本的匯出邏輯
  return true;
}
```

### useGuestMode Hook

```tsx
// src/hooks/useGuestMode.ts

import { useAuthStore } from '../store/useAuthStore';

export function useGuestMode() {
  const { status, signIn } = useAuthStore();
  const isGuest = status === 'guest';

  const requireAuth = (action: string, callback: () => void) => {
    if (isGuest) {
      if (confirm(`${action}需要登入。是否現在登入？`)) {
        signIn();
      }
      return false;
    }
    callback();
    return true;
  };

  return {
    isGuest,
    requireAuth,
  };
}
```

### CSS 樣式

```css
.guest-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  color: #fff;
  font-size: 0.875rem;
}

.banner-btn {
  padding: 0.25rem 0.75rem;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.disabled-for-guest {
  opacity: 0.7;
  cursor: not-allowed;
}

.lock-icon {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 訪客可正常使用 IDE 功能
- [ ] 訪客可調整參數並看到結果
- [ ] 訪客點擊儲存時顯示登入提示
- [ ] 訪客點擊匯出時顯示登入提示
- [ ] Guest Banner 正確顯示
- [ ] 登入後 Banner 消失
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/components/GuestBanner.tsx` 完整程式碼
2. `src/hooks/useGuestMode.ts` 完整程式碼
3. 相關修改片段
4. 訪客模式測試截圖

