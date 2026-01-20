import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome } from '../types/outcome.js';
import type { LinesConfig } from '../types/lines.js';
import type { VisualConfig, AssetsPatch } from '../types/visual.js';
import type { SpinPacket } from '../types/spin-packet.js';
import type { BoardConfig, Board } from '../types/board.js';

/**
 * 遊戲配置狀態（V3 簡化版）
 */
export interface GameConfigState {
  // 遊戲基本資料
  gameName: string;
  baseBet: number;
  balance: number;

  // 盤面配置
  boardConfig: BoardConfig;

  // 符號設定
  symbols: SymbolDefinition[];

  // 賠率設定（V3 簡化版：單一列表）
  outcomes: Outcome[];

  // 線型設定
  linesConfig: LinesConfig;

  // 視覺設定
  visualConfig: VisualConfig;

  // 素材資源
  assets: AssetsPatch;

  // 當前 SpinPacket
  currentSpinPacket: SpinPacket | null;

  // Pool 資料
  pools: Map<string, Board[]>;
  isPoolsBuilt: boolean;
}

/**
 * 遊戲配置 Actions
 */
export interface GameConfigActions {
  // 基本資料
  setGameName: (name: string) => void;
  setBaseBet: (bet: number) => void;
  setBalance: (balance: number) => void;

  // 盤面配置
  setBoardConfig: (config: BoardConfig) => void;

  // 符號設定
  setSymbols: (symbols: SymbolDefinition[]) => void;
  updateSymbol: (symbol: SymbolDefinition) => void;
  addSymbol: (symbol: SymbolDefinition) => void;
  removeSymbol: (id: string) => void;

  // 賠率設定（V3 簡化版）
  setOutcomes: (outcomes: Outcome[]) => void;
  addOutcome: (outcome: Omit<Outcome, 'id'>) => void;
  updateOutcome: (outcome: Outcome) => void;
  removeOutcome: (id: string) => void;

  // 線型設定
  setLinesConfig: (config: LinesConfig) => void;

  // 視覺設定
  setVisualConfig: (config: VisualConfig) => void;
  updateAnimationConfig: (animation: Partial<VisualConfig['animation']>) => void;
  updateLayoutConfig: (layout: Partial<VisualConfig['layout']>) => void;

  // 素材資源
  setAssets: (assets: AssetsPatch) => void;
  setSymbolImage: (symbolId: string, dataUrl: string) => void;
  removeSymbolImage: (symbolId: string) => void;
  setOtherAsset: (key: 'board' | 'frame' | 'background' | 'character', dataUrl: string) => void;
  removeOtherAsset: (key: 'board' | 'frame' | 'background' | 'character') => void;
  clearAllAssets: () => void;

  // SpinPacket
  setCurrentSpinPacket: (packet: SpinPacket | null) => void;

  // Pool 管理
  setPools: (pools: Map<string, Board[]>) => void;
  setIsPoolsBuilt: (isBuilt: boolean) => void;

  // 重置
  resetToDefaults: () => void;

  // 從模板載入配置
  loadFromTemplate: (config: {
    gameName: string;
    baseBet: number;
    boardConfig: BoardConfig;
    symbols: SymbolDefinition[];
    outcomeConfig: Outcome[];
    linesConfig: LinesConfig;
    visualConfig: VisualConfig;
    assets: AssetsPatch;
  }) => void;
}

/**
 * 預設符號列表（V3 簡化版）
 */
export const defaultSymbols: SymbolDefinition[] = [
  // 高分符號
  { id: 'H1', name: '皇冠', type: 'normal', category: 'high', payouts: { match3: 50, match4: 100, match5: 200 }, appearanceWeight: 10, ngWeight: 10, fgWeight: 10 },
  { id: 'H2', name: '鑽石', type: 'normal', category: 'high', payouts: { match3: 40, match4: 80, match5: 160 }, appearanceWeight: 15, ngWeight: 15, fgWeight: 15 },
  { id: 'H3', name: '金幣', type: 'normal', category: 'high', payouts: { match3: 30, match4: 60, match5: 120 }, appearanceWeight: 20, ngWeight: 20, fgWeight: 20 },
  // 低分符號
  { id: 'L1', name: 'A', type: 'normal', category: 'low', payouts: { match3: 10, match4: 20, match5: 40 }, appearanceWeight: 30, ngWeight: 30, fgWeight: 30 },
  { id: 'L2', name: 'K', type: 'normal', category: 'low', payouts: { match3: 8, match4: 16, match5: 32 }, appearanceWeight: 35, ngWeight: 35, fgWeight: 35 },
  { id: 'L3', name: 'Q', type: 'normal', category: 'low', payouts: { match3: 6, match4: 12, match5: 24 }, appearanceWeight: 40, ngWeight: 40, fgWeight: 40 },
  { id: 'L4', name: 'J', type: 'normal', category: 'low', payouts: { match3: 4, match4: 8, match5: 16 }, appearanceWeight: 45, ngWeight: 45, fgWeight: 45 },
  // Wild 符號
  {
    id: 'WILD',
    name: '百搭',
    type: 'wild',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 5,
    ngWeight: 5,
    fgWeight: 15,
    wildConfig: { canReplaceNormal: true, canReplaceSpecial: false }
  },
  // Scatter 符號（V3 直接賦值模式）
  {
    id: 'SCATTER',
    name: '分散',
    type: 'scatter',
    category: 'high',
    payouts: { match3: 0, match4: 0, match5: 0 },
    appearanceWeight: 3,
    ngWeight: 3,
    fgWeight: 5,
    scatterPayoutConfig: {
      minCount: 3,
      payoutByCount: {
        3: 25,   // 3 個 Scatter = 25x bet
        4: 50,   // 4 個 Scatter = 50x bet
        5: 100,  // 5 個 Scatter = 100x bet
      }
    }
  },
];

