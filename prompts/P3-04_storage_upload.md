# P3-04 Storage 素材上傳

## 目標 (Objective)

實作 Firebase Storage 素材上傳功能，包括：
- 圖片上傳
- 上傳進度追蹤
- 取得下載 URL
- 刪除圖片

---

## 範圍 (Scope)

需要新增的檔案：
- `src/firebase/storage.ts`

需要修改的檔案：
- `src/ide/panels/AssetPanel.tsx`

依賴：
- P3-01（Firebase 專案設定）
- P3-02（Auth 模組）

---

## 實作細節 (Implementation Details)

### storage.ts

```typescript
// src/firebase/storage.ts

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

/**
 * 上傳圖片
 */
export async function uploadImage(
  userId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // 生成唯一檔名
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `${timestamp}.${extension}`;
  
  const storageRef = ref(storage, `users/${userId}/assets/${fileName}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          });
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}

/**
 * 刪除圖片
 */
export async function deleteImage(url: string): Promise<void> {
  const storageRef = ref(storage, url);
  await deleteObject(storageRef);
}

/**
 * 列出用戶的所有素材
 */
export async function listUserAssets(userId: string): Promise<string[]> {
  const listRef = ref(storage, `users/${userId}/assets`);
  const result = await listAll(listRef);
  
  const urls = await Promise.all(
    result.items.map((item) => getDownloadURL(item))
  );
  
  return urls;
}
```

### AssetPanel.tsx 修改

```tsx
// src/ide/panels/AssetPanel.tsx (修改片段)

import { uploadImage, deleteImage } from '../../firebase/storage';
import { useAuthStore } from '../../store/useAuthStore';

// 在元件中
const { user, status } = useAuthStore();
const [uploadProgress, setUploadProgress] = useState<number | null>(null);

const handleFileUpload = async (file: File, assetType: string) => {
  if (!user) {
    alert('請先登入才能上傳素材');
    return;
  }
  
  try {
    const url = await uploadImage(
      user.uid,
      file,
      (progress) => {
        setUploadProgress(progress.progress);
      }
    );
    
    // 更新 Assets
    updateAsset(assetType, url);
    setUploadProgress(null);
  } catch (error) {
    console.error('上傳失敗:', error);
    setUploadProgress(null);
  }
};

// 上傳進度顯示
{uploadProgress !== null && (
  <div className="upload-progress">
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <span>{Math.round(uploadProgress)}%</span>
  </div>
)}
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 圖片可成功上傳到 Storage
- [ ] 上傳進度正確顯示
- [ ] 上傳後返回正確的 URL
- [ ] 圖片可正確刪除
- [ ] 安全規則：用戶只能存取自己的素材
- [ ] 未登入時顯示提示
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/firebase/storage.ts` 完整程式碼
2. AssetPanel.tsx 修改片段
3. 上傳功能測試截圖

