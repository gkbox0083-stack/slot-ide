import { useGameConfigStore } from '../../store/useGameConfigStore.js';

/**
 * 預設佈局參數
 */
const defaultLayoutConfig = {
  reelGap: 10,
  symbolScale: 1.0,
  boardScale: 1.0,
};

/**
 * LayoutPanel 盤面視覺面板
 */
export function LayoutPanel() {
  const { visualConfig, updateLayoutConfig, setVisualConfig } = useGameConfigStore();
  const layout = visualConfig.layout;

  // 更新佈局參數
  const updateLayout = (field: keyof typeof layout, value: number) => {
    updateLayoutConfig({ [field]: value });
  };

  // 重置為預設值
  const handleReset = () => {
    setVisualConfig({
      ...visualConfig,
      layout: { ...defaultLayoutConfig },
    });
  };

  // Slider 元件
  const Slider = ({
    label,
    field,
    min,
    max,
    step,
    value,
    unit = '',
    hint,
  }: {
    label: string;
    field: keyof typeof layout;
    min: number;
    max: number;
    step: number;
    value: number;
    unit?: string;
    hint?: string;
  }) => {
    return (
      <div className="flex flex-col gap-2 py-3 border-b border-surface-700 last:border-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-semibold text-sm text-surface-200">
            {label} <span className="text-surface-500 font-normal text-xs">({field})</span>
          </span>
          <span className="text-primary-400 text-sm font-bold">
            {value}{unit}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-500 min-w-[50px]">
            {min}{unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => updateLayout(field, parseFloat(e.target.value))}
            className="flex-1 cursor-pointer accent-primary-500 h-2 bg-surface-700 rounded-lg appearance-none"
          />
          <span className="text-xs text-surface-500 min-w-[50px] text-right">
            {max}{unit}
          </span>
        </div>

        {hint && (
          <div className="text-xs text-surface-400 italic mt-1">
            ℹ️ {hint}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-0">
      <h3 className="mt-0 mb-5 text-base font-bold flex items-center gap-2 text-surface-100">
        📐 盤面視覺
      </h3>

      <div className="space-y-1">
        {/* 卷軸間距 */}
        <Slider
          label="卷軸間距"
          field="reelGap"
          min={0}
          max={50}
          step={1}
          value={layout.reelGap}
          unit="px"
          hint="每個卷軸之間的間距"
        />

        {/* 圖示縮放 */}
        <Slider
          label="圖示縮放"
          field="symbolScale"
          min={0.5}
          max={2.0}
          step={0.1}
          value={layout.symbolScale}
          unit="x"
          hint="符號圖示的縮放比例"
        />

        {/* 盤面縮放 */}
        <Slider
          label="盤面縮放"
          field="boardScale"
          min={0.5}
          max={2.0}
          step={0.1}
          value={layout.boardScale}
          unit="x"
          hint="整個盤面的縮放比例"
        />
      </div>

      {/* 重置按鈕 */}
      <div className="mt-5 pt-4 border-t border-surface-700">
        <button
          onClick={handleReset}
          className="w-full py-2.5 px-4 text-sm bg-surface-700 hover:bg-surface-600 text-white rounded transition-colors font-bold mb-3"
        >
          🔄 重置為預設值
        </button>

        <div className="text-xs text-green-400 italic text-center">
          ✨ 調整後即時生效
        </div>
      </div>
    </div>
  );
}
