import { useEffect, useRef, useState } from 'react';
import { poolBuilder, spinExecutor } from './engine/index.js';
import { SlotMachine } from './runtime/index.js';
import type { SpinPacket } from './types/spin-packet.js';
import type { SlotMachineRef } from './runtime/index.js';

function App() {
  const [spinPacket, setSpinPacket] = useState<SpinPacket | undefined>(undefined);
  const [isPoolsBuilt, setIsPoolsBuilt] = useState(false);
  const [status, setStatus] = useState<string>('準備中...');
  const [buildResult, setBuildResult] = useState<string>('');
  const slotMachineRef = useRef<SlotMachineRef>(null);

  // 初始化：建立盤池
  useEffect(() => {
    const initialize = async () => {
      try {
        setStatus('正在建立盤池...');
        const result = poolBuilder.buildPools(100); // 每個 Outcome 建立 100 個盤面
        console.log('=== Build Pools 結果 ===');
        console.log('成功:', result.success);
        console.log('Pool 狀態:', result.pools);
        console.log('錯誤:', result.errors);
        
        const totalGenerated = result.pools.reduce((sum, pool) => sum + pool.generated, 0);
        
        setIsPoolsBuilt(true);
        setBuildResult(`盤池建立完成！共 ${totalGenerated} 個盤面`);
        setStatus(`✅ 盤池建立完成！共 ${totalGenerated} 個盤面`);
      } catch (error) {
        console.error('建立盤池失敗:', error);
        setStatus(`❌ 錯誤: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    initialize();
  }, []);

  // 執行 Spin
  const handleSpin = () => {
    if (!isPoolsBuilt) {
      setStatus('⚠️ 請先建立盤池！');
      return;
    }

    try {
      // 1. 使用 Math Engine 產生 SpinPacket
      const visual = spinExecutor.getDefaultVisualConfig();
      const newSpinPacket = spinExecutor.spin(visual);
      
      console.log('=== SpinPacket 產生 ===');
      console.log('Board:', newSpinPacket.board);
      console.log('Meta:', newSpinPacket.meta);
      console.log('完整 SpinPacket:', JSON.stringify(newSpinPacket, null, 2));

      // 2. 設定 SpinPacket 給 SlotMachine
      setSpinPacket(newSpinPacket);
      setStatus('🔄 SpinPacket 已產生，準備開始動畫...');

      // 3. 等待一下讓 SlotMachine 接收新的 spinPacket，然後觸發動畫
      setTimeout(() => {
        if (slotMachineRef.current) {
          slotMachineRef.current.startSpin();
          setStatus('🎰 動畫進行中...');
        }
      }, 100);
    } catch (error) {
      console.error('Spin 失敗:', error);
      setStatus(`❌ 錯誤: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 動畫完成回調
  const handleSpinComplete = () => {
    setStatus('✅ 動畫完成！');
    
    // 驗證盤面
    if (spinPacket) {
      console.log('=== 驗證盤面 ===');
      console.log('SpinPacket.board:', spinPacket.board);
      console.log('中獎線數量:', spinPacket.meta?.winningLines?.length || 0);
      
      // 驗證邏輯：檢查 SlotMachine 顯示的盤面是否與 SpinPacket.board 一致
      // 這部分需要從 DOM 或透過其他方式驗證
      // 目前先輸出到 Console 供手動檢查
      
      if (spinPacket.meta?.winningLines && spinPacket.meta.winningLines.length > 0) {
        console.log('中獎線資訊:', spinPacket.meta.winningLines);
        setStatus(`✅ 動畫完成！發現 ${spinPacket.meta.winningLines.length} 條中獎線`);
      } else {
        setStatus('✅ 動畫完成！（無中獎）');
      }
    }
  };

  // 跳過動畫
  const handleSkip = () => {
    if (slotMachineRef.current) {
      slotMachineRef.current.skip();
      setStatus('⏭️ 動畫已跳過');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>slot-ide - Math Engine + Runtime 測試</h1>
      
      {/* 狀態顯示 */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <p style={{ margin: '5px 0' }}><strong>狀態:</strong> {status}</p>
        <p style={{ margin: '5px 0' }}><strong>盤池狀態:</strong> {isPoolsBuilt ? '✅ 已建立' : '❌ 未建立'}</p>
        {buildResult && <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>{buildResult}</p>}
      </div>

      {/* 控制按鈕 */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleSpin}
          disabled={!isPoolsBuilt}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            marginRight: '10px',
            backgroundColor: isPoolsBuilt ? '#4CAF50' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isPoolsBuilt ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          🎰 Spin
        </button>
        <button
          onClick={handleSkip}
          disabled={!spinPacket || !slotMachineRef.current?.isSpinning()}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: (spinPacket && slotMachineRef.current?.isSpinning()) ? '#ff9800' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (spinPacket && slotMachineRef.current?.isSpinning()) ? 'pointer' : 'not-allowed',
          }}
        >
          ⏭️ 跳過動畫
        </button>
      </div>

      {/* SlotMachine 顯示 */}
      <div style={{ 
        marginTop: '20px', 
        border: '2px solid #333', 
        padding: '20px', 
        borderRadius: '8px', 
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <SlotMachine
          ref={slotMachineRef}
          spinPacket={spinPacket}
          onSpinComplete={handleSpinComplete}
          onSkip={handleSkip}
        />
      </div>

      {/* 驗證資訊顯示 */}
      {spinPacket && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>📊 SpinPacket 資訊</h3>
          <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
            <p><strong>Outcome ID:</strong> {spinPacket.meta?.outcomeId || 'N/A'}</p>
            <p><strong>Win:</strong> {spinPacket.meta?.win || 0}</p>
            <p><strong>Multiplier:</strong> {spinPacket.meta?.multiplier || 0}</p>
            <p><strong>中獎線數量:</strong> {spinPacket.meta?.winningLines?.length || 0}</p>
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>📋 查看完整 Board</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#fff', 
                overflow: 'auto',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                {JSON.stringify(spinPacket.board, null, 2)}
              </pre>
            </details>
            
            {spinPacket.meta?.winningLines && spinPacket.meta.winningLines.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🎯 查看中獎線 ({spinPacket.meta.winningLines.length} 條)</summary>
                <pre style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#fff', 
                  overflow: 'auto',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  {JSON.stringify(spinPacket.meta.winningLines, null, 2)}
                </pre>
              </details>
            )}
            
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>🔍 查看完整 SpinPacket</summary>
              <pre style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#fff', 
                overflow: 'auto',
                borderRadius: '4px',
                fontSize: '12px',
                maxHeight: '400px',
              }}>
                {JSON.stringify(spinPacket, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* 測試說明 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '14px' }}>
        <h4 style={{ marginTop: 0 }}>📝 測試步驟：</h4>
        <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>等待盤池建立完成（自動執行）</li>
          <li>點擊 <strong>Spin</strong> 按鈕觸發動畫</li>
          <li>觀察 5 輪依序停輪動畫</li>
          <li>動畫完成後檢查中獎線（如果有）</li>
          <li>驗證盤面與 SpinPacket.board 一致（查看 Console 和下方資訊）</li>
        </ol>
        <h4 style={{ marginTop: '15px' }}>✅ 驗證項目：</h4>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>符號對齊：stopped 狀態顯示的符號與 SpinPacket.board 完全一致</li>
          <li>動畫流暢：spinning → stopping → stopped 無跳躍或消失</li>
          <li>輪帶方向：輪帶向下旋轉（符號從上方進入視野）</li>
          <li>中獎線高亮：正確的符號被高亮</li>
        </ul>
      </div>
    </div>
  );
}

export default App;

