import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SpinPacket, WinningLine } from '../types/spin-packet.js';
import { Reel } from './Reel.js';

/**
 * Reel 狀態
 */
type ReelState = 'idle' | 'spinning' | 'stopping' | 'stopped';

/**
 * 中獎線循環顯示
 */
interface WinningLineDisplay {
  currentIndex: number;
  lines: WinningLine[];
}

/**
 * SlotMachine 元件 Props
 */
export interface SlotMachineProps {
  spinPacket?: SpinPacket;
  onSpinComplete?: () => void;
  onSkip?: () => void;
}

/**
 * SlotMachine 對外方法
 */
export interface SlotMachineRef {
  startSpin: () => void;
  skip: () => void;
  isSpinning: () => boolean;
}

/**
 * 根據 WinningLine.positions 計算每輪要高亮的行
 */
function getHighlightedRowsForReel(
  reelIndex: number,
  winningLine: WinningLine
): number[] {
  const rows = winningLine.positions
    .filter(([col]) => col === reelIndex)
    .map(([, row]) => row);
  return rows;
}

/**
 * SlotMachine 元件
 * 整合 5 輪並接收 SpinPacket
 */
export const SlotMachine = forwardRef<SlotMachineRef, SlotMachineProps>(
  ({ spinPacket, onSpinComplete, onSkip }, ref) => {
    // 每輪的狀態
    const [reelStates, setReelStates] = useState<ReelState[]>([
      'idle',
      'idle',
      'idle',
      'idle',
      'idle',
    ]);

    // 中獎線循環顯示
    const [winningLineDisplay, setWinningLineDisplay] = useState<WinningLineDisplay | null>(null);

    // 停輪計時器引用
    const stopTimersRef = useRef<number[]>([]);
    const isSpinningRef = useRef(false);

    // 預設值
    const defaultVisual = {
      animation: {
        spinSpeed: 0.5,
        spinDuration: 2000,
        reelStopDelay: 200,
        easeStrength: 0.5,
        bounceStrength: 0.3,
      },
      layout: {
        reelGap: 10,
        symbolScale: 1,
        boardScale: 1,
      },
    };

    const visual = spinPacket?.visual || defaultVisual;
    const board = spinPacket?.board;
    const assets = spinPacket?.assets;

    // 清除所有計時器
    const clearAllTimers = () => {
      stopTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      stopTimersRef.current = [];
    };

    // 開始動畫
    const startSpin = () => {
      if (!board) {
        return;
      }

      // 清除之前的計時器
      clearAllTimers();
      isSpinningRef.current = true;

      // 所有輪開始 spinning
      setReelStates(['spinning', 'spinning', 'spinning', 'spinning', 'spinning']);

      // 重置中獎線顯示
      setWinningLineDisplay(null);

      // 依序停輪
      for (let reelIndex = 0; reelIndex < 5; reelIndex++) {
        const delay = visual.animation.reelStopDelay * reelIndex;

        const timer = window.setTimeout(() => {
          setReelStates((prev) => {
            const newStates = [...prev];
            newStates[reelIndex] = 'stopping';
            return newStates;
          });
        }, delay);

        stopTimersRef.current.push(timer);
      }
    };

    // 跳過動畫
    const skip = () => {
      clearAllTimers();
      isSpinningRef.current = false;

      // 所有輪直接停止
      setReelStates(['stopped', 'stopped', 'stopped', 'stopped', 'stopped']);

      // 如果有中獎線，立即顯示
      if (spinPacket?.meta?.winningLines && spinPacket.meta.winningLines.length > 0) {
        setWinningLineDisplay({
          currentIndex: 0,
          lines: spinPacket.meta.winningLines,
        });
      }

      if (onSkip) {
        onSkip();
      }

      if (onSpinComplete) {
        onSpinComplete();
      }
    };

    // 檢查是否正在動畫中
    const isSpinning = () => {
      return isSpinningRef.current;
    };

    // 暴露對外方法
    useImperativeHandle(ref, () => ({
      startSpin,
      skip,
      isSpinning,
    }));

    // 處理每輪停止
    const handleReelStopped = (reelIndex: number) => {
      setReelStates((prev) => {
        const newStates = [...prev];
        newStates[reelIndex] = 'stopped';
        return newStates;
      });
    };

    // 檢查所有輪是否都停止
    useEffect(() => {
      const allStopped = reelStates.every((state) => state === 'stopped');
      
      if (allStopped && isSpinningRef.current) {
        isSpinningRef.current = false;

        // 觸發完成回調
        if (onSpinComplete) {
          onSpinComplete();
        }

        // 開始中獎線循環顯示
        if (spinPacket?.meta?.winningLines && spinPacket.meta.winningLines.length > 0) {
          setWinningLineDisplay({
            currentIndex: 0,
            lines: spinPacket.meta.winningLines,
          });
        }
      }
    }, [reelStates, onSpinComplete, spinPacket?.meta?.winningLines]);

    // 中獎線循環顯示
    useEffect(() => {
      if (!winningLineDisplay || winningLineDisplay.lines.length === 0) {
        return;
      }

      const interval = setInterval(() => {
        setWinningLineDisplay((prev) => {
          if (!prev) return null;
          const nextIndex = (prev.currentIndex + 1) % prev.lines.length;
          return {
            ...prev,
            currentIndex: nextIndex,
          };
        });
      }, 1000); // 每秒切換

      return () => clearInterval(interval);
    }, [winningLineDisplay]);

    // 當 spinPacket 改變時，重置狀態
    useEffect(() => {
      if (spinPacket) {
        setReelStates(['idle', 'idle', 'idle', 'idle', 'idle']);
        setWinningLineDisplay(null);
        isSpinningRef.current = false;
        clearAllTimers();
      }
    }, [spinPacket]);

    // 繪製中獎線連線
    const renderWinningLinePath = () => {
      if (!winningLineDisplay || winningLineDisplay.lines.length === 0) {
        return null;
      }

      const currentLine = winningLineDisplay.lines[winningLineDisplay.currentIndex];
      if (!currentLine || currentLine.positions.length === 0) {
        return null;
      }

      const symbolSize = 100;
      const symbolHeight = symbolSize * visual.layout.symbolScale;
      const reelGap = visual.layout.reelGap;
      const reelWidth = symbolSize * visual.layout.symbolScale;
      const boardScale = visual.layout.boardScale;

      // 計算每個位置的座標
      const points = currentLine.positions.map(([col, row]) => {
        const x = (col * (reelWidth + reelGap) + reelWidth / 2) * boardScale;
        const y = (row * symbolHeight + symbolHeight / 2) * boardScale;
        return { x, y };
      });

      if (points.length < 2) {
        return null;
      }

      // 使用 path 繪製連線
      const pathData = points
        .map((point, index) => {
          if (index === 0) {
            return `M ${point.x} ${point.y}`;
          } else {
            return `L ${point.x} ${point.y}`;
          }
        })
        .join(' ');

      return (
        <path
          d={pathData}
          stroke="#FFD700"
          strokeWidth={4 * boardScale}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.9}
        />
      );
    };

    if (!board) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>等待 SpinPacket...</p>
        </div>
      );
    }

    // 計算每輪要高亮的行
    const getHighlightedRows = (reelIndex: number): number[] => {
      if (!winningLineDisplay || winningLineDisplay.lines.length === 0) {
        return [];
      }

      const currentLine = winningLineDisplay.lines[winningLineDisplay.currentIndex];
      if (!currentLine) {
        return [];
      }

      return getHighlightedRowsForReel(reelIndex, currentLine);
    };

    // 計算尺寸
    const symbolSize = 100;
    const symbolHeight = symbolSize * visual.layout.symbolScale;
    const reelWidth = symbolSize * visual.layout.symbolScale;
    const reelGap = visual.layout.reelGap;
    const boardWidth = (reelWidth * 5 + reelGap * 4) * visual.layout.boardScale;
    const boardHeight = (symbolHeight * 3) * visual.layout.boardScale;

    // 外層容器（包含背景）
    const outerContainerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: boardHeight,
    };

    // 背景層（z-index: 0）
    const backgroundStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      backgroundImage: assets?.background ? `url(${assets.background})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };

    // 盤面容器（包含 board 底圖和 reels）
    const boardContainerStyle: React.CSSProperties = {
      position: 'relative',
      transform: `scale(${visual.layout.boardScale})`,
      transformOrigin: 'top left',
      width: boardWidth / visual.layout.boardScale,
      height: boardHeight / visual.layout.boardScale,
      zIndex: 2,
    };

    // 盤面底圖層（z-index: 1）
    const boardImageStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 1,
      backgroundImage: assets?.board ? `url(${assets.board})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };

    // Reels 容器（z-index: 2）
    const reelsContainerStyle: React.CSSProperties = {
      display: 'flex',
      gap: `${visual.layout.reelGap}px`,
      position: 'relative',
      zIndex: 2,
    };

    // 盤面框層（z-index: 3）
    const frameStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 3,
      backgroundImage: assets?.frame ? `url(${assets.frame})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      pointerEvents: 'none',
    };

    // 人物層（z-index: 4）
    const characterStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 'auto',
      height: '100%',
      zIndex: 4,
      display: assets?.character ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'flex-end',
      pointerEvents: 'none',
    };

    // 中獎線 SVG（z-index: 5）
    const svgOverlayStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: boardWidth,
      height: boardHeight,
      pointerEvents: 'none',
      zIndex: 5,
    };

    return (
      <div style={outerContainerStyle}>
        {/* 背景層（z-index: 0） */}
        {assets?.background && (
          <div style={backgroundStyle} />
        )}

        {/* 盤面容器 */}
        <div style={boardContainerStyle}>
          {/* 盤面底圖層（z-index: 1） */}
          {assets?.board && (
            <div style={boardImageStyle} />
          )}

          {/* Reels 容器（z-index: 2） */}
          <div style={reelsContainerStyle}>
            {board.reels.map((reelSymbols, reelIndex) => (
              <Reel
                key={reelIndex}
                symbols={reelSymbols}
                assets={assets}
                animation={visual.animation}
                symbolSize={symbolSize}
                symbolScale={visual.layout.symbolScale}
                state={reelStates[reelIndex]}
                highlightedRows={getHighlightedRows(reelIndex)}
                onStopped={() => handleReelStopped(reelIndex)}
              />
            ))}
          </div>

          {/* 盤面框層（z-index: 3） */}
          {assets?.frame && (
            <div style={frameStyle} />
          )}

          {/* 中獎線 SVG（z-index: 5） */}
          <svg
            style={svgOverlayStyle}
            width={boardWidth}
            height={boardHeight}
            viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          >
            {renderWinningLinePath()}
          </svg>
        </div>

        {/* 人物層（z-index: 4） */}
        {assets?.character && (
          <div style={characterStyle}>
            <img
              src={assets.character}
              alt="character"
              style={{
                maxHeight: '100%',
                maxWidth: '40%',
                objectFit: 'contain',
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

SlotMachine.displayName = 'SlotMachine';

