# Comparison Dashboard — Pioneer/Laggard Gap Approach

Based on: Liefferink, Arts, Kamstra & Ooijevaar, "Leaders and Laggards in Environmental Policy: A Quantitative Analysis of Domestic Policy Outputs" (Journal of European Public Policy, 2009). From the module reading list (Holzinger & Sommerer use the same framework).

---

## Core Concept

The **gap approach** measures the distance between each country's current performance and the **strictest/best policy available** in the game at that moment. No fixed benchmark — the pioneer IS the benchmark, and it shifts dynamically as players act.

A country qualifies as **pioneer** by either:
1. Being the first to introduce a policy innovation (e.g., first to set carbon tax > 50)
2. Exhibiting the highest level of ambition (e.g., strictest standard, lowest emissions)

A country is a **laggard** when its gap from the pioneer is largest across metrics.

Key finding from the literature: rankings are not static. Pioneers can become laggards through inaction. Laggards can catch up through policy convergence. The dashboard must show this dynamically.

---

## Metrics (6 indicators)

Each metric is normalized to 0–1 where 0 = pioneer (best) and 1 = laggard (worst).

### 1. CO₂ Per Capita

```
value = country.co2 / country.population
best = min(all countries' co2/population)
gap = (value - best) / (worst - best)
```

