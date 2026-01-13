import { useEffect, useRef, useState, useCallback } from 'react';
import type { SymbolId } from '../types/board.js';
import type { AssetsPatch } from '../types/visual.js';
import { Symbol } from './Symbol.js';

/**
 * Reel 元件 Props
 */
export interface ReelProps {
  symbols: SymbolId[];              // 最終要顯示的符號（3 或 4 個）
  previousSymbols?: SymbolId[];     // 上次的結果符號（用於動畫起點）
  availableSymbols?: SymbolId[];    // 用戶設定的符號列表（用於生成 Dummy）
  symbolWeights?: Record<SymbolId, number>;  // 符號視覺權重映射（appearanceWeight）
  assets?: AssetsPatch;             // 素材覆蓋
  animation: {
    spinSpeed: number;              // 滾輪轉速
    spinDuration: number;           // 旋轉時長 (ms)
    easeStrength: number;           // 緩停力度 (0-1)
    bounceStrength: number;         // 回彈力度 (0-1)
  };
  symbolSize?: number;              // 符號尺寸（預設 100）
  symbolScale?: number;             // 符號縮放（預設 1，僅影響符號視覺大小）
  rows?: number;                    // 顯示行數（預設 3，支援 5x4 為 4）
  state: 'idle' | 'spinning' | 'stopping' | 'stopped';
  highlightedRows?: number[];       // 高亮的行 index
  onStopped?: () => void;           // 停輪完成回調
}

/**
 * 預設符號 ID 列表（當沒有傳入 availableSymbols 時使用）
 */
const DEFAULT_SYMBOL_IDS: SymbolId[] = ['H1', 'H2', 'H3', 'L1', 'L2', 'L3', 'L4'];

/**
 * 生成假符號列表（用於 spinning 階段）
 * 使用 appearanceWeight 加權抽取
 * @param count 生成數量
 * @param availableSymbols 可用符號列表
 * @param symbolWeights 符號權重映射（可選）
 */
function generateDummySymbols(
  count: number,
  availableSymbols: SymbolId[],
  symbolWeights?: Record<SymbolId, number>
): SymbolId[] {
  const result: SymbolId[] = [];
  const symbols = availableSymbols.length > 0 ? availableSymbols : DEFAULT_SYMBOL_IDS;

  // 如果有權重映射，使用加權抽取
  if (symbolWeights && Object.keys(symbolWeights).length > 0) {
    // 計算總權重
    const totalWeight = symbols.reduce((sum, id) => sum + (symbolWeights[id] || 1), 0);

    for (let i = 0; i < count; i++) {
      let random = Math.random() * totalWeight;
      let selected: SymbolId = symbols[0];

      for (const id of symbols) {
        random -= (symbolWeights[id] || 1);
        if (random <= 0) {
          selected = id;
          break;
        }
      }
      result.push(selected);
    }
  } else {
    // 沒有權重，使用均勻分布
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * symbols.length);
      result.push(symbols[randomIndex]);
    }
  }
  return result;
}

/**
 * Unified Strip 常數
 */
const DUMMY_COUNT = 30; // Dummy 符號數量

/**
 * Reel 元件
 * 顯示單輪 + 滾動動畫
 * 使用 Unified Strip 方案：整個動畫過程使用單一不變的符號列表
 */
