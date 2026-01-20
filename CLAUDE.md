# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build
```

No test runner or linter is configured. Type checking is performed via `tsc` during build.

## Required Reading

Before starting any task, read these files in order:
1. **AI_GUIDE.md** — Project guide and lessons learned (V3)
2. **README_ARCHITECTURE.md** — Architecture spec (the "north star" for all design decisions)
3. **.cursorrules** — Behavioral constraints
4. **prompts/** — Task specifications (check README.md for current status)

## Architecture Overview

**slot-ide** is a single-page Slot IDE with built-in Runtime Renderer for slot machine game designers and math verification.

### Data Flow (Unidirectional)
```
IDE UI (user input)
    ↓ parameters
Math Engine (generates result)
    ↓ SpinPacket v3
Runtime Renderer (plays animation)
```

### Module Responsibilities

| Module | Purpose | Restrictions |
|--------|---------|--------------|
| **src/engine/** | Math: board generation (uniform distribution), settlement, pool building, RTP | No UI, no animation |
| **src/runtime/** | Animation: renders SpinPacket, plays reels using appearanceWeight | No RNG, no logic generation |
| **src/ide/** | UI: parameter collection, triggers actions | No direct engine/runtime state modification |
| **src/analytics/** | Stats: calls engine repeatedly, exports CSV | No custom spin logic |
| **src/store/** | Zustand state management | Single source of truth |
| **src/types/** | Type definitions (contract layer) | SpinPacket is the only data contract |

### Key Concepts

**SpinPacket v3** is the universal data contract between all modules:
```typescript
interface SpinPacket {
  version: '2' | '3';
  board: Board;              // 5x3 or 5x4
  visual: VisualConfig;      // Animation parameters
  assets?: AssetsPatch;      // Asset overrides
  meta?: SettlementMeta;     // Settlement info (win, lines, scatterPayout)
  isDemo?: boolean;          // Demo mode flag
}
```

**V3 Simplification (Current):**
- Free Spin mechanism removed — Scatter now gives direct payout
- NG/FG separation removed — Single Outcome list
- Pool generation uses uniform distribution (symbol weights don't affect math)

**Dual-Layer Probability Model:**
- Math layer (affects RTP): Outcome weights, Scatter payout table — Pool uses **uniform distribution**
- Visual layer (no RTP impact): `appearanceWeight` — used only for reel scrolling animation
- `ngWeight`/`fgWeight` are **@deprecated** — kept for backward compatibility only

## Architectural Red Lines

These are non-negotiable constraints:

1. **No second Vite app** — Single SPA only
2. **No iframe/postMessage** — No cross-window communication
3. **No second RNG** — Runtime must not generate random values
4. **No second data contract** — SpinPacket is the only interface
5. **No Wild logic outside settlement.ts** — This is the single authority
6. **No symbol weights in Pool generation** — Must use uniform distribution
7. **No Free Spin reintroduction** — V3 removed this, use Scatter direct payout
8. **No "temporary solutions"** — No "fix later" designs

## Development Workflow

1. Read task specification from `prompts/`
2. Reference README_ARCHITECTURE.md for any spec conflicts
3. Make focused, minimal changes (single responsibility per commit)
4. Run `npm run build` to verify
5. Check against P0 Gate before committing

## P0 Gate Checklist (Before Every Commit)

1. Change conforms to architecture spec?
2. No duplicate logic/RNG introduced?
3. Diff is minimal and focused?
4. Only specified file ranges modified?
5. `npm run build` succeeds?
6. No stray `any` types or `TODO` comments?

If any check fails: stop, report the issue, wait for human decision.

## Project Status

- **P1/P2**: Completed (V3 simplified version)
- **P3**: Not started (Firebase/Auth/Cloud features)
- **P4**: Not started (Advanced features)

Check `prompts/README.md` for detailed task status. Some P1/P2 tasks are marked deprecated due to V3 simplification.
