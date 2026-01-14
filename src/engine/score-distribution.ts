/**
 * Score Distribution Estimation Module（V3 簡化版）
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
    rawScores: number[];
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
    matchCount: number;
    percentage: number;
    status: CoverageStatus;
}

/**
 * 估算分數分布（蒙地卡羅抽樣）V3 支援 Scatter 直接賦值
 */
export function estimateScoreDistribution(
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig,
    boardConfig: BoardConfig,
    sampleSize: number = 1000
): ScoreDistribution {
    const scores: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
        const board = generateRandomBoard(symbols, boardConfig);
        const score = calculateBoardScore(board, symbols, linesConfig);
        scores.push(score);
    }

    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

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

        const matchCount = distribution.rawScores.filter(
            score => score >= min && score <= max
        ).length;

        const percentage = (matchCount / distribution.sampleSize) * 100;

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
 * 實際 Pool RTP 計算結果（V3 簡化版）
 */
export interface ActualPoolRTP {
    lineRTP: number;          // 連線 RTP (%)
    scatterRTP: number;       // Scatter RTP (%)
    totalRTP: number;         // 總 RTP (%)
    outcomeDetails: {
        outcomeId: string;
        outcomeName: string;
        weight: number;
        probability: number;
        avgScore: number;
        contribution: number;
    }[];
}

/**
 * 從 Pool 內容計算實際 RTP（V3 簡化版）
 */
export function calculateActualPoolRTP(
    _pools: { outcomeId: string; outcomeName: string; generated: number }[],
    outcomes: Outcome[],
    getPoolBoards: (outcomeId: string) => Board[],
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig
): ActualPoolRTP {
    const outcomeDetails: ActualPoolRTP['outcomeDetails'] = [];

    const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);

    let lineRTP = 0;
    let scatterRTP = 0;

    for (const outcome of outcomes) {
        const boards = getPoolBoards(outcome.id);

        let avgScore: number;
        let avgScatterScore: number = 0;

        if (boards.length > 0) {
            const results = boards.map(board => {
                const lineScore = calculateLineScore(board, symbols, linesConfig);
                const scatterScore = calculateScatterScore(board, symbols);
                return { lineScore, scatterScore };
            });
            avgScore = results.reduce((a, b) => a + b.lineScore, 0) / results.length;
            avgScatterScore = results.reduce((a, b) => a + b.scatterScore, 0) / results.length;
        } else {
            avgScore = (outcome.multiplierRange.min + outcome.multiplierRange.max) / 2;
        }

        const probability = totalWeight > 0 ? (outcome.weight / totalWeight) * 100 : 0;
        const lineContribution = (probability / 100) * avgScore * 100;
        const scatterContribution = (probability / 100) * avgScatterScore * 100;

        lineRTP += lineContribution;
        scatterRTP += scatterContribution;

        outcomeDetails.push({
            outcomeId: outcome.id,
            outcomeName: outcome.name,
            weight: outcome.weight,
            probability,
            avgScore: avgScore + avgScatterScore,
            contribution: lineContribution + scatterContribution,
        });
    }

    return {
        lineRTP,
        scatterRTP,
        totalRTP: lineRTP + scatterRTP,
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
            const randomIndex = Math.floor(Math.random() * symbols.length);
            reel.push(symbols[randomIndex].id);
        }
        reels.push(reel);
    }

    return { reels, cols, rows };
}

/**
 * 計算盤面分數（連線 + Scatter）
 */
function calculateBoardScore(
    board: Board,
    symbols: SymbolDefinition[],
    linesConfig: LinesConfig
): number {
    return calculateLineScore(board, symbols, linesConfig) + calculateScatterScore(board, symbols);
}

/**
 * 計算連線分數
 */
function calculateLineScore(
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
 * 計算 Scatter 直接賦值分數（V3 新增）
 */
function calculateScatterScore(board: Board, symbols: SymbolDefinition[]): number {
    const scatterSymbol = symbols.find(s => s.scatterPayoutConfig);
    if (!scatterSymbol?.scatterPayoutConfig) return 0;

    const config = scatterSymbol.scatterPayoutConfig;
    let count = 0;

    for (const reel of board.reels) {
        for (const id of reel) {
            if (id === scatterSymbol.id) {
                count++;
            }
        }
    }

    if (count >= config.minCount) {
        return config.payoutByCount[count] ?? 0;
    }

    return 0;
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

    const validPositions = positions.filter(
        ([col, row]) => col < board.cols && row < board.rows
    );

    if (validPositions.length < 3) return null;

    const getSymbolDef = (id: SymbolId) => symbols.find(s => s.id === id);

    const lineSymbols: SymbolId[] = validPositions.map(
        ([col, row]) => board.reels[col][row]
    );

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
