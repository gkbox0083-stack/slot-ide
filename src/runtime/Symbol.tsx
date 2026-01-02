import type { SymbolId } from '../types/board.js';
import type { AssetsPatch } from '../types/visual.js';

/**
 * Symbol 元件 Props
 */
export interface SymbolProps {
  symbolId: SymbolId;           // 符號 ID（H1, L1...）
  assets?: AssetsPatch;         // 素材覆蓋
  scale?: number;               // 縮放（預設 1）
  highlighted?: boolean;        // 是否高亮（中獎時）
  size?: number;                // 符號尺寸 px（預設 100）
}

/**
 * 符號色彩映射（fallback 用）
 */
const SYMBOL_COLORS: Record<string, string> = {
  H1: '#FF6B6B',  // 紅
  H2: '#4ECDC4',  // 青
  H3: '#FFE66D',  // 黃
  L1: '#95E1D3',  // 淺綠
  L2: '#A8D8EA',  // 淺藍
  L3: '#DDA0DD',  // 淺紫
  L4: '#F0E68C',  // 卡其
};

/**
 * Symbol 元件
 * 顯示單一符號（支援圖片或色塊 fallback）
 */
export function Symbol({
  symbolId,
  assets,
  scale = 1,
  highlighted = false,
  size = 100,
}: SymbolProps) {
  const imageUrl = assets?.symbols?.[symbolId];
  const fallbackColor = SYMBOL_COLORS[symbolId] || '#888888';
  
  const baseSize = size * scale;
  const highlightScale = highlighted ? 1.05 : 1;
  const finalSize = baseSize * highlightScale;

  const containerStyle: React.CSSProperties = {
    width: `${finalSize}px`,
    height: `${finalSize}px`,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: highlighted
      ? `0 0 ${finalSize * 0.2}px ${fallbackColor}, 0 0 ${finalSize * 0.4}px ${fallbackColor}`
      : 'none',
    filter: highlighted ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' : 'none',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
  };

  if (imageUrl) {
    // 顯示圖片
    return (
      <div style={containerStyle}>
        <img
          src={imageUrl}
          alt={symbolId}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // 顯示色塊 fallback
  return (
    <div
      style={{
        ...containerStyle,
        backgroundColor: fallbackColor,
        borderRadius: '4px',
      }}
    >
      <span
        style={{
          fontSize: `${finalSize * 0.3}px`,
          fontWeight: 'bold',
          color: '#FFFFFF',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8), -1px -1px 2px rgba(0, 0, 0, 0.8)',
          userSelect: 'none',
        }}
      >
        {symbolId}
      </span>
    </div>
  );
}

