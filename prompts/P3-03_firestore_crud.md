# P3-03 Firestore 模板 CRUD

## 目標 (Objective)

實作 Firestore 模板 CRUD 功能，包括：
- 建立模板
- 讀取模板列表
- 讀取單一模板
- 更新模板
- 刪除模板
- useTemplateStore 狀態管理

---

## 範圍 (Scope)

需要新增的檔案：
- `src/firebase/firestore.ts`
- `src/store/useTemplateStore.ts`
- `src/types/template.ts`

依賴：
- P3-01（Firebase 專案設定）
- P3-02（Auth 模組）

---

## 實作細節 (Implementation Details)

### template.ts 型別定義

```typescript
// src/types/template.ts

import type { SymbolDefinition } from './symbol';
import type { OutcomeConfig } from './outcome';
import type { LinesConfig } from './lines';
import type { VisualConfig, AssetsPatch } from './visual';
import type { BoardConfig } from './board';
import type { FreeSpinConfig } from './free-spin';

export interface Template {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  config: {
    gameName: string;
    baseBet: number;
    boardConfig: BoardConfig;
    symbols: SymbolDefinition[];
    outcomeConfig: OutcomeConfig;
    linesConfig: LinesConfig;
    visualConfig: VisualConfig;
    freeSpinConfig: FreeSpinConfig;
    assets: AssetsPatch;
  };
}

export type TemplateInput = Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
```

### firestore.ts

```typescript
// src/firebase/firestore.ts

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { Template, TemplateInput } from '../types/template';

const TEMPLATES_COLLECTION = 'templates';

/**
 * 轉換 Firestore 文檔為 Template
 */
function docToTemplate(doc: any): Template {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  };
}

/**
 * 建立模板
 */
export async function createTemplate(
  userId: string, 
  input: TemplateInput
): Promise<Template> {
  const docRef = await addDoc(collection(db, TEMPLATES_COLLECTION), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  const newDoc = await getDoc(docRef);
  return docToTemplate(newDoc);
}

/**
 * 讀取用戶的所有模板
 */
export async function getTemplatesByUser(userId: string): Promise<Template[]> {
  const q = query(
    collection(db, TEMPLATES_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTemplate);
}

/**
 * 讀取單一模板
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
  const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return docToTemplate(snapshot);
}

/**
 * 更新模板
 */
export async function updateTemplate(
  templateId: string, 
  input: Partial<TemplateInput>
): Promise<void> {
  const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

/**
 * 刪除模板
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const docRef = doc(db, TEMPLATES_COLLECTION, templateId);
  await deleteDoc(docRef);
}
```

### useTemplateStore.ts

```typescript
// src/store/useTemplateStore.ts

import { create } from 'zustand';
import type { Template, TemplateInput } from '../types/template';
import * as firestore from '../firebase/firestore';
import { useAuthStore } from './useAuthStore';

interface TemplateState {
  templates: Template[];
  currentTemplateId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface TemplateActions {
  loadTemplates: () => Promise<void>;
  loadTemplate: (id: string) => Promise<Template | null>;
  saveTemplate: (input: TemplateInput) => Promise<Template | null>;
  updateTemplate: (id: string, input: Partial<TemplateInput>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  setCurrentTemplateId: (id: string | null) => void;
  clearError: () => void;
}

const initialState: TemplateState = {
  templates: [],
  currentTemplateId: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useTemplateStore = create<TemplateState & TemplateActions>()(
  (set, get) => ({
    ...initialState,

    loadTemplates: async () => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: '請先登入' });
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        const templates = await firestore.getTemplatesByUser(user.uid);
        set({ templates, isLoading: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : '載入失敗';
        set({ error: message, isLoading: false });
      }
    },

    loadTemplate: async (id) => {
      set({ isLoading: true, error: null });
      
      try {
        const template = await firestore.getTemplateById(id);
        set({ isLoading: false, currentTemplateId: id });
        return template;
      } catch (error) {
        const message = error instanceof Error ? error.message : '載入失敗';
        set({ error: message, isLoading: false });
        return null;
      }
    },

    saveTemplate: async (input) => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: '請先登入' });
        return null;
      }

      set({ isSaving: true, error: null });
      
      try {
        const template = await firestore.createTemplate(user.uid, input);
        set((state) => ({
          templates: [template, ...state.templates],
          isSaving: false,
          currentTemplateId: template.id,
        }));
        return template;
      } catch (error) {
        const message = error instanceof Error ? error.message : '儲存失敗';
        set({ error: message, isSaving: false });
        return null;
      }
    },

    updateTemplate: async (id, input) => {
      set({ isSaving: true, error: null });
      
      try {
        await firestore.updateTemplate(id, input);
        
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id 
              ? { ...t, ...input, updatedAt: new Date() } 
              : t
          ),
          isSaving: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新失敗';
        set({ error: message, isSaving: false });
      }
    },

    deleteTemplate: async (id) => {
      set({ isLoading: true, error: null });
      
      try {
        await firestore.deleteTemplate(id);
        
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
          currentTemplateId: state.currentTemplateId === id ? null : state.currentTemplateId,
          isLoading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '刪除失敗';
        set({ error: message, isLoading: false });
      }
    },

    setCurrentTemplateId: (id) => set({ currentTemplateId: id }),
    clearError: () => set({ error: null }),
  })
);
```

---

## 驗收條件 (Acceptance Criteria)

- [ ] 模板可成功建立到 Firestore
- [ ] 模板列表可正確讀取
- [ ] 單一模板可正確讀取
- [ ] 模板可正確更新
- [ ] 模板可正確刪除
- [ ] 安全規則：用戶只能存取自己的模板
- [ ] 錯誤處理正確
- [ ] `npm run build` 成功

---

## 輸出格式 (Output Format)

完成後提供：
1. `src/types/template.ts` 完整程式碼
2. `src/firebase/firestore.ts` 完整程式碼
3. `src/store/useTemplateStore.ts` 完整程式碼
4. CRUD 功能測試截圖

