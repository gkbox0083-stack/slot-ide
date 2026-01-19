import { useGameConfigStore } from '../../store/useGameConfigStore.js';

/**
 * 預設佈局參數
 */
const defaultLayoutConfig = {
  reelGap: 10,
  symbolScale: 1.0,
  boardScale: 1.0,
  backgroundTransform: { offsetX: 0, offsetY: 0, scale: 1 },
  boardContainerTransform: { offsetX: 0, offsetY: 0, scale: 1 },
  characterTransform: { offsetX: 0, offsetY: 0, scale: 1 },
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
      <div className="flex justify-between items-center mb-5">
        <h3 className="m-0 text-base font-bold flex items-center gap-2 text-surface-100">
          📐 盤面視覺
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

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

      {/* 圖層位置 */}
      <h3 className="mt-6 mb-4 text-base font-bold flex items-center gap-2 text-surface-100">
        📍 圖層位置
      </h3>
      <div className="space-y-4">
        {/* 背景層 */}
        <div className="p-3 bg-surface-800 rounded border border-surface-700">
          <h4 className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wide">
            🖼️ 背景
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-surface-400 block mb-1">X 偏移</label>
              <input
                type="number"
                value={layout.backgroundTransform?.offsetX ?? 0}
                onChange={(e) => updateLayoutConfig({
                  backgroundTransform: {
                    ...layout.backgroundTransform,
                    offsetX: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Y 偏移</label>
              <input
                type="number"
                value={layout.backgroundTransform?.offsetY ?? 0}
                onChange={(e) => updateLayoutConfig({
                  backgroundTransform: {
                    ...layout.backgroundTransform,
                    offsetY: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">縮放</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={3}
                value={layout.backgroundTransform?.scale ?? 1}
                onChange={(e) => updateLayoutConfig({
                  backgroundTransform: {
                    ...layout.backgroundTransform,
                    scale: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
          </div>
        </div>

        {/* 盤面層 */}
        <div className="p-3 bg-surface-800 rounded border border-surface-700">
          <h4 className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wide">
            🎰 盤面
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-surface-400 block mb-1">X 偏移</label>
              <input
                type="number"
                value={layout.boardContainerTransform?.offsetX ?? 0}
                onChange={(e) => updateLayoutConfig({
                  boardContainerTransform: {
                    ...layout.boardContainerTransform,
                    offsetX: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Y 偏移</label>
              <input
                type="number"
                value={layout.boardContainerTransform?.offsetY ?? 0}
                onChange={(e) => updateLayoutConfig({
                  boardContainerTransform: {
                    ...layout.boardContainerTransform,
                    offsetY: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">縮放</label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                max={2}
                value={layout.boardContainerTransform?.scale ?? 1}
                onChange={(e) => updateLayoutConfig({
                  boardContainerTransform: {
                    ...layout.boardContainerTransform,
                    scale: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
          </div>
        </div>

        {/* 人物層 */}
        <div className="p-3 bg-surface-800 rounded border border-surface-700">
          <h4 className="text-xs font-semibold text-surface-400 mb-3 uppercase tracking-wide">
            👤 人物
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-surface-400 block mb-1">X 偏移</label>
              <input
                type="number"
                value={layout.characterTransform?.offsetX ?? 0}
                onChange={(e) => updateLayoutConfig({
                  characterTransform: {
                    ...layout.characterTransform,
                    offsetX: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">Y 偏移</label>
              <input
                type="number"
                value={layout.characterTransform?.offsetY ?? 0}
                onChange={(e) => updateLayoutConfig({
                  characterTransform: {
                    ...layout.characterTransform,
                    offsetY: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 block mb-1">縮放</label>
              <input
                type="number"
                step={0.1}
                min={0.1}
                max={3}
                value={layout.characterTransform?.scale ?? 1}
                onChange={(e) => updateLayoutConfig({
                  characterTransform: {
                    ...layout.characterTransform,
                    scale: Number(e.target.value)
                  }
                })}
                className="w-full px-2 py-1 text-sm bg-surface-900 border border-surface-600 rounded text-surface-200"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
