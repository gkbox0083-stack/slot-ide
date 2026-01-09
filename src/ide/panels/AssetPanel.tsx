import { useEffect, useRef } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';
import type { SymbolId } from '../../types/board.js';
import { fileToDataUrl, saveSymbolImage, removeSymbolImage, saveOtherAsset, removeOtherAsset, clearAssets, loadAssets } from '../../utils/index.js';

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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 頁面載入時從 localStorage 讀取素材
  useEffect(() => {
    const stored = loadAssets();
    if (stored) {
      setAssets({
        symbols: stored.symbols,
        board: stored.board,
        frame: stored.frame,
        background: stored.background,
        character: stored.character,
      });
    }
  }, [setAssets]);

  // 處理 Symbol 圖片上傳
  const handleSymbolUpload = async (symbolId: SymbolId, file: File | null) => {
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      saveSymbolImage(symbolId, dataUrl);
      setSymbolImage(symbolId, dataUrl);
    } catch (error) {
      alert(`上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 處理 Symbol 圖片清除
  const handleSymbolRemove = (symbolId: SymbolId) => {
    if (confirm(`確定要清除 ${symbolId} 的圖片嗎？`)) {
      removeSymbolImage(symbolId);
      removeSymbolImageFromStore(symbolId);
    }
  };

  // 處理其他素材上傳
  const handleOtherAssetUpload = async (
    key: 'board' | 'frame' | 'background' | 'character',
    file: File | null
  ) => {
    if (!file) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      saveOtherAsset(key, dataUrl);
      setOtherAsset(key, dataUrl);
    } catch (error) {
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
      removeOtherAsset(key);
      removeOtherAssetFromStore(key);
    }
  };

  // 清除所有素材
  const handleClearAll = () => {
    if (confirm('確定要清除所有素材嗎？此操作無法復原。')) {
      clearAssets();
      clearAllAssets();
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
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #ddd',
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        fontSize: '16px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        🎨 素材管理
      </h3>

      {/* Symbol 圖片上傳區 */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}>
        <h4 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          Symbol 圖片
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
        }}>
          {symbols.map((symbol) => {
            const symbolId = symbol.id;
            const imageUrl = getSymbolImageUrl(symbolId);
            return (
              <div
                key={symbolId}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                  {symbolId} ({symbol.name})
                </div>
                {imageUrl ? (
                  <div style={{
                    width: '100%',
                    height: '100px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={imageUrl}
                      alt={symbolId}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100px',
                    backgroundColor: '#e0e0e0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#666',
                  }}>
                    未上傳
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: '4px',
                }}>
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
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {imageUrl ? '更換' : '上傳'}
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => handleSymbolRemove(symbolId)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
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
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}>
        <h4 style={{
          marginTop: 0,
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          其他素材
        </h4>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {otherAssets.map(({ key, label, description }) => {
            const imageUrl = getOtherAssetUrl(key);
            return (
              <div
                key={key}
                style={{
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      marginTop: '2px',
                    }}>
                      {description}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: imageUrl ? '#2ecc71' : '#999',
                    fontWeight: 'bold',
                  }}>
                    {imageUrl ? '✓ 已上傳' : '未上傳'}
                  </div>
                </div>
                {imageUrl && (
                  <div style={{
                    width: '100%',
                    maxHeight: '150px',
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={imageUrl}
                      alt={label}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '150px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                }}>
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
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontSize: '12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {imageUrl ? '更換' : '上傳'}
                  </button>
                  {imageUrl && (
                    <button
                      onClick={() => handleOtherAssetRemove(key)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
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

      {/* 清除所有素材按鈕 */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}>
        <button
          onClick={handleClearAll}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🗑️ 清除所有素材
        </button>
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
        }}>
          此操作會清除所有已上傳的素材，包括 Symbol 圖片和其他素材
        </div>
      </div>
    </div>
  );
}

