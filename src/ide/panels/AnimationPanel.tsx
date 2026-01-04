import { useIDE } from '../../store/index.jsx';
import type { VisualConfig } from '../../types/visual.js';

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
  const { state, dispatch } = useIDE();
  const animation = state.visualConfig.animation;

  // 更新動畫參數
  const updateAnimation = (field: keyof typeof animation, value: number) => {
    const newConfig: VisualConfig = {
      ...state.visualConfig,
      animation: {
        ...state.visualConfig.animation,
        [field]: value,
      },
    };
    dispatch({ type: 'SET_VISUAL_CONFIG', payload: newConfig });
  };

  // 重置為預設值
  const handleReset = () => {
    const newConfig: VisualConfig = {
      ...state.visualConfig,
      animation: { ...defaultAnimationConfig },
    };
    dispatch({ type: 'SET_VISUAL_CONFIG', payload: newConfig });
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
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 0',
        borderBottom: '1px solid #eee',
      }}>
        <div style={{
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '4px',
        }}>
          {label} ({field})
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>
            {min}{unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => updateAnimation(field, parseFloat(e.target.value))}
            style={{
              flex: 1,
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '12px', color: '#666', minWidth: '60px', textAlign: 'right' }}>
            {max}{unit}
          </span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#3498db',
        }}>
          目前: {value}{unit}
        </div>
        {hint && (
          <div style={{
            fontSize: '12px',
            color: '#888',
            fontStyle: 'italic',
            marginTop: '4px',
          }}>
            ℹ️ {hint}
          </div>
        )}
      </div>
    );
  };

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
        🎬 動畫參數
      </h3>

      {/* 滾輪轉速 */}
      <Slider
        label="滾輪轉速"
        field="spinSpeed"
        min={1}
        max={50}
        step={1}
        value={animation.spinSpeed}
        hint="控制滾輪旋轉的速度"
      />

      {/* 旋轉時長 */}
      <Slider
        label="旋轉時長"
        field="spinDuration"
        min={500}
        max={5000}
        step={100}
        value={animation.spinDuration}
        unit="ms"
        hint="從開始到第一輪停止的總時長"
      />

      {/* 停輪間隔 */}
      <Slider
        label="停輪間隔"
        field="reelStopDelay"
        min={50}
        max={500}
        step={10}
        value={animation.reelStopDelay}
        unit="ms"
        hint="每輪之間的停止延遲"
      />

      {/* 緩停力度 */}
      <Slider
        label="緩停力度"
        field="easeStrength"
        min={0}
        max={1}
        step={0.1}
        value={animation.easeStrength}
        hint="停輪時的減速曲線強度"
      />

      {/* 回彈力度 */}
      <Slider
        label="回彈力度"
        field="bounceStrength"
        min={0}
        max={1}
        step={0.1}
        value={animation.bounceStrength}
        hint="停輪時的回彈效果強度"
      />

      {/* 重置按鈕 */}
      <div style={{
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #ddd',
      }}>
        <button
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '12px',
          }}
        >
          🔄 重置為預設值
        </button>

        <div style={{
          fontSize: '12px',
          color: '#2ecc71',
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
          ✨ 調整後即時生效（下次 Spin 時套用）
        </div>
      </div>
    </div>
  );
}
