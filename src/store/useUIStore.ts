import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI 狀態
 */
export interface UIState {
  // 深色模式
  isDarkMode: boolean;
  
  // 側邊欄
  isSidebarCollapsed: boolean;
  
  // 底部儀表板
  isDashboardExpanded: boolean;
  
  // 圖表類型
  chartType: 'line' | 'bar' | 'scatter';
  
  // 模態框狀態
  activeModal: string | null;
}

/**
 * UI Actions
 */
export interface UIActions {
  // 深色模式
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  
  // 側邊欄
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // 底部儀表板
  toggleDashboard: () => void;
  setDashboardExpanded: (expanded: boolean) => void;
  
  // 圖表類型
  setChartType: (type: 'line' | 'bar' | 'scatter') => void;
  
  // 模態框
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

/**
 * 初始狀態
 */
const initialState: UIState = {
  isDarkMode: false,
  isSidebarCollapsed: false,
  isDashboardExpanded: false,
  chartType: 'line',
  activeModal: null,
};

/**
 * UI Store
 */
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 深色模式
      toggleDarkMode: () => {
        const newDarkMode = !get().isDarkMode;
        set({ isDarkMode: newDarkMode });
        // 更新 DOM class
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      // 側邊欄
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      // 底部儀表板
      toggleDashboard: () =>
        set((state) => ({ isDashboardExpanded: !state.isDashboardExpanded })),
      setDashboardExpanded: (expanded) => set({ isDashboardExpanded: expanded }),

      // 圖表類型
      setChartType: (type) => set({ chartType: type }),

      // 模態框
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'slot-ide-ui',
      onRehydrateStorage: () => (state) => {
        // 頁面載入時同步 dark mode class
        if (state?.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);

/**
 * 輔助 Hook: 取得當前主題
 */
export const useTheme = () => {
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  return isDarkMode ? 'dark' : 'light';
};