export function Reel({
  symbols,
  previousSymbols,
  availableSymbols = [],
  symbolWeights,
  assets,
  animation,
  symbolSize = 100,
  symbolScale = 1,
  rows = 3,
  state,
  highlightedRows = [],
  onStopped,
}: ReelProps) {
  // ===== 狀態 =====
  const [offset, setOffset] = useState(0);
  const [isStopping, setIsStopping] = useState(false);
  const [transitionStyle, setTransitionStyle] = useState('none');

  // ===== Refs =====
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const currentOffsetRef = useRef(0);
  const prevStateRef = useRef<string>(state);

  // 緩存「當前應顯示的符號」，避免第一幀暴露新結果
  // 只有在 stopped 狀態時才更新
  const displaySymbolsRef = useRef<SymbolId[]>(symbols);
  // 追蹤是否已初始化
  const isInitializedRef = useRef(false);

  // Unified Strip: 整個動畫期間使用的符號列表
  const unifiedStripRef = useRef<SymbolId[]>([]);
  // 記錄 Unified Strip 的結構資訊
  const stripInfoRef = useRef({
    paddingLength: 0,   // 前置 padding 的長度
    finalLength: 0,     // Final 符號的長度
    dummyLength: 0,     // Dummy 符號的長度
    prevStart: 0,       // prevFinal 的起始索引
    totalLength: 0,     // 總長度
  });

  // ===== 常數 =====
  const symbolHeight = symbolSize;

  /**
   * 生成 Unified Strip
   * 結構: [ padding ] + [ newFinal ] + [ dummy x N ] + [ prevFinal ]
   * 
   * 動畫流程：
   * 1. 起點：offset 對應 prevFinal 位置（strip 尾端）
   * 2. offset 增加，符號條往上移，符號從上往下滾
   * 3. 終點：offset 對應 newFinal 位置
   */
  const generateUnifiedStrip = useCallback(() => {
    // 上次結果（作為動畫起點），如果沒有則使用當前符號
    const prevFinal = previousSymbols || symbols;

    // 生成 Dummy 符號（使用視覺權重）
    const dummySymbols = generateDummySymbols(DUMMY_COUNT, availableSymbols, symbolWeights);

    // 當前結果（動畫終點）
    const newFinal = symbols;

    // 前置 padding（確保有足夠空間）
    const padding = [...symbols];

    // 組合 Unified Strip: [ padding ] + [ newFinal ] + [ dummy ] + [ prevFinal ]
    // 這樣當符號條往上移動時，符號會從上往下滾動
    const strip = [...padding, ...newFinal, ...dummySymbols, ...prevFinal];

    // 記錄結構資訊
    stripInfoRef.current = {
      paddingLength: padding.length,
      finalLength: newFinal.length,
      dummyLength: dummySymbols.length,
      prevStart: padding.length + newFinal.length + dummySymbols.length,
      totalLength: strip.length,
    };

    unifiedStripRef.current = strip;
  }, [symbols, previousSymbols, availableSymbols, symbolWeights]);

  /**
   * 開始滾動
   */
  const startSpin = useCallback(() => {
    // 生成 Unified Strip
    generateUnifiedStrip();

    // 計算初始 offset：對應 prevFinal 的位置
    const { prevStart } = stripInfoRef.current;
    const initialOffset = prevStart * symbolHeight;

    startTimeRef.current = performance.now();
    currentOffsetRef.current = initialOffset;
    setOffset(initialOffset);

    const animate = () => {
      const now = performance.now();
      const elapsed = now - (startTimeRef.current || now);
      const speed = animation.spinSpeed * 0.15;

      // offset 減少，符號條往下移，符號從上往下滾
      const newOffset = initialOffset - (elapsed * speed);

      currentOffsetRef.current = newOffset;
      setOffset(newOffset);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
  }, [animation.spinSpeed, generateUnifiedStrip, symbolHeight]);

  /**
   * 停止滾動（觸發減速動畫）
   */
  const handleStopTrigger = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    const currentPos = currentOffsetRef.current;

    // 計算目標位置：newFinal 的起始位置
    const { paddingLength } = stripInfoRef.current;
    const targetOffset = paddingLength * symbolHeight;

    // 確保目標位置在當前位置之前（因為 offset 減少）
    // 並確保至少滾動一些距離
    const minTargetOffset = currentPos - symbolHeight * 2;
    const finalTargetOffset = Math.min(targetOffset, minTargetOffset);

    // 計算減速時長（基於 easeStrength）
    const stopDuration = 0.5 + (animation.easeStrength * 1.0);

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
        setOffset(finalTargetOffset);
      });
    });
  }, [animation.easeStrength, animation.bounceStrength, symbolHeight]);

  /**
   * 處理 transition 結束
   */
  const handleTransitionEnd = useCallback(() => {
    if (!isStopping) return;

    setIsStopping(false);
    setTransitionStyle('none');

    // 重置 offset 到 0，此時 Unified Strip 不再使用
    // 改為直接顯示 symbols（已透過 state === 'stopped' 控制）
    setOffset(0);
    currentOffsetRef.current = 0;

    if (onStopped) {
      onStopped();
    }
  }, [isStopping, onStopped]);

  // ===== 監聽 state 變化 =====
  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (state === 'spinning' && prevState !== 'spinning') {
      // 進入 spinning 狀態
      setIsStopping(false);
      setTransitionStyle('none');
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

      // 更新顯示符號為當前結果
      displaySymbolsRef.current = symbols;

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

      // 首次初始化時更新顯示符號
      if (!isInitializedRef.current) {
        displaySymbolsRef.current = symbols;
        isInitializedRef.current = true;
      }
      // 其他情況下保持 displaySymbolsRef 不變，避免第一幀暴露

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

  // ===== 決定要渲染的符號列表 =====
  // 當 spinning 或 stopping 時使用 Unified Strip
  // 當 idle 或 stopped 時使用 displaySymbolsRef（緩存的符號）
  const isAnimating = state === 'spinning' || state === 'stopping';

  let symbolList: SymbolId[];
  let copies: number;
  let baseTranslate: number;
  let currentIconsCount: number;

  if (isAnimating && unifiedStripRef.current.length > 0) {
    // 動畫中：使用 Unified Strip（不複製）
    symbolList = unifiedStripRef.current;
    copies = 1;
    baseTranslate = 0;
    currentIconsCount = symbolList.length;
  } else {
    // 非動畫：使用 displaySymbolsRef（緩存的符號）並複製以實現無限循環效果
    const displaySymbols = displaySymbolsRef.current;
    const copiesCount = 15;
    symbolList = Array(copiesCount).fill(displaySymbols).flat();
    copies = copiesCount;
    const cycleHeight = symbolHeight * displaySymbols.length;
    baseTranslate = -(cycleHeight * Math.floor(copiesCount / 2));
    currentIconsCount = displaySymbols.length;
  }

  // 計算 transform
  const currentTransform = `translate3d(0, ${baseTranslate - offset}px, 0)`;

  // 計算可見區域的起始索引（用於高亮計算）
  const middleStart = isAnimating ? 0 : Math.floor(copies / 2) * currentIconsCount;

  return (
    <div
      style={{
        width: `${symbolSize}px`,
        height: `${symbolSize * rows}px`,
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

          if (state === 'stopped') {
            // 只有在 stopped 狀態才顯示高亮
            const visibleIndex = index - middleStart;

            if (visibleIndex >= 0 && visibleIndex < rows) {
              isHighlighted = highlightedRows.includes(visibleIndex);
            }
          }

          return (
            <div
              key={`${symbolId}-${index}`}
              style={{
                width: `${symbolSize}px`,
                height: `${symbolSize}px`,
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
