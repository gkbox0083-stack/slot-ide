import { useEffect, useRef, useState } from 'react';
import type { SymbolId } from '../types/board.js';
import type { AssetsPatch } from '../types/visual.js';
import { Symbol } from './Symbol.js';

/**
 * Reel 元件 Props
 */
export interface ReelProps {
  symbols: SymbolId[];          // 最終要顯示的 3 個符號
  assets?: AssetsPatch;         // 素材覆蓋
  animation: {
    spinSpeed: number;          // 滾輪轉速 (px/frame 概念)
    spinDuration: number;       // 旋轉時長 (ms)
    easeStrength: number;       // 緩停力度 (0-1)
    bounceStrength: number;     // 回彈力度 (0-1)
  };
  symbolSize?: number;          // 符號尺寸（預設 100）
  symbolScale?: number;         // 符號縮放（預設 1）
  state: 'idle' | 'spinning' | 'stopping' | 'stopped';
  highlightedRows?: number[];   // 高亮的行 index（0, 1, 2）
  onStopped?: () => void;       // 停輪完成回調
}

/**
 * 預設符號 ID 列表（用於生成假符號）
 */
const DEFAULT_SYMBOL_IDS: SymbolId[] = ['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4'];

/**
 * 生成假符號列表（用於 spinning 階段）
 */
function generateDummySymbols(count: number = 30): SymbolId[] {
  const symbols: SymbolId[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * DEFAULT_SYMBOL_IDS.length);
    symbols.push(DEFAULT_SYMBOL_IDS[randomIndex]);
  }
  return symbols;
}

/**
 * Reel 元件
 * 顯示單輪（3 個符號）+ 滾動動畫
 */
