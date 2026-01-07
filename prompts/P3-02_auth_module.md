# P3-02 Auth 模組（Google OAuth）

## 目標 (Objective)

實作 Firebase Authentication 模組，包括：
- Google OAuth 登入
- 登出功能
- Auth 狀態管理（useAuthStore）
- Auth 狀態監聽

---

## 範圍 (Scope)

需要新增的檔案：
- `src/firebase/auth.ts`
- `src/store/useAuthStore.ts`

依賴：
- P3-01（Firebase 專案設定）

---

## 實作細節 (Implementation Details)

### auth.ts

```typescript
// src/firebase/auth.ts

import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Google 登入
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * 登出
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * 監聽 Auth 狀態變化
 */
export function subscribeToAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * 取得目前用戶
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
```

### useAuthStore.ts

```typescript
// src/store/useAuthStore.ts

import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signInWithGoogle, signOut, subscribeToAuthState } from '../firebase/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

interface AuthActions {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  initialize: () => () => void;
}

const initialState: AuthState = {
  user: null,
  status: 'loading',
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  ...initialState,

  signIn: async () => {
    set({ error: null });
    try {
      const user = await signInWithGoogle();
      set({ user, status: 'authenticated' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '登入失敗';
      set({ error: message, status: 'guest' });
    }
  },

  signOut: async () => {
    try {
      await signOut();
      set({ user: null, status: 'guest' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '登出失敗';
      set({ error: message });
    }
  },

  setUser: (user) => set({ user }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),

  initialize: () => {
    // 監聽 Auth 狀態
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        set({ user, status: 'authenticated', error: null });
      } else {
        set({ user: null, status: 'guest', error: null });
      }
    });

    return unsubscribe;
  },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.status === 'authenticated';
export const selectIsGuest = (state: AuthState) => state.status === 'guest';
export const selectIsLoading = (state: AuthState) => state.status === 'loading';
```

### 在 App.tsx 中初始化

```tsx
// src/App.tsx

import { useEffect } from 'react';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  // ... 其他內容
}
```

### Header 用戶區域元件

```tsx
// src/components/UserArea.tsx

import { useAuthStore } from '../store/useAuthStore';

export function UserArea() {
  const { user, status, signIn, signOut } = useAuthStore();

  if (status === 'loading') {
    return <div className="user-area">載入中...</div>;
  }

  if (status === 'guest') {
    return (
      <div className="user-area">
        <button onClick={signIn} className="sign-in-btn">
          🔑 Google 登入
        </button>
      </div>
    );
  }

  return (
    <div className="user-area">
      <img 
        src={user?.photoURL || ''} 
        alt="avatar" 
        className="user-avatar" 
      />
      <span className="user-name">{user?.displayName}</span>
      <button onClick={signOut} className="sign-out-btn">
        登出
      </button>
    </div>
  );
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] Google 登入功能正常
- [ ] 登出功能正常
- [ ] useAuthStore 狀態正確管理
- [ ] Auth 狀態變化自動更新 UI
- [ ] 用戶頭像和名稱正確顯示
- [ ] 錯誤處理正確
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/firebase/auth.ts` 完整程式碼
2. `src/store/useAuthStore.ts` 完整程式碼
3. UserArea 元件程式碼
4. 登入/登出測試截圖