/**
 * 預設 Outcome 配置（V3 簡化版：單一列表）
 */
export const defaultOutcomes: Outcome[] = [
  { id: 'lose', name: '未中獎', multiplierRange: { min: 0, max: 0 }, weight: 600 },
  { id: 'small', name: '小獎', multiplierRange: { min: 1, max: 10 }, weight: 300 },
  { id: 'medium', name: '中獎', multiplierRange: { min: 11, max: 50 }, weight: 80 },
  { id: 'big', name: '大獎', multiplierRange: { min: 51, max: 200 }, weight: 18 },
  { id: 'jackpot', name: '頭獎', multiplierRange: { min: 201, max: 500 }, weight: 2 },
];

/**
 * 預設線型配置 (20 條線)
 */
export const defaultLinesConfig: LinesConfig = {
  count: 20,
  patterns: [
    { id: 1, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
    { id: 2, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: 3, positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
    { id: 4, positions: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] },
    { id: 5, positions: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]] },
    { id: 6, positions: [[0, 0], [1, 0], [2, 1], [3, 2], [4, 2]] },
    { id: 7, positions: [[0, 2], [1, 2], [2, 1], [3, 0], [4, 0]] },
    { id: 8, positions: [[0, 1], [1, 0], [2, 0], [3, 0], [4, 1]] },
    { id: 9, positions: [[0, 1], [1, 2], [2, 2], [3, 2], [4, 1]] },
    { id: 10, positions: [[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]] },
    { id: 11, positions: [[0, 2], [1, 1], [2, 1], [3, 1], [4, 2]] },
    { id: 12, positions: [[0, 1], [1, 0], [2, 1], [3, 2], [4, 1]] },
    { id: 13, positions: [[0, 1], [1, 2], [2, 1], [3, 0], [4, 1]] },
    { id: 14, positions: [[0, 0], [1, 1], [2, 0], [3, 1], [4, 0]] },
    { id: 15, positions: [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]] },
    { id: 16, positions: [[0, 1], [1, 1], [2, 0], [3, 1], [4, 1]] },
    { id: 17, positions: [[0, 1], [1, 1], [2, 2], [3, 1], [4, 1]] },
    { id: 18, positions: [[0, 0], [1, 0], [2, 1], [3, 0], [4, 0]] },
    { id: 19, positions: [[0, 2], [1, 2], [2, 1], [3, 2], [4, 2]] },
    { id: 20, positions: [[0, 0], [1, 2], [2, 0], [3, 2], [4, 0]] },
  ],
};

/**
 * 預設視覺配置
 */
export const defaultVisualConfig: VisualConfig = {
  animation: {
    spinSpeed: 20,
    spinDuration: 2000,
    reelStopDelay: 200,
    easeStrength: 0.5,
    bounceStrength: 0.3,
  },
  layout: {
    reelGap: 10,
    symbolScale: 1,
    boardScale: 1,
    // 圖層變換預設值
    backgroundTransform: { offsetX: 0, offsetY: 0, scale: 1 },
    boardContainerTransform: { offsetX: 0, offsetY: 0, scale: 1 },
    characterTransform: { offsetX: 0, offsetY: 0, scale: 1 },
  },
};

/**
 * 預設盤面配置
 */
export const defaultBoardConfig: BoardConfig = {
  cols: 5,
  rows: 3,
};

/**
 * 初始狀態
 */
const initialState: GameConfigState = {
  gameName: '我的老虎機',
  baseBet: 1,
  balance: 10000,
  boardConfig: defaultBoardConfig,
  symbols: defaultSymbols,
  outcomes: defaultOutcomes,
  linesConfig: defaultLinesConfig,
  visualConfig: defaultVisualConfig,
  assets: {},
  currentSpinPacket: null,
  pools: new Map(),
  isPoolsBuilt: false,
};

