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
 * 儲存素材（部分更新）
 */
export function saveAssets(assets: Partial<StoredAssets>): void {
  const existing = loadAssets();
  const merged: StoredAssets = {
    symbols: { ...existing?.symbols, ...assets.symbols },
    board: assets.board !== undefined ? assets.board : existing?.board,
    frame: assets.frame !== undefined ? assets.frame : existing?.frame,
    background: assets.background !== undefined ? assets.background : existing?.background,
    character: assets.character !== undefined ? assets.character : existing?.character,
    updatedAt: Date.now(),
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
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
  const existing = loadAssets();
  const symbols = { ...existing?.symbols };
  symbols[symbolId] = dataUrl;
  saveAssets({ symbols });
}

/**
 * 移除 Symbol 圖片
 */
export function removeSymbolImage(symbolId: SymbolId): void {
  const existing = loadAssets();
  if (!existing) {
    return;
  }
  const symbols = { ...existing.symbols };
  delete symbols[symbolId];
  saveAssets({ symbols });
}

/**
 * 取得 Symbol 圖片
 */
export function getSymbolImage(symbolId: SymbolId): string | null {
  const assets = loadAssets();
  if (!assets) {
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
  saveAssets({ [key]: dataUrl });
}

/**
 * 移除其他素材
 */
export function removeOtherAsset(
  key: 'board' | 'frame' | 'background' | 'character'
): void {
  saveAssets({ [key]: undefined });
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

    // 檢查檔案大小（建議 < 500KB）
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      reject(new Error(`File size exceeds ${maxSize / 1024}KB limit`));
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