export function Reel({
  symbols,
  assets,
  animation,
  symbolSize = 100,
  symbolScale = 1,
  state,
  highlightedRows = [],
  onStopped,
}: ReelProps) {
  const [offset, setOffset] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const transitionEndHandlerRef = useRef<(() => void) | null>(null);
  const stoppingOffsetRef = useRef<number>(0); // 保存進入 stopping 時的 offset

  // 生成假符號列表（約 30 個，複製 5 份確保無縫滾動）
  const dummySymbols = useRef<SymbolId[]>(generateDummySymbols(30));
  const symbolCount = dummySymbols.current.length;
  const copies = 5; // 複製份數（可見 3 個 + 上下緩衝）
  const symbolHeight = symbolSize * symbolScale;
  const totalCycleHeight = symbolHeight * symbolCount * copies; // 統一的循環高度

  // spinning 階段的動畫循環
  useEffect(() => {
    if (state !== 'spinning') {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // 重置假符號列表
    dummySymbols.current = generateDummySymbols(30);
    
    // 重置 offset
    setOffset(0);
    startTimeRef.current = performance.now();

    const animate = () => {
      if (state !== 'spinning') {
        return;
      }

      const now = performance.now();
      const elapsed = now - (startTimeRef.current || now);
      
      // 計算 offset（使用取模避免數值膨脹）
      const newOffset = (elapsed * animation.spinSpeed) % totalCycleHeight;
      setOffset(newOffset);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state, animation.spinSpeed, symbolHeight, totalCycleHeight]);

  // stopping 階段：計算最終位置並使用 CSS transition
  useEffect(() => {
    if (state !== 'stopping') {
      return;
    }

    // 停止 requestAnimationFrame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 保存進入 stopping 時的 offset
    stoppingOffsetRef.current = offset;

    // 計算目標位置：對齊到顯示最終符號的位置
    // 目標是讓第一個符號在可見區域的第一個位置
    // 由於最終符號列表只有 3 個符號（複製 5 份），我們需要對齊到第一個符號的位置
    const targetOffset = symbolHeight * 1; // 第一個符號在可見區域的第一個位置
    
    // 計算從當前位置到目標位置的距離
    // 需要考慮減速距離，所以目標位置應該稍微超過
    // 確保 currentOffset 在 totalCycleHeight 範圍內
    const currentOffset = stoppingOffsetRef.current % totalCycleHeight;
    const distanceToTarget = targetOffset - (currentOffset % symbolHeight);
    
    // 如果距離太短，增加一個循環的距離
    const adjustedDistance = distanceToTarget < symbolHeight * 2 
      ? distanceToTarget + symbolHeight * symbolCount 
      : distanceToTarget;
    
    // 計算減速距離（根據 easeStrength）
    const decelerationDistance = symbolHeight * (1 + animation.easeStrength * 2);
    const finalOffset = currentOffset + adjustedDistance + decelerationDistance;

    // 設定 CSS transition
    const strip = stripRef.current;
    if (strip) {
      // 先設定當前位置（不使用 transition）
      strip.style.transition = 'none';
      strip.style.transform = `translateY(-${currentOffset}px)`;
      
      // 強制重排以確保位置更新
      strip.offsetHeight;
      
      // 計算 cubic-bezier 參數
      // p2y = 1 + (bounceStrength * 0.6) 實現回彈效果
      const p2y = 1 + (animation.bounceStrength * 0.6);
      const cubicBezier = `cubic-bezier(0.25, 0.1, ${animation.easeStrength}, ${p2y})`;
      
      // 設定 transition 並移動到最終位置
      strip.style.transition = `transform 0.8s ${cubicBezier}`;
      strip.style.transform = `translateY(-${finalOffset}px)`;
      
      // 監聽 transition 結束
      transitionEndHandlerRef.current = () => {
        if (strip) {
          strip.style.transition = '';
          // 確保最終位置對齊到目標位置
          strip.style.transform = `translateY(-${targetOffset}px)`;
        }
        if (onStopped) {
          onStopped();
        }
      };
      
      strip.addEventListener('transitionend', transitionEndHandlerRef.current);
    }

    return () => {
      if (strip && transitionEndHandlerRef.current) {
        strip.removeEventListener('transitionend', transitionEndHandlerRef.current);
      }
    };
  }, [state, offset, symbolHeight, totalCycleHeight, symbolCount, symbols, animation.easeStrength, animation.bounceStrength, onStopped]);

  // stopped 狀態：確保顯示最終符號
  useEffect(() => {
    if (state === 'stopped') {
      setOffset(symbolHeight * 1); // 對齊到第一個符號位置
    }
  }, [state, symbolHeight]);

  // idle 狀態：顯示靜止符號
  useEffect(() => {
    if (state === 'idle') {
      setOffset(0);
    }
  }, [state]);

  // 構建符號列表（spinning 時使用假符號，其他狀態使用最終符號）
  const renderSymbols = () => {
    if (state === 'spinning') {
      // spinning 時渲染多副本假符號
      const allSymbols: SymbolId[] = [];
      for (let i = 0; i < copies; i++) {
        allSymbols.push(...dummySymbols.current);
      }
      return allSymbols;
    } else {
      // 其他狀態使用最終符號，但需要足夠的副本以確保渲染正常
      const allSymbols: SymbolId[] = [];
      for (let i = 0; i < 5; i++) {
        allSymbols.push(...symbols);
      }
      return allSymbols;
    }
  };

  const symbolList = renderSymbols();
  // transform 在 stopping 階段由 CSS transition 控制，不需要在這裡設定
  const currentTransform = state === 'spinning' 
    ? `translateY(-${offset}px)`
    : state === 'stopping'
    ? undefined // 由 CSS transition 控制（在 useEffect 中設定）
    : state === 'stopped'
    ? `translateY(-${symbolHeight * 1}px)`
    : `translateY(0px)`;

  return (
    <div
      style={{
        width: `${symbolSize * symbolScale}px`,
        height: `${symbolSize * symbolScale * 3}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '4px',
      }}
    >
      {/* 符號長條 */}
      <div
        ref={stripRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          ...(currentTransform !== undefined && { transform: currentTransform }),
          transition: state === 'stopping' ? undefined : 'none',
        }}
      >
        {symbolList.map((symbolId, index) => {
          // 計算該符號在可見區域的行索引（0, 1, 2）
          let rowIndex = -1;
          
          if (state === 'stopped') {
            // stopped 狀態：transform 是 translateY(-symbolHeight * 1)
            // 第一個可見符號在 index 1（在 symbols 列表中的位置）
            // 由於 symbols 只有 3 個，複製了 5 份，所以：
            // - 第一個可見符號在 index 1, 4, 7, 10...（每 3 個一組，每組的第一個）
            // - 第二個可見符號在 index 2, 5, 8, 11...（每 3 個一組，每組的第二個）
            // - 第三個可見符號在 index 3, 6, 9, 12...（每 3 個一組，每組的第三個）
            if (index >= 1) {
              const relativeIndex = (index - 1) % 3;
              if (relativeIndex >= 0 && relativeIndex < 3) {
                rowIndex = relativeIndex;
              }
            }
          } else if (state === 'idle') {
            // idle 狀態：transform 是 translateY(0)
            // 第一個可見符號在 index 0
            rowIndex = index % 3;
          }
          // spinning/stopping 狀態：不顯示高亮（rowIndex = -1）
          
          const isHighlighted = rowIndex >= 0 && rowIndex < 3 && highlightedRows.includes(rowIndex) && state === 'stopped';
          
          return (
            <div
              key={`${symbolId}-${index}`}
              style={{
                width: `${symbolSize * symbolScale}px`,
                height: `${symbolSize * symbolScale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Symbol
                symbolId={symbolId}
                assets={assets}
                scale={symbolScale}
                highlighted={isHighlighted}
                size={symbolSize}
              />
            </div>
          );
        })}
      </div>
      
      {/* 上下漸層遮罩（可選） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${symbolHeight * 0.5}px`,
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${symbolHeight * 0.5}px`,
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.3), transparent)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

