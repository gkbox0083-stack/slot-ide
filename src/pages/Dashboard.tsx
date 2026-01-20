// src/pages/Dashboard.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useTemplateStore } from '../store/useTemplateStore';
import { useGameConfigStore } from '../store/useGameConfigStore';
import type { Template } from '../types/template';

export function Dashboard() {
    const navigate = useNavigate();
    const { user, status, signIn, signOut } = useAuthStore();
    const {
        templates,
        isLoading,
        error,
        loadTemplates,
        deleteTemplate,
        setCurrentTemplateId,
    } = useTemplateStore();
    const { loadFromTemplate, resetToDefaults } = useGameConfigStore();

    // 載入模板
    useEffect(() => {
        if (status === 'authenticated') {
            loadTemplates();
        }
    }, [status, loadTemplates]);

    // 開啟模板
    const handleOpenTemplate = (template: Template) => {
        loadFromTemplate(template.config);
        setCurrentTemplateId(template.id);
        navigate('/editor');
    };

    // 新建模板
    const handleNewTemplate = () => {
        resetToDefaults();
        setCurrentTemplateId(null);
        navigate('/editor');
    };

    // 刪除模板
    const handleDeleteTemplate = async (id: string, name: string) => {
        if (confirm(`確定要刪除「${name}」嗎？此操作無法復原。`)) {
            await deleteTemplate(id);
        }
    };

    // 未登入狀態
    if (status === 'guest') {
        return (
            <div className="dashboard-page guest">
                <div className="guest-welcome">
                    <h1 className="text-4xl font-bold mb-4">🎰 slot-ide</h1>
                    <p className="text-lg text-surface-400 mb-8">Slot 遊戲數學模型設計工具</p>
                    <button onClick={signIn} className="btn-primary text-lg px-8 py-3 mb-6">
                        🔑 使用 Google 帳號登入
                    </button>
                    <p className="text-surface-500">
                        或 <a href="/editor" className="text-primary-400 hover:text-primary-300 underline">以訪客身份體驗</a>（無法儲存）
                    </p>
                </div>
            </div>
        );
    }

    // 載入中
    if (status === 'loading' || isLoading) {
        return (
            <div className="dashboard-page loading">
                <div className="loading-spinner text-xl">載入中...</div>
            </div>
        );
    }

    // 已登入狀態
    return (
        <div className="dashboard-page">
            {/* Header */}
            <header className="dashboard-header flex items-center justify-between px-6 py-4 border-b border-surface-700">
                <h1 className="text-2xl font-bold">🎰 slot-ide</h1>
                <div className="user-info flex items-center gap-4">
                    {user?.photoURL && (
                        <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full" />
                    )}
                    <span className="text-surface-300">{user?.displayName}</span>
                    <button onClick={signOut} className="btn-secondary text-sm px-3 py-1">登出</button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main p-6">
                {/* Quick Actions */}
                <section className="quick-actions mb-8">
                    <button onClick={handleNewTemplate} className="btn-primary text-lg px-6 py-3">
                        ➕ 新建模板
                    </button>
                </section>

                {/* Error */}
                {error && (
                    <div className="error-banner bg-accent-error/20 text-accent-error px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Recent Templates */}
                <section className="recent-section mb-8">
                    <h2 className="text-xl font-semibold mb-4">最近編輯</h2>
                    {templates.length === 0 ? (
                        <div className="empty-state text-center py-12 bg-surface-800 rounded-lg">
                            <p className="text-lg text-surface-400 mb-2">尚無模板</p>
                            <p className="text-surface-500">點擊上方按鈕建立第一個模板</p>
                        </div>
                    ) : (
                        <div className="template-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {templates.slice(0, 4).map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onOpen={() => handleOpenTemplate(template)}
                                    onDelete={() => handleDeleteTemplate(template.id, template.name)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* All Templates */}
                {templates.length > 4 && (
                    <section className="all-templates-section">
                        <h2 className="text-xl font-semibold mb-4">所有模板 ({templates.length})</h2>
                        <div className="template-list bg-surface-800 rounded-lg divide-y divide-surface-700">
                            {templates.map((template) => (
                                <TemplateListItem
                                    key={template.id}
                                    template={template}
                                    onOpen={() => handleOpenTemplate(template)}
                                    onDelete={() => handleDeleteTemplate(template.id, template.name)}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

/**
 * 模板卡片元件
 */
interface TemplateCardProps {
    template: Template;
    onOpen: () => void;
    onDelete: () => void;
}

function TemplateCard({ template, onOpen, onDelete }: TemplateCardProps) {
    return (
        <div className="template-card bg-surface-800 rounded-lg overflow-hidden border border-surface-700 hover:border-surface-500 transition-colors">
            <div className="card-thumbnail h-32 bg-surface-700 flex items-center justify-center">
                {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="placeholder text-4xl">🎰</div>
                )}
            </div>
            <div className="card-content p-4">
                <h3 className="font-semibold mb-1 truncate">{template.name}</h3>
                <p className="card-date text-sm text-surface-400">
                    更新於 {template.updatedAt.toLocaleDateString()}
                </p>
            </div>
            <div className="card-actions flex gap-2 p-4 pt-0">
                <button onClick={onOpen} className="btn-primary flex-1 text-sm py-1">開啟</button>
                <button onClick={onDelete} className="btn-danger flex-1 text-sm py-1">刪除</button>
            </div>
        </div>
    );
}

/**
 * 模板列表項目元件
 */
interface TemplateListItemProps {
    template: Template;
    onOpen: () => void;
    onDelete: () => void;
}

function TemplateListItem({ template, onOpen, onDelete }: TemplateListItemProps) {
    return (
        <div className="template-list-item flex items-center justify-between px-4 py-3 hover:bg-surface-700/50 transition-colors">
            <span className="item-name font-medium">{template.name}</span>
            <div className="flex items-center gap-4">
                <span className="item-date text-sm text-surface-400">
                    {template.updatedAt.toLocaleDateString()}
                </span>
                <div className="item-actions flex gap-2">
                    <button onClick={onOpen} className="btn-secondary text-sm px-3 py-1">開啟</button>
                    <button onClick={onDelete} className="btn-danger text-sm px-3 py-1">刪除</button>
                </div>
            </div>
        </div>
    );
}
