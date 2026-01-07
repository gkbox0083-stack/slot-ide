import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SymbolDefinition } from '../types/symbol.js';
import type { Outcome, OutcomeConfig } from '../types/outcome.js';
import type { LinesConfig } from '../types/lines.js';
import type { VisualConfig, AssetsPatch } from '../types/visual.js';
import type { SpinPacket } from '../types/spin-packet.js';
import type { BoardConfig, Board } from '../types/board.js';
import type { FreeSpinConfig } from '../types/free-spin.js';

/**
 * 遊戲配置狀態
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
  
  // 賠率設定（NG/FG 分離）
  outcomeConfig: OutcomeConfig;
  
  // 線型設定
  linesConfig: LinesConfig;
  
  // 視覺設定
  visualConfig: VisualConfig;
  
  // Free Spin 設定
  freeSpinConfig: FreeSpinConfig;
  
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
  
  // 賠率設定
  setOutcomeConfig: (config: OutcomeConfig) => void;
  addOutcome: (outcome: Omit<Outcome, 'id'>) => void;
  updateOutcome: (outcome: Outcome) => void;
  removeOutcome: (id: string) => void;
  
  // 線型設定
  setLinesConfig: (config: LinesConfig) => void;
  
  // 視覺設定
  setVisualConfig: (config: VisualConfig) => void;
  updateAnimationConfig: (animation: Partial<VisualConfig['animation']>) => void;
  updateLayoutConfig: (layout: Partial<VisualConfig['layout']>) => void;
  
  // Free Spin 設定
  setFreeSpinConfig: (config: FreeSpinConfig) => void;
  
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
}

/**
 * 預設符號列表（V2 擴展）
 */
const defaultSymbols: SymbolDefinition[] = [
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
  // Scatter 符號
  { 
    id: 'SCATTER', 
    name: '分散', 
    type: 'scatter', 
    category: 'high', 
    payouts: { match3: 0, match4: 0, match5: 0 }, 
    appearanceWeight: 3, 
    ngWeight: 3, 
    fgWeight: 5,
    scatterConfig: { 
      triggerCount: 3, 
      freeSpinCount: 10, 
      enableRetrigger: true, 
      enableMultiplier: true, 
      multiplierValue: 2 
    }
  },
];

/**
 * 預設 Outcome 配置（NG/FG 分離）
 */
const defaultOutcomeConfig: OutcomeConfig = {
  ngOutcomes: [
    { id: 'ng_lose', name: '未中獎', phase: 'ng', multiplierRange: { min: 0, max: 0 }, weight: 600 },
    { id: 'ng_small', name: '小獎', phase: 'ng', multiplierRange: { min: 1, max: 10 }, weight: 300 },
    { id: 'ng_medium', name: '中獎', phase: 'ng', multiplierRange: { min: 11, max: 50 }, weight: 80 },
    { id: 'ng_big', name: '大獎', phase: 'ng', multiplierRange: { min: 51, max: 200 }, weight: 18 },
    { id: 'ng_jackpot', name: '頭獎', phase: 'ng', multiplierRange: { min: 201, max: 500 }, weight: 2 },
  ],
  fgOutcomes: [
    { id: 'fg_lose', name: '未中獎', phase: 'fg', multiplierRange: { min: 0, max: 0 }, weight: 400 },
    { id: 'fg_small', name: '小獎', phase: 'fg', multiplierRange: { min: 1, max: 10 }, weight: 350 },
    { id: 'fg_medium', name: '中獎', phase: 'fg', multiplierRange: { min: 11, max: 50 }, weight: 180 },
    { id: 'fg_big', name: '大獎', phase: 'fg', multiplierRange: { min: 51, max: 200 }, weight: 60 },
    { id: 'fg_jackpot', name: '頭獎', phase: 'fg', multiplierRange: { min: 201, max: 500 }, weight: 10 },
  ],
};

/**
 * 預設線型配置 (20 條線)
 */
const defaultLinesConfig: LinesConfig = {
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
const defaultVisualConfig: VisualConfig = {
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
  },
};

/**
 * 預設 Free Spin 配置
 */
const defaultFreeSpinConfig: FreeSpinConfig = {
  enabled: true,
  triggerCount: 3,
  baseSpinCount: 10,
  enableRetrigger: true,
  retriggerSpinCount: 5,
  enableMultiplier: true,
  multiplierValue: 2,
};

/**
 * 預設盤面配置
 */
const defaultBoardConfig: BoardConfig = {
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
  outcomeConfig: defaultOutcomeConfig,
  linesConfig: defaultLinesConfig,
  visualConfig: defaultVisualConfig,
  freeSpinConfig: defaultFreeSpinConfig,
  assets: {},
  currentSpinPacket: null,
  pools: new Map(),
  isPoolsBuilt: false,
};

/**
 * 生成唯一 ID
 */
const generateId = () => `outcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * 遊戲配置 Store
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

      // 賠率設定
      setOutcomeConfig: (config) => set({ outcomeConfig: config }),
      addOutcome: (outcome) =>
        set((state) => {
          const newOutcome = { ...outcome, id: generateId() };
          if (outcome.phase === 'ng') {
            return {
              outcomeConfig: {
                ...state.outcomeConfig,
                ngOutcomes: [...state.outcomeConfig.ngOutcomes, newOutcome],
              },
            };
          } else {
            return {
              outcomeConfig: {
                ...state.outcomeConfig,
                fgOutcomes: [...state.outcomeConfig.fgOutcomes, newOutcome],
              },
            };
          }
        }),
      updateOutcome: (outcome) =>
        set((state) => {
          if (outcome.phase === 'ng') {
            return {
              outcomeConfig: {
                ...state.outcomeConfig,
                ngOutcomes: state.outcomeConfig.ngOutcomes.map((o) => 
                  o.id === outcome.id ? outcome : o
                ),
              },
            };
          } else {
            return {
              outcomeConfig: {
                ...state.outcomeConfig,
                fgOutcomes: state.outcomeConfig.fgOutcomes.map((o) => 
                  o.id === outcome.id ? outcome : o
                ),
              },
            };
          }
        }),
      removeOutcome: (id) =>
        set((state) => ({
          outcomeConfig: {
            ngOutcomes: state.outcomeConfig.ngOutcomes.filter((o) => o.id !== id),
            fgOutcomes: state.outcomeConfig.fgOutcomes.filter((o) => o.id !== id),
          },
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
        
      // Free Spin 設定
      setFreeSpinConfig: (config) => set({ freeSpinConfig: config }),

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
          const symbols = { ...state.assets.symbols };
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
          const newAssets = { ...state.assets };
          delete newAssets[key];
          return { assets: newAssets };
        }),
      clearAllAssets: () => set({ assets: {} }),

      // SpinPacket
      setCurrentSpinPacket: (packet) => set({ currentSpinPacket: packet }),
      
      // Pool 管理
      setPools: (pools) => set({ pools }),
      setIsPoolsBuilt: (isBuilt) => set({ isPoolsBuilt: isBuilt }),

      // 重置
      resetToDefaults: () => set(initialState),
    }),
    {
      name: 'slot-ide-game-config',
      partialize: (state) => ({
        gameName: state.gameName,
        baseBet: state.baseBet,
        balance: state.balance,
        boardConfig: state.boardConfig,
        symbols: state.symbols,
        outcomeConfig: state.outcomeConfig,
        linesConfig: state.linesConfig,
        visualConfig: state.visualConfig,
        freeSpinConfig: state.freeSpinConfig,
        assets: state.assets,
      }),
    }
  )
);