Why per capita: absolute CO₂ favors small countries. Per capita is the standard fairness measure in climate negotiations (India's core argument at every COP).

Game data: `region.co2` and `region.population` — already tracked.

### 2. Green Energy Ratio

```
green_buildings = count of green_plant + nuclear_plant for country
total_energy_buildings = count of green_plant + nuclear_plant + fossil_plant for country
value = green_buildings / max(total_energy_buildings, 1)
best = max(all countries' ratios)
gap = (best - value) / (best - worst)
```

Measures energy transition progress. A country with 3 green plants and 0 fossil = ratio 1.0 (pioneer). A country with 0 green and 3 fossil = ratio 0.0 (laggard).

Game data: `tileBuildings` filtered by type and country — already tracked.

### 3. Carbon Tax Level

```
value = country.carbonTax (0–100)
best = max(all countries' carbon tax)
gap = (best - value) / max(best, 1)
```

Direct policy output. The country with the highest carbon tax sets the benchmark.

Game data: carbon tax slider — **not yet implemented**, part of politics layer.

### 4. CO₂ Trend (direction of change)

```
value = country.co2_this_cycle - country.co2_last_cycle
best = min(all countries' trends)  // most negative = biggest decrease
gap = (value - best) / (worst - best)
```

Rewards countries that are actively reducing emissions, even if their absolute level is still high. A country dropping from 500 to 400 scores better than one sitting at 100 unchanged.

Game data: compare `region.co2` between cycles — need to store `previousCycleCo2` per country.

### 5. Summit Voting Record

```
value = country.yesVotes / max(country.totalVotes, 1)
best = max(all countries' yes%)
gap = (best - value) / max(best - worst, 1)
```

Measures international cooperation. Countries that consistently vote YES on climate resolutions score higher. Abstentions count as 0.5.

Game data: summit voting — **not yet implemented**, part of politics layer.

### 6. Climate Finance Given

```
value = total money + technology traded TO countries with lower tech/money
best = max(all countries' climate finance)
gap = (best - value) / max(best, 1)
```

Measures whether rich countries help developing ones. Tracks cumulative money and technology sent to countries that had lower starting resources. Only counts outgoing transfers to poorer countries — not trades where you received equal value back.

Game data: `tradeAgreements` — already tracked, but need to filter for aid-like transfers vs equal-value trades. Simplification: count all tech and money sent to countries with starting money < 40 (India, LatAm, Africa).

---

## Composite Gap Score

```
composite = (gap_co2_percapita + gap_green_ratio + gap_carbon_tax + gap_co2_trend + gap_summit_votes + gap_climate_finance) / 6
```

All metrics equally weighted. No need for CCPI-style weighting — the gap approach is self-calibrating by definition (Liefferink et al. don't weight; they measure distance from best on each dimension independently).

| Composite gap | Label |
|---------------|-------|
| Bottom 2 (lowest gap) | **Pioneer** |
| Middle 4 | **Middle** |
| Top 2 (highest gap) | **Laggard** |

---

## Dashboard UI

### Access

Always-visible button at bottom-right corner of the game screen. Opens as a modal overlay. Any player can view anytime — all data is public. Close with X or click outside.

### Layout

Three sections inside the modal:

#### Section 1: Rankings Table (default view)

| Rank | Country | CO₂/cap | Green% | Tax | Trend | Votes | Finance | Gap Score | Status |
|------|---------|---------|--------|-----|-------|-------|---------|-----------|--------|
| 1 | EU | 0.91 | 0.80 | 45 | −12 | 83% | 35 | 0.08 | 🟢 Pioneer |
| 2 | LatAm | 0.19 | 0.67 | 30 | −5 | 75% | 10 | 0.15 | 🟢 Pioneer |
| 3 | India | 0.15 | 0.50 | 20 | +2 | 67% | 0 | 0.32 | Middle |
| 4 | Africa | 0.09 | 0.33 | 15 | +5 | 60% | 0 | 0.41 | Middle |
| 5 | China | 0.87 | 0.40 | 25 | −3 | 50% | 20 | 0.44 | Middle |
| 6 | USA | 2.18 | 0.25 | 10 | +8 | 33% | 15 | 0.62 | Middle |
| 7 | Russia | 2.06 | 0.00 | 0 | +15 | 17% | 0 | 0.81 | 🔴 Laggard |
| 8 | OPEC | 1.50 | 0.00 | 0 | +20 | 0% | 0 | 0.95 | 🔴 Laggard |

(Example data — not real game values)

Each column header shows what "pioneer" means for that metric (lowest CO₂/cap, highest green%, etc). Clicking a column sorts by that metric.

Color coding: green cells = close to pioneer, yellow = middle, red = close to laggard. Gradient based on normalized gap for that metric.

#### Section 2: Gap Radar Chart

Spider/radar chart showing all 6 metrics for the **player's own country** vs the **current pioneer**. Makes it immediately visible where you're strong and where you're falling behind.

Each axis = one metric (0 at center = pioneer level, 1 at edge = laggard level). Your country's shape shows your gap profile. The closer your shape is to the center, the more of a pioneer you are.

#### Section 3: Historical Trend

Line chart showing each country's **composite gap score over cycles**. X-axis = cycle number, Y-axis = gap score (0 = pioneer, 1 = laggard).

Shows convergence and divergence over time:
- Lines moving down = catching up (convergence)
- Lines moving up = falling behind (divergence)
- Lines crossing = rank change (former laggard overtakes former pioneer)

This directly visualizes the Liefferink finding that "processes of catching-up and convergence lead to changes in the ranking."

---

## Data Requirements

### Already tracked in game

| Data | Source |
|------|--------|
| CO₂ per country | `region.co2` |
| Population per country | `region.population` |
| Buildings by type and country | `tileBuildings` |
| Trade agreements | `tradeAgreements` |
| Technology per country | `region.technology` |
| Money per country | `region.money` |

### Needs to be added

| Data | What to store |
|------|--------------|
| Previous cycle CO₂ | `previousCycleCo2: Record<CountryId, number>` in GameState |
| Carbon tax per country | `carbonTax: Record<CountryId, number>` in GameState (0–100) |
| Summit vote history | `summitVotes: { cycle, resolution, votes: Record<CountryId, 'yes'|'no'|'abstain'> }[]` |
| Climate finance ledger | `climateFinanceGiven: Record<CountryId, number>` — cumulative tech+money sent to developing countries |

### Developing country threshold

For climate finance tracking, "developing" = starting money < 40. That's: India (28), LatAm (32), Africa (18). These three are the recipients. USA (85), EU (62), OPEC (54), China (72), Russia (38) are potential donors. Russia is borderline — starting money 38 — but given its fossil wealth, classify as donor.

---

## Pioneer/Laggard Badge Effects

Badges are cosmetic labels, not mechanical bonuses. The dashboard is information, not reward/punishment. The game mechanics (CO₂→happiness, factions, summit votes) already create the incentives. The dashboard just makes the comparison visible.

Exception: if we add summit resolutions later, pioneer/laggard status could be referenced in resolution text (e.g., "Laggard countries must reduce CO₂ by 10% — do you vote yes?"). But that's the summit mechanic, not the dashboard itself.

---

## Why This Framework (Academic Grounding)

From the module description: students must be able to "evaluate environmental policy outcomes from a comparative perspective" and understand "factors contributing to the successes and failures of pioneer and laggard states."

The gap approach from Liefferink et al. (2009) does exactly this:
- **Comparative**: every metric is relative to the best performer, not an absolute standard
- **Dynamic**: rankings change as countries act (or don't act)
- **Multi-dimensional**: a country can be pioneer on emissions but laggard on policy, capturing the "international reputation vs domestic policy" gap the literature identifies
- **Self-calibrating**: no need to define what "good" is in advance — the players collectively define the frontier

The dashboard gives players the same analytical tool that environmental policy researchers use. Playing the game and looking at the dashboard IS doing comparative environmental policy analysis.

### Sources

- Liefferink, Arts, Kamstra & Ooijevaar, "Leaders and Laggards in Environmental Policy" (JEPP, 2009)
- Holzinger & Sommerer, "Was verursacht die Aufwärtsspirale in der Umweltpolitik?" (from module reading list)
- Germanwatch CCPI methodology (for metric selection reference)
- Jänicke & Weidner, "Successful Environmental Policy" (from module reading list)
