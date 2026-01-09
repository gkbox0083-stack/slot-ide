import { useState } from 'react';

interface SidebarItem {
    id: string;
    icon: string;
    label: string;
    disabled?: boolean;
}

const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', icon: '📊', label: '儀表板', disabled: true },
    { id: 'analytics', icon: '📈', label: '分析', disabled: true },
    { id: 'templates', icon: '📁', label: '模板', disabled: true },
    { id: 'export', icon: '📤', label: '匯出', disabled: true },
    { id: 'settings', icon: '⚙️', label: '設定', disabled: true },
];

/**
 * 左側 Icon 導航欄
 * 目前為佔位用途，後續追加功能
 */
export function LeftSidebar() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside
            className={`
        flex flex-col bg-surface-900 border-r border-surface-700
        transition-all duration-300 ease-in-out shrink-0
        ${isExpanded ? 'w-48' : 'w-14'}
      `}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo/Brand Area */}
            <div className="h-12 flex items-center justify-center border-b border-surface-700">
                <span className="text-lg">🎯</span>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4">
                <ul className="space-y-1">
                    {sidebarItems.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                disabled={item.disabled}
                                className={`
                  w-full flex items-center gap-3 px-4 py-3
                  text-surface-400 hover:text-surface-200 hover:bg-surface-800
                  transition-colors cursor-not-allowed opacity-50
                `}
                                title={item.disabled ? '即將推出' : item.label}
                            >
                                <span className="text-lg shrink-0">{item.icon}</span>
                                <span
                                    className={`
                    text-sm whitespace-nowrap overflow-hidden
                    transition-opacity duration-200
                    ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
                  `}
                                >
                                    {item.label}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Bottom indicator */}
            <div className="p-4 border-t border-surface-700">
                <div className="flex items-center justify-center">
                    <span className="text-xs text-surface-500">
                        {isExpanded ? '功能開發中...' : '...'}
                    </span>
                </div>
            </div>
        </aside>
    );
}
