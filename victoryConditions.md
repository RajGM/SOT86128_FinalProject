# Victory Conditions — Pioneer/Laggard Gap Score

Based on: Liefferink, Arts, Kamstra & Ooijevaar, "Leaders and Laggards in Environmental Policy: A Quantitative Analysis of Domestic Policy Outputs" (JEPP, 2009). Same framework as the in-game comparison dashboard.

The victory model IS the dashboard model. No separate scoring system — the tool students use to analyze each other during the game is the same tool that determines the winner. This reinforces the module's ILO: "evaluate environmental policy outcomes from a comparative perspective."

---

## When Does the Game End?

No fixed turn limit. The game ends when humans decide (see multiplayerLobby.md):

1. **Host ends** — immediate
2. **Vote to end** — majority of human players
3. **All humans leave** — 3-minute grace, then archive

There is no "you reached turn X" auto-end. The game can run 10 cycles or 50. This is deliberate — real climate politics has no finish line. The question is always "how are we doing right now?"

---

## Final Score Calculation

When the game ends, every country (human and bot) is scored using the **6-metric composite gap score** from the comparison dashboard (comparisonDashboard.md).

### The 6 Metrics

Each metric is normalized to 0–1 where 0 = best performer (pioneer) and 1 = worst performer (laggard).

| # | Metric | What it measures | Pioneer = | Laggard = |
|---|--------|-----------------|-----------|-----------|
| 1 | CO₂ per capita | Emission efficiency | Lowest CO₂/pop | Highest CO₂/pop |
| 2 | Green energy ratio | Energy transition | Most green/nuclear vs fossil | All fossil |
| 3 | Carbon tax level | Policy ambition | Highest tax rate | Zero tax |
| 4 | CO₂ trend | Direction of change | Biggest decrease | Biggest increase |
| 5 | Summit voting record | International cooperation | Highest YES vote % | Lowest YES vote % |
| 6 | Climate finance given | North-South solidarity | Most money+tech sent to developing countries | Zero contribution |

### Normalization (per metric)

```
gap = (value - best) / (worst - best)
```

Where `best` and `worst` are the actual values across all 8 countries at game end. If best = worst (everyone identical), gap = 0 for all.

### Composite Score

```
composite_gap = (gap₁ + gap₂ + gap₃ + gap₄ + gap₅ + gap₆) / 6
```

Equal weights. No arbitrary weighting needed — the gap approach is self-calibrating (Liefferink et al. do not weight dimensions; distance from best on each dimension is the measurement itself).

Final score displayed as **0–100** for readability:

```
display_score = (1 - composite_gap) × 100
```

100 = perfect pioneer on all metrics. 0 = worst laggard on all metrics.

---

## Rankings & Awards

### Top 3

| Place | Award | Criteria |
|-------|-------|----------|
| 1st | **Climate Pioneer** | Highest display score |
| 2nd | **Green Leader** | Second highest |
| 3rd | **Sustainable Achiever** | Third highest |

### All 8 Countries Get a Badge

| Score Range | Badge | Color |
|-------------|-------|-------|
| 75–100 | Pioneer | Green |
| 50–74 | Progressive | Blue |
| 25–49 | Laggard | Orange |
| 0–24 | Climate Blocker | Red |

### Special Awards (optional, fun)

Awarded based on specific achievements regardless of overall rank:

| Award | Criteria | Why it matters |
|-------|----------|---------------|
| **Biggest Turnaround** | Largest improvement in composite gap between first half and second half of game | Rewards late policy change — mirrors real-world laggard-to-pioneer transitions |
| **Climate Diplomat** | Most YES votes on summit resolutions + most climate finance given | Cooperation over competition |
| **People's Champion** | Highest average happiness across all cycles | Domestic wellbeing focus |
| **Green Industrialist** | Highest technology AND lowest CO₂ per capita | Proves green growth is possible |
| **Fossil Trap Victim** | Most fossil plants AND lowest happiness at game end | Cautionary tale — demonstrates the tragedy of the commons |

Special awards are cosmetic. Only the composite gap score determines the Top 3.

---