/**
 * 生成唯一 ID
 */
const generateId = () => `outcome_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

/**
 * 遊戲配置 Store（V3 簡化版）
 */
export const useGameConfigStore = create<GameConfigState & GameConfigActions>()(
  persist(
    (set) => ({
      ...initialState,

      // 基本資料
      setGameName: (name) => set({ gameName: name }),
      setBaseBet: (bet) => set({ baseBet: bet }),
      setBalance: (balance) => set({ balance }),

      // 盤面配置
      setBoardConfig: (config) => set({ boardConfig: config }),

      // 符號設定
      setSymbols: (symbols) => set({ symbols }),
      updateSymbol: (symbol) =>
        set((state) => ({
          symbols: state.symbols.map((s) => (s.id === symbol.id ? symbol : s)),
        })),
      addSymbol: (symbol) =>
        set((state) => ({
          symbols: [...state.symbols, symbol],
        })),
      removeSymbol: (id) =>
        set((state) => ({
          symbols: state.symbols.filter((s) => s.id !== id),
        })),

      // 賠率設定（V3 簡化版）
      setOutcomes: (outcomes) => set({ outcomes }),
      addOutcome: (outcome) =>
        set((state) => ({
          outcomes: [...state.outcomes, { ...outcome, id: generateId() }],
        })),
      updateOutcome: (outcome) =>
        set((state) => ({
          outcomes: state.outcomes.map((o) =>
            o.id === outcome.id ? outcome : o
          ),
        })),
      removeOutcome: (id) =>
        set((state) => ({
          outcomes: state.outcomes.filter((o) => o.id !== id),
        })),

      // 線型設定
      setLinesConfig: (config) => set({ linesConfig: config }),

      // 視覺設定
      setVisualConfig: (config) => set({ visualConfig: config }),
      updateAnimationConfig: (animation) =>
        set((state) => ({
          visualConfig: {
            ...state.visualConfig,
            animation: { ...state.visualConfig.animation, ...animation },
          },
        })),
      updateLayoutConfig: (layout) =>
        set((state) => ({
          visualConfig: {
            ...state.visualConfig,
            layout: { ...state.visualConfig.layout, ...layout },
          },
        })),

      // 素材資源
      setAssets: (assets) => set({ assets }),
      setSymbolImage: (symbolId, dataUrl) =>
        set((state) => ({
          assets: {
            ...state.assets,
            symbols: { ...state.assets.symbols, [symbolId]: dataUrl },
          },
        })),
      removeSymbolImage: (symbolId) =>
        set((state) => {
          console.log('[Store] removeSymbolImage', symbolId);
          // Safely access symbols, defaulting to empty object if assets or symbols is undefined
          const symbols = { ...(state.assets?.symbols || {}) };
          delete symbols[symbolId];
          return {
            assets: {
              ...state.assets,
              symbols: Object.keys(symbols).length > 0 ? symbols : undefined,
            },
          };
        }),
      setOtherAsset: (key, dataUrl) =>
        set((state) => ({
          assets: { ...state.assets, [key]: dataUrl },
        })),
      removeOtherAsset: (key) =>
        set((state) => {
          console.log('[Store] removeOtherAsset', key);
          const newAssets = { ...(state.assets || {}) };
          delete newAssets[key];
          return { assets: newAssets };
        }),
      clearAllAssets: () => {
        console.log('[Store] clearAllAssets');
        set({ assets: {} });
      },

      // SpinPacket
      setCurrentSpinPacket: (packet) => set({ currentSpinPacket: packet }),

      // Pool 管理
      setPools: (pools) => set({ pools }),
      setIsPoolsBuilt: (isBuilt) => set({ isPoolsBuilt: isBuilt }),

      // 重置
      resetToDefaults: () => set(initialState),

      // 從模板載入配置
      loadFromTemplate: (config) => set({
        gameName: config.gameName,
        baseBet: config.baseBet,
        boardConfig: config.boardConfig,
        symbols: config.symbols,
        outcomes: config.outcomeConfig,
        linesConfig: config.linesConfig,
        visualConfig: config.visualConfig,
        assets: config.assets,
        pools: new Map(),
        isPoolsBuilt: false,
      }),
    }),
    {
      name: 'slot-ide-game-config-v3', // 新的 storage key 避免衝突
      partialize: (state) => ({
        gameName: state.gameName,
        baseBet: state.baseBet,
        balance: state.balance,
        boardConfig: state.boardConfig,
        symbols: state.symbols,
        outcomes: state.outcomes,
        linesConfig: state.linesConfig,
        visualConfig: state.visualConfig,
        assets: state.assets,
      }),
    }
  )
);
