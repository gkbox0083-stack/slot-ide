# P4-03 深色模式

## 目標 (Objective)

實作深色模式切換功能，包括：
- 深色/淺色模式切換
- 偏好設定儲存
- 系統偏好跟隨
- CSS 變數切換

---

## 範圍 (Scope)

需要修改的檔案：
- `src/store/useUIStore.ts`
- `src/index.css`
- `src/App.tsx`

需要新增的檔案：
- `src/components/ThemeToggle.tsx`

---

## 實作細節 (Implementation Details)

### useUIStore.ts 擴展

```typescript
// src/store/useUIStore.ts (擴展)

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // ... 現有欄位
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

interface UIActions {
  // ... 現有欄位
  setTheme: (theme: Theme) => void;
}

// 實作
setTheme: (theme) => {
  let resolved: 'light' | 'dark' = 'dark';
  
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  } else {
    resolved = theme;
  }
  
  // 更新 DOM
  document.documentElement.setAttribute('data-theme', resolved);
  
  // 儲存偏好
  localStorage.setItem('theme-preference', theme);
  
  set({ theme, resolvedTheme: resolved });
},
```

### index.css CSS 變數

```css
/* src/index.css */

:root {
  /* 淺色模式（預設） */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --text-primary: #1a1a2e;
  --text-secondary: #666666;
  --text-muted: #999999;
  --border-color: #e0e0e0;
  --accent-color: #6366f1;
  --accent-hover: #4f46e5;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  /* 深色模式 */
  --bg-primary: #0f0f1a;
  --bg-secondary: #16162a;
  --bg-tertiary: #1a1a2e;
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-muted: #666666;
  --border-color: #333333;
  --accent-color: #6366f1;
  --accent-hover: #818cf8;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 套用變數 */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.ide-layout {
  background-color: var(--bg-primary);
}

.ide-header {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
}

.ide-control-panel,
.ide-game-control {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

/* ... 其他元件樣式 */
```

### ThemeToggle.tsx

```tsx
// src/components/ThemeToggle.tsx

import React from 'react';
import { useUIStore } from '../store/useUIStore';

export function ThemeToggle() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="theme-toggle">
      <button
        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title="淺色模式"
      >
        ☀️
      </button>
      <button
        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title="深色模式"
      >
        🌙
      </button>
      <button
        className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
        onClick={() => setTheme('system')}
        title="跟隨系統"
      >
        💻
      </button>
    </div>
  );
}
```

### App.tsx 初始化

```tsx
// src/App.tsx (修改片段)

import { useEffect } from 'react';
import { useUIStore } from './store/useUIStore';

function App() {
  const setTheme = useUIStore((state) => state.setTheme);

  useEffect(() => {
    // 載入儲存的偏好
    const savedTheme = localStorage.getItem('theme-preference') as Theme | null;
    setTheme(savedTheme || 'dark');
    
    // 監聽系統偏好變化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = useUIStore.getState().theme;
      if (currentTheme === 'system') {
        setTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setTheme]);

  // ...
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 深色模式正確顯示
- [ ] 淺色模式正確顯示
- [ ] 系統偏好跟隨正常
- [ ] 偏好設定可儲存
- [ ] 所有元件顏色正確切換
- [ ] 切換動畫平滑
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. CSS 變數定義
2. `src/components/ThemeToggle.tsx` 完整程式碼
3. Store 修改
4. 深色/淺色模式截圖