## Game-End Screen

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🌍 GAME OVER — Cycle 22                      │
│                    Final Temperature: +2.3°C                    │
│                                                                 │
│  ═══════════════════════════════════════════════════════════     │
│                                                                 │
│  🥇  EU (alice)           Score: 87    CLIMATE PIONEER          │
│  🥈  LatAm (rajgm)       Score: 74    GREEN LEADER              │
│  🥉  India (carol)        Score: 61    SUSTAINABLE ACHIEVER      │
│                                                                 │
│  ═══════════════════════════════════════════════════════════     │
│                                                                 │
│   #   Country    Player   Score  CO₂/cap  Green%  Tax  Badge    │
│   1   EU         alice     87    0.91     80%     45   Pioneer  │
│   2   LatAm      rajgm    74    0.19     67%     30   Progres. │
│   3   India      carol     61    0.15     50%     20   Progres. │
│   4   China      bob       52    0.87     40%     25   Progres. │
│   5   Africa     (bot)     44    0.09     33%     15   Laggard  │
│   6   USA        (bot)     38    2.18     25%     10   Laggard  │
│   7   Russia     (bot)     19    2.06     0%      0    Blocker  │
│   8   OPEC       (bot)     12    1.50     0%      0    Blocker  │
│                                                                 │
│  ── Special Awards ──                                           │
│  🔄 Biggest Turnaround: China (gap improved 0.35 → 0.48)       │
│  🤝 Climate Diplomat: EU (83% YES votes, 35 finance)           │
│  😊 People's Champion: LatAm (avg happiness 68)                │
│                                                                 │
│  ── Your Journey ──                                             │
│  [Historical gap trend chart — line graph, all 8 countries]     │
│                                                                 │
│  ── Radar Chart ──                                              │
│  [Spider chart: your 6 metrics vs the winner]                   │
│                                                                 │
│              [ Return to Menu ]                                 │
│                                                                 │
│  Game archived. Results saved.                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Screen Sections

1. **Header** — cycle count, final global temperature
2. **Podium** — top 3 with display names and awards
3. **Full rankings table** — all 8 countries, score, key metrics, badge
4. **Special awards** — 2–3 awarded per game (not all trigger every game)
5. **Historical trend chart** — composite gap over all cycles (from dashboard Section 3)
6. **Radar chart** — your country's 6-metric profile vs the winner (from dashboard Section 2)
7. **Return to menu** — after viewing, player returns to landing page

---

## Tie-Breaking

If two countries have identical composite gap scores (unlikely but possible):

1. **Lower CO₂ per capita wins** — environmental outcome is the ultimate tiebreaker
2. If still tied: **higher happiness wins** — domestic wellbeing
3. If still tied: **earlier cycle of peak green ratio wins** — who transitioned first

---

## Why No Economic Victory

Money, population, and military-style "domination" are deliberately excluded from victory scoring. Reasons:

1. **Module alignment** — the course evaluates environmental policy outcomes, not GDP. A country that gets rich by polluting is not a "winner" in environmental politics.

2. **Doughnut Economics** — Raworth's framework (used in our summit system) argues that economic growth beyond the social foundation ceiling is not progress if it breaches planetary boundaries.

3. **Game design** — if money = victory, optimal play is "build fossil, ignore climate, hoard cash." That's the tragedy of the commons. The scoring must reward the opposite: collective environmental action with economic sustainability.

4. **Economic health is embedded** — you need money to build green infrastructure, fund climate finance, and maintain happiness. A broke country can't score well on carbon tax (no revenue) or climate finance (nothing to give). Economy is a means, not an end.

---

## Why Equal Weights

Liefferink et al. (2009) explicitly avoid weighting dimensions. Their argument: the gap from the pioneer is meaningful on each dimension independently. Weighting implies a value judgment about which environmental policy dimension matters more — the whole point of comparative analysis is to assess performance across multiple dimensions without collapsing them prematurely.

Equal weights also prevent gaming. If players know CO₂ is weighted 50%, they focus only on CO₂ and ignore cooperation. Equal weights force balanced strategy — exactly the multi-dimensional thinking the module teaches.

---

## Data Requirements

All data already tracked by existing specs:

| Data | Source |
|------|--------|
| CO₂ per country per cycle | `region.co2` (v1_complete.md) |
| Population | `region.population` |
| Buildings by type | `tileBuildings` |
| Carbon tax rate | `carbonTaxRate` (carbonTax.md) |
| Previous cycle CO₂ | `previousCycleCo2` (comparisonDashboard.md) |
| Summit votes | `summitVotes` (summitResolutions.md) |
| Climate finance ledger | `climateFinanceGiven` (carbonTax.md) |
| Happiness per cycle | `region.happiness` |

No new data needed. Victory conditions consume the same data the dashboard already displays.

---

## Academic Sources

- Liefferink, D., Arts, B., Kamstra, J. & Ooijevaar, J. (2009) "Leaders and Laggards in Environmental Policy: A Quantitative Analysis of Domestic Policy Outputs." *Journal of European Public Policy*, 16(5), pp. 677–700.
- Holzinger, K. & Sommerer, T. (2012) "Was verursacht die Aufwärtsspirale in der Umweltpolitik?" *Österreichische Zeitschrift für Politikwissenschaft*, 41(1), pp. 53–72. (Module reading list)
- Raworth, K. (2017) *Doughnut Economics: Seven Ways to Think Like a 21st-Century Economist*. Random House. (Economic growth ≠ progress if boundaries breached)
- Jänicke, M. & Weidner, H. (1995) *Successful Environmental Policy: A Critical Evaluation of 24 Cases*. Berlin. (Module reading list — success = environmental outcome, not economic output)
