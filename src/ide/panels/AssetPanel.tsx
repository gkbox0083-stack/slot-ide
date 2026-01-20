import { useEffect, useRef, useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import { useAuthStore } from '../../store/useAuthStore';
import type { SymbolId } from '../../types/board.js';
import { fileToDataUrl, saveSymbolImage, removeSymbolImage, saveOtherAsset, removeOtherAsset, clearAssets, loadAssets } from '../../utils/index.js';
import { uploadImage } from '../../firebase/storage';

/**
 * AssetPanel 素材上傳面板
 */
export function AssetPanel() {
  const {
    assets,
    setAssets,
    setSymbolImage,
    removeSymbolImage: removeSymbolImageFromStore,
    setOtherAsset,
    removeOtherAsset: removeOtherAssetFromStore,
    clearAllAssets,
    symbols
  } = useGameConfigStore();
  const { user } = useAuthStore();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // 頁面載入時從 localStorage 讀取素材
  useEffect(() => {
    try {
      const stored = loadAssets();
      console.log('[AssetPanel] Loaded assets from storage:', stored);
      if (stored) {
        setAssets({
          symbols: stored.symbols || {},
          board: stored.board,
          frame: stored.frame,
          background: stored.background,
          character: stored.character,
        });
      }
    } catch (e) {
      console.error('[AssetPanel] Error loading assets:', e);
    }
  }, [setAssets]);

  // 處理 Symbol 圖片上傳
  const handleSymbolUpload = async (symbolId: SymbolId, file: File | null) => {
    if (!file) return;

    try {
      // 如果用戶已登入，上傳到 Firebase Storage
      if (user) {
        const url = await uploadImage(
          user.uid,
          file,
          (progress) => {
            setUploadProgress(progress.progress);
          }
        );
        saveSymbolImage(symbolId, url);
        setSymbolImage(symbolId, url);
        setUploadProgress(null);
      } else {
        // 訪客模式：使用 Data URL（localStorage）
        const dataUrl = await fileToDataUrl(file);
        saveSymbolImage(symbolId, dataUrl);
        setSymbolImage(symbolId, dataUrl);
      }
    } catch (error) {
      console.error('上傳失敗:', error);
      setUploadProgress(null);
      alert(`上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 處理 Symbol 圖片清除
  const handleSymbolRemove = (symbolId: SymbolId) => {
    if (confirm(`確定要清除 ${symbolId} 的圖片嗎？`)) {
      console.log(`[AssetPanel] Removing symbol image: ${symbolId}`);
      try {
        removeSymbolImage(symbolId);
        removeSymbolImageFromStore(symbolId);
      } catch (e) {
        console.error('[AssetPanel] Error removing symbol image:', e);
      }
    }
  };

  // 處理其他素材上傳
  const handleOtherAssetUpload = async (
    key: 'board' | 'frame' | 'background' | 'character',
    file: File | null
  ) => {
    if (!file) return;

    try {
      // 如果用戶已登入，上傳到 Firebase Storage
      if (user) {
        const url = await uploadImage(
          user.uid,
          file,
          (progress) => {
            setUploadProgress(progress.progress);
          }
        );
        saveOtherAsset(key, url);
        setOtherAsset(key, url);
        setUploadProgress(null);
      } else {
        // 訪客模式：使用 Data URL（localStorage）
        const dataUrl = await fileToDataUrl(file);
        saveOtherAsset(key, dataUrl);
        setOtherAsset(key, dataUrl);
      }
    } catch (error) {
      console.error('上傳失敗:', error);
      setUploadProgress(null);
      alert(`上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 處理其他素材清除
  const handleOtherAssetRemove = (key: 'board' | 'frame' | 'background' | 'character') => {
    const keyNames: Record<string, string> = {
      board: '盤面底圖',
      frame: '盤面框',
      background: '背景',
      character: '人物',
    };
    if (confirm(`確定要清除 ${keyNames[key]} 嗎？`)) {
      console.log(`[AssetPanel] Removing other asset: ${key}`);
      try {
        removeOtherAsset(key);
        removeOtherAssetFromStore(key);
      } catch (e) {
        console.error('[AssetPanel] Error removing other asset:', e);
      }
    }
  };

  // 清除所有素材
  const handleClearAll = () => {
    if (confirm('確定要清除所有素材嗎？此操作無法復原。')) {
      console.log('[AssetPanel] Clearing all assets');
      try {
        clearAssets();
        clearAllAssets();
      } catch (e) {
        console.error('[AssetPanel] Error clearing all assets:', e);
      }
    }
  };

  // 取得 Symbol 圖片 URL
  const getSymbolImageUrl = (symbolId: SymbolId): string | null => {
    return assets.symbols?.[symbolId] || null;
  };

  // 取得其他素材 URL
  const getOtherAssetUrl = (key: 'board' | 'frame' | 'background' | 'character'): string | null => {
    return assets[key] || null;
  };

  // 其他素材配置
  const otherAssets: Array<{
    key: 'board' | 'frame' | 'background' | 'character';
    label: string;
    description: string;
  }> = [
      { key: 'board', label: '盤面底圖', description: '顯示在卷軸下方的底圖' },
      { key: 'frame', label: '盤面框', description: '覆蓋在卷軸邊緣的框架' },
      { key: 'background', label: '背景', description: '整個容器的背景圖' },
      { key: 'character', label: '人物', description: '顯示在右側的人物圖' },
    ];

  return (
    <div className="p-0">
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-base font-bold flex items-center gap-2 text-surface-100">
          🎨 素材管理
        </h3>
        <button
          onClick={handleClearAll}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      {/* 上傳進度顯示 */}
      {uploadProgress !== null && (
        <div className="mb-4 p-3 bg-surface-800 border border-surface-700 rounded">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-surface-700 rounded overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-surface-300 font-medium min-w-[3rem] text-right">
              {Math.round(uploadProgress)}%
            </span>
          </div>
        </div>
      )}

      {/* Symbol 圖片上傳區 */}
      <div className="mb-6 p-4 bg-surface-900 border border-surface-700 rounded shadow-sm">
        <h4 className="mt-0 mb-4 text-sm font-bold text-surface-200 uppercase tracking-wider">
          Symbol 圖片
        </h4>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {symbols.map((symbol) => {
            const symbolId = symbol.id;
            const imageUrl = getSymbolImageUrl(symbolId);
            return (
              <div
                key={symbolId}
                className="p-3 bg-surface-800 border border-surface-700 rounded flex flex-col gap-2"
              >
                <div className="text-xs font-bold text-center text-surface-300">
                  {symbolId} ({symbol.name})
                </div>
                {imageUrl ? (
                  <div className="w-full h-24 bg-surface-950 border border-surface-800 rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={symbolId}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-24 bg-surface-700 border border-surface-600 rounded flex items-center justify-center text-xs text-surface-400">
                    未上傳
                  </div>
                )}
                <div className="flex gap-1">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[`symbol_${symbolId}`] = el;
                    }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleSymbolUpload(symbolId, file);
                      // 重置 input
                      if (e.target) {
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      fileInputRefs.current[`symbol_${symbolId}`]?.click();
                    }}
                    className="flex-1 py-1.5 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded transition-colors"
                  >
                    {imageUrl ? '更換' : '上傳'}
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => handleSymbolRemove(symbolId)}
                      className="flex-1 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 其他素材上傳區 */}
      <div className="mb-6 p-4 bg-surface-900 border border-surface-700 rounded shadow-sm">
        <h4 className="mt-0 mb-4 text-sm font-bold text-surface-200 uppercase tracking-wider">
          其他素材
        </h4>
        <div className="flex flex-col gap-3">
          {otherAssets.map(({ key, label, description }) => {
            const imageUrl = getOtherAssetUrl(key);
            return (
              <div
                key={key}
                className="p-3 bg-surface-800 border border-surface-700 rounded flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-surface-200">
                      {label}
                    </div>
                    <div className="text-xs text-surface-400 mt-0.5">
                      {description}
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${imageUrl ? 'text-green-400' : 'text-surface-500'}`}>
                    {imageUrl ? '✓ 已上傳' : '未上傳'}
                  </div>
                </div>
                {imageUrl && (
                  <div className="w-full max-h-[150px] bg-surface-950 border border-surface-800 rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={label}
                      className="max-w-full max-h-[150px] object-contain"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[`other_${key}`] = el;
                    }}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleOtherAssetUpload(key, file);
                      // 重置 input
                      if (e.target) {
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      fileInputRefs.current[`other_${key}`]?.click();
                    }}
                    className="flex-1 py-2 text-xs bg-primary-600 hover:bg-primary-500 text-white rounded transition-colors"
                  >
                    {imageUrl ? '更換' : '上傳'}
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => handleOtherAssetRemove(key)}
                      className="flex-1 py-2 text-xs bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

