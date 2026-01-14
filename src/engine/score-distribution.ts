/**
 * Score Distribution Estimation Module
 * 
 * 蒙地卡羅抽樣估算符號配置下的分數分布
 * 用於：
 * 1. Symbol Panel 顯示分數分布預覽
 * 2. Outcome Panel 顯示分數覆蓋預警
 */

import type { SymbolDefinition } from '../types/symbol.js';
import type { BoardConfig, Board, SymbolId } from '../types/board.js';
import type { LinesConfig } from '../types/lines.js';
import type { Outcome } from '../types/outcome.js';
import { isWildSymbol, isScatterSymbol, canWildReplace } from './symbol-manager.js';

/**
 * 分數分布結果
 */
export interface ScoreDistribution {
    min: number;
    max: number;
    avg: number;
    stdDev: number;
    sampleSize: number;
    histogram: HistogramBucket[];
    rawScores: number[];  // 用於 Outcome 覆蓋率計算
}

/**
 * 直方圖區間
 */
export interface HistogramBucket {
    rangeStart: number;
    rangeEnd: number;
    count: number;
    percentage: number;
}

/**
 * Outcome 覆蓋狀態
 */
export type CoverageStatus = 'ok' | 'low' | 'none';

/**
 * Outcome 覆蓋資訊
 */
export interface OutcomeCoverage {
    outcomeId: string;
    outcomeName: string;
    minMultiplier: number;
    maxMultiplier: number;
    matchCount: number;       // 落入此區間的盤面數
    percentage: number;       // 百分比
    status: CoverageStatus;   // 狀態
}

/**
 * 估算分數分布（蒙地卡羅抽樣）
 * 
 * @param symbols 符號定義列表
 * @param linesConfig 線路配置
 * @param boardConfig 盤面配置
 * @param sampleSize 抽樣次數（預設 1000）
 */
export function estimateScoreDistribution(
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig,
    boardConfig: BoardConfig,
    sampleSize: number = 1000
): ScoreDistribution {
    const scores: number[] = [];

    // 蒙地卡羅抽樣
    for (let i = 0; i < sampleSize; i++) {
        const board = generateRandomBoard(symbols, boardConfig);
        const score = calculateBoardScore(board, symbols, linesConfig);
        scores.push(score);
    }

    // 統計計算
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // 標準差
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // 建立直方圖（分 10 個區間）
    const histogram = buildHistogram(scores, min, max);

    return {
        min,
        max,
        avg,
        stdDev,
        sampleSize,
        histogram,
        rawScores: scores,
    };
}

/**
 * 計算各 Outcome 的分數覆蓋率
 */
export function calculateOutcomeCoverage(
    distribution: ScoreDistribution,
    outcomes: Outcome[]
): OutcomeCoverage[] {
    return outcomes.map(outcome => {
        const { min, max } = outcome.multiplierRange;

        // 計算落入此區間的分數數量
        const matchCount = distribution.rawScores.filter(
            score => score >= min && score <= max
        ).length;

        const percentage = (matchCount / distribution.sampleSize) * 100;

        // 判斷狀態
        let status: CoverageStatus;
        if (percentage >= 5) {
            status = 'ok';
        } else if (percentage >= 1) {
            status = 'low';
        } else {
            status = 'none';
        }

        return {
            outcomeId: outcome.id,
            outcomeName: outcome.name,
            minMultiplier: min,
            maxMultiplier: max,
            matchCount,
            percentage,
            status,
        };
    });
}

/**
 * P2-12 Phase 2: 實際 Pool RTP 計算結果
 */
export interface ActualPoolRTP {
    ngRTP: number;           // NG 實際 RTP (%)
    fgRTPContribution: number; // FG 貢獻 (%)
    totalRTP: number;        // 總 RTP (%)
    outcomeDetails: {
        outcomeId: string;
        outcomeName: string;
        phase: 'ng' | 'fg';
        weight: number;
        probability: number;   // 權重機率 (%)
        avgScore: number;      // Pool 內盤面的平均分數
        contribution: number;  // 對 RTP 的貢獻 (%)
    }[];
}

/**
 * P2-12 Phase 2: 從 Pool 內容計算實際 RTP
 */
