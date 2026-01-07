# P3-01 Firebase 專案設定

## 目標 (Objective)

設定 Firebase 專案，包括：
- Firebase 專案建立與配置
- 安裝必要套件
- 配置檔案設定
- 環境變數設定

---

## 範圍 (Scope)

需要新增的檔案：
- `src/firebase/config.ts`
- `.env.local`（範本）

需要修改的檔案：
- `package.json`
- `.gitignore`

---

## 實作細節 (Implementation Details)

### 1. 安裝 Firebase

```bash
npm install firebase
```

### 2. Firebase Console 設定步驟

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 建立新專案（或使用現有專案）
3. 啟用以下服務：
   - Authentication（Google 登入）
   - Cloud Firestore
   - Cloud Storage
4. 在專案設定中取得 Web 應用程式配置

### 3. config.ts 設定

```typescript
// src/firebase/config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出服務實例
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
```

### 4. 環境變數範本

```env
# .env.local.example

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 5. 更新 .gitignore

```
# Environment variables
.env
.env.local
.env.*.local
```

### 6. Firestore 安全規則（初始）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能存取自己的模板
    match /templates/{templateId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null 
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 7. Storage 安全規則（初始）

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 用戶只能存取自己的素材
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
  }
}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] Firebase 套件已安裝
- [ ] `src/firebase/config.ts` 正確匯出 auth, db, storage
- [ ] 環境變數範本已建立
- [ ] `.gitignore` 已更新排除 `.env.local`
- [ ] `npm run build` 成功
- [ ] 可在開發環境連接 Firebase

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/firebase/config.ts` 完整程式碼
2. `.env.local.example` 內容
3. Firestore 和 Storage 安全規則
4. 設定驗證截圖

