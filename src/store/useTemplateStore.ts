// src/store/useTemplateStore.ts

import { create } from 'zustand';
import type { Template, TemplateInput } from '../types/template';
import * as firestore from '../firebase/firestore';
import { useAuthStore } from './useAuthStore';

interface TemplateState {
    templates: Template[];
    currentTemplateId: string | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
}

interface TemplateActions {
    loadTemplates: () => Promise<void>;
    loadTemplate: (id: string) => Promise<Template | null>;
    saveTemplate: (input: TemplateInput) => Promise<Template | null>;
    updateTemplate: (id: string, input: Partial<TemplateInput>) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    setCurrentTemplateId: (id: string | null) => void;
    clearError: () => void;
}

const initialState: TemplateState = {
    templates: [],
    currentTemplateId: null,
    isLoading: false,
    isSaving: false,
    error: null,
};

export const useTemplateStore = create<TemplateState & TemplateActions>()(
    (set) => ({
        ...initialState,

        loadTemplates: async () => {
            const user = useAuthStore.getState().user;
            if (!user) {
                set({ error: '請先登入' });
                return;
            }

            set({ isLoading: true, error: null });

            try {
                const templates = await firestore.getTemplatesByUser(user.uid);
                set({ templates, isLoading: false });
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入失敗';
                set({ error: message, isLoading: false });
            }
        },

        loadTemplate: async (id) => {
            set({ isLoading: true, error: null });

            try {
                const template = await firestore.getTemplateById(id);
                set({ isLoading: false, currentTemplateId: id });
                return template;
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入失敗';
                set({ error: message, isLoading: false });
                return null;
            }
        },

        saveTemplate: async (input) => {
            const user = useAuthStore.getState().user;
            if (!user) {
                set({ error: '請先登入' });
                return null;
            }

            set({ isSaving: true, error: null });

            try {
                const template = await firestore.createTemplate(user.uid, input);
                set((state) => ({
                    templates: [template, ...state.templates],
                    isSaving: false,
                    currentTemplateId: template.id,
                }));
                return template;
            } catch (error) {
                const message = error instanceof Error ? error.message : '儲存失敗';
                set({ error: message, isSaving: false });
                return null;
            }
        },

        updateTemplate: async (id, input) => {
            set({ isSaving: true, error: null });

            try {
                await firestore.updateTemplate(id, input);

                set((state) => ({
                    templates: state.templates.map((t) =>
                        t.id === id
                            ? { ...t, ...input, updatedAt: new Date() }
                            : t
                    ),
                    isSaving: false,
                }));
            } catch (error) {
                const message = error instanceof Error ? error.message : '更新失敗';
                set({ error: message, isSaving: false });
            }
        },

        deleteTemplate: async (id) => {
            set({ isLoading: true, error: null });

            try {
                await firestore.deleteTemplate(id);

                set((state) => ({
                    templates: state.templates.filter((t) => t.id !== id),
                    currentTemplateId: state.currentTemplateId === id ? null : state.currentTemplateId,
                    isLoading: false,
                }));
            } catch (error) {
                const message = error instanceof Error ? error.message : '刪除失敗';
                set({ error: message, isLoading: false });
            }
        },

        setCurrentTemplateId: (id) => set({ currentTemplateId: id }),
        clearError: () => set({ error: null }),
    })
);
