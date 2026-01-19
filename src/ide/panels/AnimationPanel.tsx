import { useGameConfigStore } from '../../store/useGameConfigStore.js';

/**
 * 預設動畫參數
 */
const defaultAnimationConfig = {
  spinSpeed: 20,
  spinDuration: 2000,
  reelStopDelay: 200,
  easeStrength: 0.5,
  bounceStrength: 0.3,
};

/**
 * AnimationPanel 動態參數面板
 */
export function AnimationPanel() {
  const { visualConfig, updateAnimationConfig, setVisualConfig } = useGameConfigStore();
  const animation = visualConfig.animation;

  // 更新動畫參數
  const updateAnimation = (field: keyof typeof animation, value: number) => {
    updateAnimationConfig({ [field]: value });
  };

  // 重置為預設值
  const handleReset = () => {
    setVisualConfig({
      ...visualConfig,
      animation: { ...defaultAnimationConfig },
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
    field: keyof typeof animation;
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
          <span className="text-xs text-surface-500 min-w-[40px]">
            {min}{unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => updateAnimation(field, parseFloat(e.target.value))}
            className="flex-1 cursor-pointer accent-primary-500 h-2 bg-surface-700 rounded-lg appearance-none"
          />
          <span className="text-xs text-surface-500 min-w-[40px] text-right">
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
          🎬 動畫參數
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>↺</span> 全部重置
        </button>
      </div>

      <div className="space-y-1">
        {/* 滾輪轉速 */}
        <Slider
          label="滾輪轉速"
          field="spinSpeed"
          min={5}
          max={30}
          step={1}
          value={animation.spinSpeed}
          hint="控制滾輪旋轉的速度（5-30 為安全範圍）"
        />

        {/* 旋轉時長 */}
        <Slider
          label="旋轉時長"
          field="spinDuration"
          min={1000}
          max={3000}
          step={100}
          value={animation.spinDuration}
          unit="ms"
          hint="從開始到第一輪停止的總時長（1000-3000ms 為安全範圍）"
        />

        {/* 停輪間隔 */}
        <Slider
          label="停輪間隔"
          field="reelStopDelay"
          min={100}
          max={300}
          step={10}
          value={animation.reelStopDelay}
          unit="ms"
          hint="每輪之間的停止延遲（100-300ms 為安全範圍）"
        />

        {/* 緩停力度 */}
        <Slider
          label="緩停力度"
          field="easeStrength"
          min={0.2}
          max={0.8}
          step={0.1}
          value={animation.easeStrength}
          hint="停輪時的減速曲線強度（0.2-0.8 為安全範圍）"
        />

        {/* 回彈力度 */}
        <Slider
          label="回彈力度"
          field="bounceStrength"
          min={0}
          max={0.5}
          step={0.1}
          value={animation.bounceStrength}
          hint="停輪時的回彈效果強度（0-0.5 為安全範圍）"
        />
      </div>
    </div>
  );
}
