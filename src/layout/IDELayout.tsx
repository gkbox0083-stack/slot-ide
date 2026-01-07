import { useEffect } from 'react';
import { Sidebar } from './Sidebar.js';
import { PreviewPanel } from './PreviewPanel.js';
import { Dashboard } from './Dashboard.js';
import { WizardContainer } from '../wizard/index.js';
import { useUIStore } from '../store/index.js';

/**
 * IDELayout 主佈局元件
 * 三欄式結構：左側邊欄 | 中央預覽 | 右側 Wizard
 * 底部：可折疊統計儀表板
 */
export function IDELayout() {
  const { isDarkMode } = useUIStore();

  // 初始化時同步深色模式
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="h-screen flex flex-col bg-surface-100 dark:bg-surface-900 overflow-hidden">
      {/* 主內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側邊欄 */}
        <Sidebar />

        {/* 中間區域：預覽 + 右側 Wizard */}
        <div className="flex-1 flex overflow-hidden">
          {/* 中央預覽面板 */}
          <div className="flex-1 min-w-0">
            <PreviewPanel />
          </div>

          {/* 右側 Wizard 面板 */}
          <div className="w-[420px] shrink-0 bg-white dark:bg-surface-800 border-l border-surface-200 dark:border-surface-700 overflow-hidden">
            <WizardContainer />
          </div>
        </div>
      </div>

      {/* 底部統計儀表板 */}
      <Dashboard />
    </div>
  );
}

