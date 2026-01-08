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
          <span style={{ fontSize: '12px', color: '#666', minWidth: '50px' }}>
            {min}{unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => updateLayout(field, parseFloat(e.target.value))}
            style={{
              flex: 1,
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '12px', color: '#666', minWidth: '50px', textAlign: 'right' }}>
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
        📐 盤面視覺
      </h3>

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
          ✨ 調整後即時生效
        </div>
      </div>
    </div>
  );
}
