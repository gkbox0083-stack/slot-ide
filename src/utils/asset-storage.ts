import type { SymbolId } from '../types/board.js';

/**
 * localStorage 儲存鍵名
 */
const STORAGE_KEY = 'slot-ide-assets';

/**
 * 儲存的素材資料結構
 */
export interface StoredAssets {
  symbols: Record<string, string>;  // symbolId -> base64 data URL
  board?: string;
  frame?: string;
  background?: string;
  character?: string;
  updatedAt: number;
}

/**
 * 內部 helper: 讀取完整資料，若無則回詳細預設值
 */
function getStoredAssetsOrEmpty(): StoredAssets {
  const existing = loadAssets();
  return existing || {
    symbols: {},
    updatedAt: Date.now()
  };
}

/**
 * 內部 helper: 將完整資料寫入 storage
 */
function saveStoredAssets(data: StoredAssets): void {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save assets to localStorage:', error);
    throw error;
  }
}

/**
 * 讀取所有素材
 */
export function loadAssets(): StoredAssets | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as StoredAssets;

    // 確保 symbols 物件存在
    if (!parsed.symbols) {
      parsed.symbols = {};
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load assets from localStorage:', error);
    return null;
  }
}

/**
 * 清除所有素材
 */
export function clearAssets(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear assets from localStorage:', error);
    throw error;
  }
}

/**
 * 儲存 Symbol 圖片
 */
export function saveSymbolImage(symbolId: SymbolId, dataUrl: string): void {
  const data = getStoredAssetsOrEmpty();
  data.symbols[symbolId] = dataUrl;
  saveStoredAssets(data);
}

/**
 * 移除 Symbol 圖片
 */
export function removeSymbolImage(symbolId: SymbolId): void {
  const data = getStoredAssetsOrEmpty();
  if (data.symbols && data.symbols[symbolId]) {
    delete data.symbols[symbolId];
    saveStoredAssets(data);
  }
}

/**
 * 取得 Symbol 圖片 (helper)
 */
export function getSymbolImage(symbolId: SymbolId): string | null {
  const assets = loadAssets();
  if (!assets || !assets.symbols) {
    return null;
  }
  return assets.symbols[symbolId] || null;
}

/**
 * 儲存其他素材（board, frame, background, character）
 */
export function saveOtherAsset(
  key: 'board' | 'frame' | 'background' | 'character',
  dataUrl: string
): void {
  const data = getStoredAssetsOrEmpty();
  data[key] = dataUrl;
  saveStoredAssets(data);
}

/**
 * 移除其他素材
 */
export function removeOtherAsset(
  key: 'board' | 'frame' | 'background' | 'character'
): void {
  const data = getStoredAssetsOrEmpty();
  if (data[key] !== undefined) {
    delete data[key];
    saveStoredAssets(data);
  }
}

/**
 * 將 File 轉換為 base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // 檢查檔案大小（建議 < 2MB，放寬限制以免太容易失敗）
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      reject(new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

