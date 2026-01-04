import { useIDE } from '../../store/index.jsx';

/**
 * GameParamsPanel 遊戲參數面板
 */
export function GameParamsPanel() {
  const { state, dispatch } = useIDE();

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      border: '1px solid #ddd',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: 'bold' }}>
        Base Bet
      </h3>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>
          基礎投注
        </label>
        <input
          type="number"
          value={state.baseBet}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
              dispatch({ type: 'SET_BASE_BET', payload: value });
            }
          }}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        遊戲參數設定（待實作完整功能）
      </div>
    </div>
  );
}

