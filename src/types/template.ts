// src/types/template.ts

import type { SymbolDefinition } from './symbol';
import type { OutcomeConfig } from './outcome';
import type { LinesConfig } from './lines';
import type { VisualConfig, AssetsPatch } from './visual';
import type { BoardConfig } from './board';

/**
 * 模板介面
 * 用於儲存用戶的遊戲配置模板
 */
export interface Template {
    id: string;
    userId: string;
    name: string;
    description?: string;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
    config: {
        gameName: string;
        baseBet: number;
        boardConfig: BoardConfig;
        symbols: SymbolDefinition[];
        outcomeConfig: OutcomeConfig;
        linesConfig: LinesConfig;
        visualConfig: VisualConfig;
        assets: AssetsPatch;
    };
}

/**
 * 模板輸入介面（不含自動生成欄位）
 */
export type TemplateInput = Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
