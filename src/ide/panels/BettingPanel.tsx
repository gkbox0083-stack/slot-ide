import { useState } from 'react';
import { useGameConfigStore } from '../../store/useGameConfigStore.js';

const BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

/**
 * Betting 面板
 * 顯示投注設定、餘額、最近獲勝紀錄
 */
export function BettingPanel() {
  const { baseBet, setBaseBet, balance, setBalance, currentSpinPacket } = useGameConfigStore();
  const [recentWins, setRecentWins] = useState<Array<{ spin: number; amount: number }>>([]);

  // 處理自訂投注金額
  const handleCustomBet = (value: string) => {
    const amount = parseInt(value);
    if (!isNaN(amount) && amount > 0 && amount <= 1000) {
      setBaseBet(amount);
    }
  };

  // 取得最後一次獲勝金額
  const lastWin = currentSpinPacket?.meta?.win || 0;

  return (
    <div className="space-y-4 p-4">
      {/* Bet Amount */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          💰 投注金額
        </h4>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => setBaseBet(amount)}
              className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                baseBet === amount
                  ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                  : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-400">自訂:</span>
          <input
            type="number"
            value={baseBet}
            onChange={(e) => handleCustomBet(e.target.value)}
            className="flex-1 px-3 py-2 bg-surface-900 border border-surface-700 rounded text-sm text-surface-100"
            min={1}
            max={1000}
          />
        </div>
        <div className="mt-3 p-2 bg-surface-900 rounded text-center">
          <span className="text-surface-400 text-sm">當前投注: </span>
          <span className="text-xl font-bold text-green-400">${baseBet}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          💳 餘額
        </h4>
        <div className="text-3xl font-bold text-center text-white mb-3">
          ${balance.toLocaleString()}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setBalance(balance + 1000)}
            className="py-2 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            +$1,000
          </button>
          <button
            onClick={() => setBalance(balance + 5000)}
            className="py-2 bg-green-700 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            +$5,000
          </button>
          <button
            onClick={() => setBalance(10000)}
            className="py-2 bg-surface-700 text-surface-300 text-sm rounded hover:bg-surface-600 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Last Win */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          🏆 最後獲勝
        </h4>
        <div className={`text-4xl font-bold text-center py-4 rounded-lg ${
          lastWin > 0 
            ? 'text-yellow-400 bg-yellow-900/30' 
            : 'text-surface-500 bg-surface-900'
        }`}>
          {lastWin > 0 ? `+$${lastWin.toLocaleString()}` : '$0'}
        </div>
      </div>

      {/* Recent Wins */}
      <div className="bg-surface-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-surface-300 mb-3 flex items-center gap-2">
          📜 近期紀錄
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {recentWins.length === 0 ? (
            <p className="text-surface-500 text-sm text-center py-4">尚無紀錄</p>
          ) : (
            recentWins.map((win, index) => (
              <div 
                key={`${win.spin}-${index}`}
                className={`flex justify-between items-center p-2 rounded ${
                  win.amount >= 0 
                    ? 'bg-green-900/20 text-green-400' 
                    : 'bg-red-900/20 text-red-400'
                }`}
              >
                <span className="text-sm">Spin #{win.spin}</span>
                <span className="font-semibold">
                  {win.amount >= 0 ? '+' : ''}{win.amount}
                </span>
              </div>
            ))
          )}
        </div>
        {recentWins.length > 0 && (
          <button
            onClick={() => setRecentWins([])}
            className="w-full mt-2 py-2 bg-surface-700 text-surface-300 text-sm rounded hover:bg-surface-600 transition-colors"
          >
            清除紀錄
          </button>
        )}
      </div>
    </div>
  );
}

