import { useEffect, useRef, useState, useCallback } from 'react';
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
    spinSpeed: number;          // 滾輪轉速
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
  const result: SymbolId[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * DEFAULT_SYMBOL_IDS.length);
    result.push(DEFAULT_SYMBOL_IDS[randomIndex]);
  }
  return result;
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
  // 狀態
  const [offset, setOffset] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [transitionStyle, setTransitionStyle] = useState('none');
  const [showFinalSymbols, setShowFinalSymbols] = useState(true);

  // Refs
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const dummySymbolsRef = useRef<SymbolId[]>(generateDummySymbols(30));
  const prevStateRef = useRef<string>(state);

  // 常數
  const symbolHeight = symbolSize * symbolScale;
  const dummyIconsCount = 30; // 假符號單個週期圖示數
  const finalIconsCount = symbols.length; // 最終符號數量（3）
  const copies = 15; // 副本數量

  // 分別計算假符號和最終符號的循環高度和基準偏移
  const dummyCycleHeight = symbolHeight * dummyIconsCount;
  const finalCycleHeight = symbolHeight * finalIconsCount;
  const dummyBaseTranslate = -(dummyCycleHeight * Math.floor(copies / 2));
  const finalBaseTranslate = -(finalCycleHeight * Math.floor(copies / 2));

  // 根據當前顯示的符號列表選擇對應的 baseTranslate
  const baseTranslate = showFinalSymbols ? finalBaseTranslate : dummyBaseTranslate;

  // 開始滾動
  const startSpin = useCallback(() => {
    startTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = now - (startTimeRef.current || now);
      const speed = animation.spinSpeed * 0.15;

      // 使用假符號的 cycleHeight
      const newOffset = (elapsed * speed) % dummyCycleHeight;

      currentOffsetRef.current = newOffset;
      setOffset(newOffset);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
  }, [animation.spinSpeed, dummyCycleHeight]);

  // 停止滾動（觸發減速動畫）
  const handleStopTrigger = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    const currentPos = currentOffsetRef.current;
    const speedPxPerMs = animation.spinSpeed * 0.15;

    // 計算減速距離
    const stopDuration = 0.5 + (animation.easeStrength * 1.0);
    const rawDistance = speedPxPerMs * (stopDuration * 1000) * 0.7;

    // 確保至少轉兩圈以上才有動感（使用假符號的 cycleHeight）
    const minDistance = dummyCycleHeight * 2;
    const targetDistance = Math.max(rawDistance, minDistance);

    // 計算目標座標並對齊到格子
    const rawTarget = currentPos + targetDistance;
    const finalTarget = Math.ceil(rawTarget / symbolHeight) * symbolHeight;

    // cubic-bezier 曲線計算
    const p1x = 0.1;
    const p1y = 0.5 + (animation.easeStrength * 0.3);
    const p2x = 0.2 + (animation.bounceStrength * 0.1);
    const p2y = 1 + (animation.bounceStrength * 0.6);
    const bezierCurve = `cubic-bezier(${p1x}, ${p1y}, ${p2x}, ${p2y})`;

    // 先切換至靜止座標，清除任何殘留動畫
    setIsStopping(false);
    setOffset(currentPos);

    // 強制重繪後套用過渡動畫 (Reflow Reset)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsStopping(true);
        setTransitionStyle(`transform ${stopDuration}s ${bezierCurve}`);
        setOffset(finalTarget);
      });
    });
  }, [animation.spinSpeed, animation.easeStrength, animation.bounceStrength, symbolHeight, dummyCycleHeight]);

  // 處理 transition 結束
  const handleTransitionEnd = useCallback(() => {
    if (!isStopping) return;

    setIsStopping(false);
    setTransitionStyle('none');
    setShowFinalSymbols(true);
    setOffset(0);
    currentOffsetRef.current = 0;

    if (onStopped) {
      onStopped();
    }
  }, [isStopping, onStopped]);

  // 監聽 state 變化
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (state === 'spinning' && prevState !== 'spinning') {
      // 進入 spinning 狀態
      setShowFinalSymbols(false);
      setIsStopping(false);
      setTransitionStyle('none');
      setOffset(0);
      currentOffsetRef.current = 0;
      dummySymbolsRef.current = generateDummySymbols(30);
      startSpin();

    } else if (state === 'stopping' && prevState === 'spinning') {
      // 從 spinning 進入 stopping 狀態
      handleStopTrigger();

    } else if (state === 'stopped') {
      // 進入 stopped 狀態
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }

      setShowFinalSymbols(true);
      setIsStopping(false);
      setTransitionStyle('none');
      setOffset(0);
      currentOffsetRef.current = 0;

    } else if (state === 'idle') {
      // 進入 idle 狀態
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }

      setShowFinalSymbols(true);
      setIsStopping(false);
      setTransitionStyle('none');
      setOffset(0);
      currentOffsetRef.current = 0;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [state, startSpin, handleStopTrigger]);

  // 構建符號列表
  const symbolList = showFinalSymbols
    ? Array(copies).fill(symbols).flat()
    : Array(copies).fill(dummySymbolsRef.current).flat();

  // 計算 transform
  const currentTransform = `translate3d(0, ${baseTranslate + offset}px, 0)`;

  // 計算當前符號列表中可見區域的起始索引
  const currentIconsCount = showFinalSymbols ? finalIconsCount : dummyIconsCount;
  const middleStart = Math.floor(copies / 2) * currentIconsCount;

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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: currentTransform,
          transition: isStopping ? transitionStyle : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {symbolList.map((symbolId, index) => {
          // 計算該符號是否應該高亮
          let isHighlighted = false;

          if (state === 'stopped' && showFinalSymbols) {
            // offset = 0 時，可見區域從 middleStart 開始
            const visibleIndex = index - middleStart;

            if (visibleIndex >= 0 && visibleIndex < 3) {
              isHighlighted = highlightedRows.includes(visibleIndex);
            }
          }

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

      {/* 上下漸層遮罩 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${symbolHeight * 0.5}px`,
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent)',
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
          background: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