export function calculateActualPoolRTP(
    _pools: { outcomeId: string; outcomeName: string; generated: number }[], // Reserved for future pool validation
    outcomes: Outcome[],
    getPoolBoards: (outcomeId: string) => Board[],
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig
): ActualPoolRTP {
    const outcomeDetails: ActualPoolRTP['outcomeDetails'] = [];

    const ngOutcomes = outcomes.filter(o => o.phase === 'ng');
    const fgOutcomes = outcomes.filter(o => o.phase === 'fg');

    const ngTotalWeight = ngOutcomes.reduce((sum, o) => sum + o.weight, 0);
    const fgTotalWeight = fgOutcomes.reduce((sum, o) => sum + o.weight, 0);

    let ngRTP = 0;
    let fgRTPContribution = 0;

    for (const outcome of outcomes) {
        const boards = getPoolBoards(outcome.id);

        let avgScore: number;
        if (boards.length > 0) {
            const scores = boards.map(board =>
                calculateBoardScore(board, symbols, linesConfig)
            );
            avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        } else {
            avgScore = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
        }

        const isNG = outcome.phase === 'ng';
        const totalWeight = isNG ? ngTotalWeight : fgTotalWeight;
        const probability = totalWeight > 0 ? (outcome.weight / totalWeight) * 100 : 0;
        const contribution = (probability / 100) * avgScore * 100;

        if (isNG) {
            ngRTP += contribution;
        } else {
            fgRTPContribution += contribution;
        }

        outcomeDetails.push({
            outcomeId: outcome.id,
            outcomeName: outcome.name,
            phase: outcome.phase,
            weight: outcome.weight,
            probability,
            avgScore,
            contribution,
        });
    }

    return {
        ngRTP,
        fgRTPContribution,
        totalRTP: ngRTP + fgRTPContribution,
        outcomeDetails,
    };
}

/**
 * 生成均勻分布的隨機盤面
 */
function generateRandomBoard(
    symbols: SymbolDefinition[],
    boardConfig: BoardConfig
): Board {
    const { cols, rows } = boardConfig;
    const reels: SymbolId[][] = [];

    for (let col = 0; col < cols; col++) {
        const reel: SymbolId[] = [];
        for (let row = 0; row < rows; row++) {
            // 均勻分布抽取
            const randomIndex = Math.floor(Math.random() * symbols.length);
            reel.push(symbols[randomIndex].id);
        }
        reels.push(reel);
    }

    return { reels, cols, rows };
}

/**
 * 計算盤面分數（所有線的總分）
 */
function calculateBoardScore(
    board: Board,
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig
): number {
    let totalScore = 0;

    for (const pattern of linesConfig.patterns) {
        const lineResult = calculateLineMatch(board, pattern.positions, symbols);
        if (lineResult) {
            const symbolDef = symbols.find(s => s.id === lineResult.symbol);
            if (symbolDef) {
                totalScore += getPayout(symbolDef, lineResult.count);
            }
        }
    }

    return totalScore;
}

/**
 * 計算一條線的連續符號數（含 Wild 替代）
 */
function calculateLineMatch(
    board: Board,
    positions: [number, number][],
    symbols: SymbolDefinition[]
): { symbol: SymbolId; count: number } | null {
    if (positions.length === 0) return null;

    // 過濾超出範圍的位置
    const validPositions = positions.filter(
        ([col, row]) => col < board.cols && row < board.rows
    );

    if (validPositions.length < 3) return null;

    const getSymbolDef = (id: SymbolId) => symbols.find(s => s.id === id);

    // 取得線上符號
    const lineSymbols: SymbolId[] = validPositions.map(
        ([col, row]) => board.reels[col][row]
    );

    // 找目標符號（第一個非 Wild、非 Scatter）
    let targetId: SymbolId | null = null;
    let targetDef = null;

    for (const id of lineSymbols) {
        const def = getSymbolDef(id);
        if (def && !isWildSymbol(def) && !isScatterSymbol(def)) {
            targetId = id;
            targetDef = def;
            break;
        }
    }

    if (!targetId || !targetDef) return null;

    // 從左到右計算連續數
    let count = 0;
    for (const currentId of lineSymbols) {
        const currentDef = getSymbolDef(currentId);
        if (!currentDef) break;

        if (currentId === targetId) {
            count++;
        } else if (isWildSymbol(currentDef) && canWildReplace(currentDef, targetDef)) {
            count++;
        } else {
            break;
        }
    }

    return count >= 3 ? { symbol: targetId, count } : null;
}

/**
 * 取得符號分數
 */
function getPayout(symbol: SymbolDefinition, matchCount: number): number {
    if (matchCount === 3) return symbol.payouts.match3;
    if (matchCount === 4) return symbol.payouts.match4;
    if (matchCount === 5) return symbol.payouts.match5;
    return 0;
}

/**
 * 建立直方圖
 */
function buildHistogram(
    scores: number[],
    min: number,
    max: number,
    bucketCount: number = 10
): HistogramBucket[] {
    // 處理 min === max 的情況
    if (min === max) {
        return [{
            rangeStart: min,
            rangeEnd: max,
            count: scores.length,
            percentage: 100,
        }];
    }

    const bucketSize = (max - min) / bucketCount;
    const buckets: HistogramBucket[] = [];

    for (let i = 0; i < bucketCount; i++) {
        const rangeStart = min + i * bucketSize;
        const rangeEnd = min + (i + 1) * bucketSize;
        const count = scores.filter(
            s => s >= rangeStart && (i === bucketCount - 1 ? s <= rangeEnd : s < rangeEnd)
        ).length;

        buckets.push({
            rangeStart: Math.round(rangeStart * 10) / 10,
            rangeEnd: Math.round(rangeEnd * 10) / 10,
            count,
            percentage: (count / scores.length) * 100,
        });
    }

    return buckets;
}
