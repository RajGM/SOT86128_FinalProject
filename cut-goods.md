# Cut Goods — Simplification

## Why

Goods is produced by Industrial Complex and Manufacturing but consumed by nothing. No building needs it, no per-capita drain, no effect on happiness or population. It's a number that goes up and can be traded, but the receiver also has no use for it. It's money with an extra name.

## What Changes

### Buildings

**Industrial Complex** — drops goods, becomes pure energy→money converter.

| | Before | After |
|---|---|---|
| T1 yield | +30 money, +15 goods | +35 money |
| T2 yield | +55 money, +30 goods | +65 money |
| T3 yield | +80 money, +50 goods | +95 money |

Slightly increased money yield to compensate for removed goods value.

**Manufacturing** — drops goods, becomes pure energy→technology converter.

| | Before | After |
|---|---|---|
| T1 yield | +20 goods, +3 tech | +5 tech |
| T2 yield | +40 goods, +5 tech | +8 tech |
| T3 yield | +65 goods, +8 tech | +12 tech |

Tech yield increased. Manufacturing's entire purpose is now: **the only source of technology in the game.** Clean and clear.

Rare earth bonus changes: before was +50% goods, +33% tech. Now just **+50% tech** (since goods is gone).

| Manufacturing | Without rare earth | With rare earth (stockpile ≥ 1) |
|---|---|---|
| T1 | +5 tech | +7 tech |
| T2 | +8 tech | +12 tech |
| T3 | +12 tech | +18 tech |

### Resources — 8 → 7

| Keep | Cut |
|------|-----|
| Money | ~~Goods~~ |
| Energy | |
| Food | |
| Population | |
| Happiness | |
| CO₂ | |
| Technology | |

### Trade items — 9 → 8

Remove "goods" from tradeable items list. Remaining:

money, energy, food, fuel, uranium, rare_earth, technology, population

### Files to change

| File | What to do |
|------|-----------|
| `types/game.ts` | Remove `goods` from `TradeItem`, `BuildEffects`, `RegionState`, `ResourceTotals` |
| `config/builds.ts` | Remove `goods` from Industrial Complex and Manufacturing effects. Update yields. |
| `config/builds.ts` | Remove `goods` from `TRADE_ITEMS` array |
| `config/regionProfiles.ts` | Remove `goods` from all 8 country starting resources |
| `lib/gameState.ts` | Remove `goods` from `aggregateResources`, `applyTradeTransfer`, `REGION_EFFECT_KEYS` |
| `lib/buildEconomics.ts` | Remove `goods` from `applyManufacturingRareEarthBonus` (only boost tech now) |
| `lib/buildRules.ts` | Remove `goods` from effect key lists |
| `lib/priorityMap.ts` | Remove any goods-related priority entries |
| `components/ui/ResourcesBar.tsx` | Remove goods row from display |
| `components/ui/ConsequenceTree.tsx` | Remove `goods` from resource key list |
| `components/ui/TradePanel.tsx` | Goods no longer in trade item dropdown |
| `components/ui/TechnologyPanel.tsx` | Update rare earth bonus text (remove goods mention) |

### Summary

Before: Industrial Complex = energy → money + goods. Manufacturing = energy → goods + tech.

After: **Industrial Complex = energy → money. Manufacturing = energy → tech.**

Two buildings, two clear purposes, no overlap.
