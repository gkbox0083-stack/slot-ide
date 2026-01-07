import { useUIStore, useGameConfigStore } from '../store/index.js';

/**
 * Sidebar 左側邊欄
 */
export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar, isDarkMode, toggleDarkMode } = useUIStore();
  const { gameName, resetToDefaults } = useGameConfigStore();

  return (
    <aside
      className={`
        sidebar flex flex-col h-full
        transition-all duration-300
        ${isSidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* 側邊欄標題 */}
      <div className="p-4 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h1 className="text-lg font-bold text-surface-900 dark:text-surface-100">
              slot-ide
            </h1>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            title={isSidebarCollapsed ? '展開側邊欄' : '收合側邊欄'}
          >
            <svg
              className={`w-5 h-5 text-surface-600 dark:text-surface-400 transition-transform duration-300 ${
                isSidebarCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 模板列表區域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isSidebarCollapsed ? (
          <>
            <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
              目前專案
            </h2>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary-500 flex items-center justify-center text-white font-bold">
                  🎰
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-surface-900 dark:text-surface-100 truncate">
                    {gameName}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    進行中
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
                範本
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="w-full p-3 text-left rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <span className="text-sm text-surface-700 dark:text-surface-300">
                      重置為預設值
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <div
              className="w-10 h-10 rounded bg-primary-500 flex items-center justify-center text-white font-bold cursor-pointer"
              title={gameName}
            >
              🎰
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="w-10 h-10 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center justify-center transition-colors"
              title="重置為預設值"
            >
              📋
            </button>
          </div>
        )}
      </div>

      {/* 底部工具區 */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-700">
        {!isSidebarCollapsed ? (
          <div className="space-y-2">
            {/* 深色模式切換 */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              {isDarkMode ? (
                <>
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-surface-700 dark:text-surface-300">淺色模式</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-surface-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  <span className="text-sm text-surface-700 dark:text-surface-300">深色模式</span>
                </>
              )}
            </button>

            {/* 使用者選單 (placeholder) */}
            <button
              type="button"
              className="w-full p-2 flex items-center gap-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <svg className="w-5 h-5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm text-surface-500">登入 (即將推出)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 flex flex-col items-center">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center justify-center transition-colors"
              title={isDarkMode ? '切換至淺色模式' : '切換至深色模式'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-surface-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

