# Climate Diplomacy — v1 Complete Mechanics (as implemented)

Source of truth for the game as it exists in code. Supersedes v1-mechanics.md, building-economics.md, population-mechanics.md, transport-v2.md, and cut-goods.md.

---

## Overview

9 building types. 7 resources. 3 raw materials. 8 country blocs. 60x30 hex grid. Shared global temperature. Every building needs workers. Every choice has a tradeoff.

---

## Countries

| Country | Pop | Money | Energy | Food | Happiness | CO₂ | Tech |
|---------|-----|-------|--------|------|-----------|-----|------|
| USA | 33 | 85 | 42 | 38 | 72 | 72 | 75 |
| EU | 22 | 62 | 28 | 24 | 78 | 20 | 85 |
| Russia | 18 | 38 | 48 | 20 | 65 | 37 | 55 |
| China | 90 | 72 | 56 | 42 | 68 | 78 | 70 |
| India | 88 | 28 | 18 | 32 | 62 | 13 | 45 |
| OPEC | 28 | 54 | 62 | 14 | 70 | 42 | 40 |
| LatAm | 52 | 32 | 22 | 48 | 66 | 10 | 38 |
| Africa | 82 | 18 | 12 | 26 | 58 | 7 | 30 |

All values are the actual numbers in `regionProfiles.ts`. Population units are /10 from real-world millions (33 = ~330M).

### Country Profiles

- **USA** — Rich, industrial, high emissions. Can afford green but fossil is easier.
- **EU** — Highest tech, low resources. Must import energy/materials. Green leader.
- **Russia** — Fossil exporter. Gas/coal rich, low population, energy leverage.
- **China** — Manufacturing powerhouse. Rare earth monopoly. Massive workforce + emissions.
- **India** — Huge population, low money/tech. Solar potential. Climate justice agenda.
- **OPEC** — Oil/gas rich, food-poor. Existential threat from green transition.
- **LatAm** — Food surplus, forests, hydro potential. Infrastructure gaps.
- **Africa** — Mineral-rich, capital-poor. Lowest tech, highest unmet needs.

---

## Resources

| Resource | Role |
|----------|------|
| Money | Build cost, upkeep, trade currency |
| Energy | Powers industry and cities |
| Food | Feeds population |
| Population | Workforce + consumers. Tradeable (immigration deals). |
| Happiness | Political stability. Cascade effects below 50. |
| CO₂ | Emissions. Feeds shared global temperature. |
| Technology | Engineering capacity. Spent to build green/nuclear. Only source: Manufacturing. |

### Raw Materials (deposit stockpiles, separate from resources)

| Material | Source | Used by |
|----------|--------|---------|
| Fuel | Extracted from fuel deposit tiles | Fossil Plant (consumed per cycle) |
| Uranium | Extracted from uranium deposit tiles | Nuclear Plant (consumed per cycle) |
| Rare Earth | Extracted from rare_earth deposit tiles | Manufacturing (+50% tech bonus if stockpile ≥ 1) |

### Material Distribution by Country

| Country | Fuel | Uranium | Rare Earth | Profile |
|---------|------|---------|------------|---------|
| USA | Many | Some | Few | Fossil-rich |
| EU | Few | Few | Few | Resource-poor, must import |
| Russia | Many | Some | Some | Energy exporter |
| China | Some | Few | Many | Rare earth monopoly |
| India | Few | Few | Few | Resource-poor |
| OPEC | Very many | None | None | All fossil |
| LatAm | Few | Some | Some | Modest, balanced |
| Africa | Some | Some | Many | Mineral-rich, undeveloped |

---

## Terrain Types

land, coastal, desert, mountain, forest, agricultural, ocean, arctic

Terrain affects building placement: farms require agricultural, extractor requires deposit tile, T2 hub requires coastal, green plant gets +30% on desert.

---

## Buildings (9 types)

### Fossil Plant
*Cheap energy. Consumes fuel. High CO₂.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 60 money | 105 cumulative | 160 cumulative |
| Workforce | 10 | 10 | 10 |
| Fuel consumed/cycle | 1 | 2 | 3 |
| Yield/cycle | +40 energy | +65 energy | +90 energy |
| CO₂/cycle | +30 | +45 | +55 |
| Terrain | Any land |

Fuel consumption is separate from effectsByTier — handled by `FOSSIL_FUEL_PER_CYCLE` in buildEconomics.ts. No fuel stockpile = plant goes idle.

### Green Plant
*Clean energy. Expensive. Needs technology to build.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 120 money + 10 tech | 210 + 18 tech | 320 + 23 tech |
| Workforce | 8 | 8 | 8 |
| Recurring | −5 money/cycle | −4 money/cycle | −3 money/cycle |
| Yield/cycle | +25 energy | +45 energy | +70 energy |
| CO₂/cycle | 0 | 0 | 0 |
| Terrain | Any land. **+30% energy on desert tiles.** |

Technology is deducted from stockpile on construction — consumed like money.

### Nuclear Plant
*Maximum clean energy. Needs uranium. Happiness penalty.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 200 money + 15 tech | 350 + 25 tech | 530 + 33 tech |
| Workforce | 15 | 15 | 15 |
| Uranium consumed/cycle | 1 | 1 | 2 |
| Recurring | −15 money/cycle | −12 money/cycle | −10 money/cycle |
| Yield/cycle | +60 energy | +90 energy | +120 energy |
| CO₂/cycle | 0 | 0 | 0 |
| Happiness/cycle | −5 | −3 | −1 |
| Terrain | Any land (uranium from stockpile) |

Higher demolish cost (35%) and lower refund (25%) than other buildings. Upgrade cost ratio 85%.

### Industrial Complex
*Energy → Money. Economic engine.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 100 money | 175 | 270 |
| Workforce | 20 | 20 | 20 |
| Recurring | −15 energy/cycle | −25 energy/cycle | −40 energy/cycle |
| Yield/cycle | +35 money | +65 money | +95 money |
| CO₂/cycle | +8 | +12 | +15 |
| Terrain | Any land |

Highest workforce demand. Energy source defines carbon footprint.

### Manufacturing
*Energy → Technology. Only domestic tech source.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 120 money | 210 | 320 |
| Workforce | 15 | 15 | 15 |
| Recurring | −10 energy, −5 money | −18 energy, −8 money | −25 energy, −10 money |
| Yield/cycle | +5 tech | +8 tech | +12 tech |
| CO₂/cycle | +5 | +8 | +8 |
| Rare earth bonus | +50% tech if stockpile ≥ 1 |
| Terrain | Any land |

With rare earth: T1=+7, T2=+12, T3=+18 tech. Rare earth is NOT consumed — having ≥1 in stockpile activates the bonus permanently.

### City
*Fast population growth + money. Heavy demands.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 100 money | 175 | 275 |
| Workforce | 10 | 10 | 10 |
| Recurring | −20 food, −15 energy | −40 food, −30 energy | −65 food, −50 energy |
| Yield/cycle | +40 pop, +15 money | +80 pop, +30 money | +130 pop, +50 money |
| CO₂/cycle | +5 | +8 | +10 |
| Happiness/cycle | −2 | −3 | −5 |
| Terrain | Any land |

During unrest (happiness 30–50), city population yield is halved.

### Farm
*Food production. Climate-vulnerable.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 40 money | 70 | 110 |
| Workforce | 5 | 5 | 5 |
| Recurring | — | −3 energy | −8 energy |
| Yield/cycle | +30 food | +55 food | +85 food |
| CO₂/cycle | 0 | 0 | 0 |
| Terrain | **Agricultural only** |
| Climate risk | −20% yield above +2.0°C, −40% above +3.0°C |

### Extractor
*Mines raw materials from deposit tiles.*

| | T1 | T2 | T3 |
|---|---|---|---|
| Build cost | 70 money | 125 | 195 |
| Workforce | 5 | 5 | 5 |
| Recurring | −3 money | −5 money | −8 money |
| Yield/cycle | 2 units of tile material | 4 units | 7 units |
| CO₂/cycle | +3 | +4 | +5 |
| Terrain | **Deposit tile only** (fuel, uranium, or rare_earth) |

Yields are computed by `getExtractorYield()`, not from effectsByTier (which is empty `{}`). CO₂ is computed by `computeExtractorCo2()`.

### Transport Hub
*Enables trade. Tier = reach. Capacity = units/cycle.*

| | T1 | T2 | T3 | Post-T3 (+N) |
|---|---|---|---|---|
| Build cost | 80 money | 150 | 240 | +50 per level |
| Workforce | 6 | 6 | 6 | 6 |
| Recurring | −10 money | −18 money | −28 money | +8 money per level |
| Capacity | 20 units/cycle | 40 | 60 | +20 per level |
| Reach | Land neighbors | +Sea routes | +Air (anyone) | Same as T3 |
| Terrain | Any land | **Coastal only** | Any land | Same tile |

Multiple hubs stack capacity. Country reach = highest tier among all hubs.

Post-T3 upgrades: each costs 50 money, adds +20 capacity and +8 money/cycle upkeep. No cap.

---

## Per-Capita Consumption

Every cycle, population consumes resources independent of buildings:

| Per 100 population/cycle | Amount |
|--------------------------|--------|
| Food | 3 |
| Energy | 2 |
| Money | 1 |

Example: China (pop=90) drains 27 food, 18 energy, 9 money per cycle just for existing people.

---

## CO₂ → Happiness

### National CO₂ Penalty

| Country CO₂ | Happiness/cycle |
|-------------|----------------|
| < 100 | +2 (clean record bonus) |
| 100–300 | 0 |
| 300–500 | −3 |
| > 500 | −6 |

### Global Temperature → Happiness (all countries)

| Global temp | Happiness/cycle |
|-------------|----------------|
| < +1.5°C | 0 |
| +1.5–2.0°C | −2 |
| +2.0–2.5°C | −5 |
| +2.5–3.0°C | −8 |
| > +3.0°C | −12 |

### Food/Energy Shortage

If food < 0 OR energy < 0 after per-capita consumption and building costs: **−15 happiness**.

---

## Happiness Cascade

| Level | Range | Effect |
|-------|-------|--------|
| Stable | 70+ | Normal growth |
| Concerned | 50–70 | No bonus, no penalty |
| Unrest | 30–50 | City population yields halved |
| Crisis | 15–30 | All buildings forced idle. −5% population (gone, not transferred). |
| Collapse | < 15 | All buildings forced idle. −10% population. Random building destroyed (riots). |

Happiness is clamped to 0–100.

**Note:** Code currently has `isConstructionBlocked(happiness < 15)` — construction blocked during collapse. Also `shouldForceAllBuildingsIdle(happiness < 30)` — crisis and collapse force ALL buildings idle.

---

## Global Temperature

Starts at 1.0°C. Each cycle: `temperature += totalCycleCO₂ × 0.001`

CO₂ sources: fossil plants, industrial complexes, manufacturing, cities, extractors, transport emissions.

---

## Transport & Trade

### Route Priority (auto-selected, cheapest first)

1. **Land** (T1+) — BFS over BORDER_PAIRS. CO₂: 3 per unit.
2. **Sea** (T2+) — No land path exists, both have coast, sender has coastal T2+ hub. CO₂: 5 per unit.
3. **Air** (T3) — Any to any. CO₂: 8 per unit.

### Border Adjacency (BORDER_PAIRS)

USA↔LatAm, EU↔Russia, EU↔Africa, Russia↔China, Russia↔OPEC, China↔India, China↔OPEC, India↔OPEC, OPEC↔Africa, Africa↔LatAm

### Transit Agreements

Land routes through intermediate countries require transit permission. Intermediate country sets fee:
- **Flat**: fixed money per cycle
- **Commission**: percentage of trade value per cycle

Transit auto-cancelled if relations with intermediate country drop below 30. Route disrupted, trades on that route deactivated.

### Capacity

Each unit of resource traded costs 1 transport capacity. Capacity resets each cycle. Total capacity = sum of all hub capacities.

### Hub Tier Trading

Countries can trade hub upgrades to other countries (infrastructure aid). Negotiated via trade panel. Cost paid by whoever the deal specifies.

---

## Tradeable Items

| Item | Type | Notes |
|------|------|-------|
| money | Resource | Direct transfer |
| energy | Resource | Cover shortages |
| food | Resource | Feed population |
| population | Resource | Immigration/labor deals |
| fuel | Material | Powers fossil plants |
| uranium | Material | Powers nuclear plants |
| rare_earth | Material | Boosts manufacturing tech output |
| technology | Resource | Engineering capacity for green/nuclear builds |
| transit_permission | Special | Enables land routes through your territory |
| hub_upgrade | Special | Upgrade another country's transport hub |

---

## Relations

Initialized at 50 for all pairs. Stored in `RegionState.relations`.

Currently only used for one thing: **transit auto-disruption when relations < 30**.

Not yet implemented: event-driven changes from trades, votes, transit approvals/denials.

---

## Cycle Processing Order (14 steps)

Implemented in `gameState.ts processCycle()`:

1. **Per-capita consumption** — deduct food/energy/money based on population
2. **Workforce check** — LIFO idle if pop < demand. Crisis/collapse forces ALL idle.
3. **Extraction** — active extractors produce materials into stockpile
4. **Material consumption** — fossil consumes fuel, nuclear consumes uranium. No stockpile = idle.
5. **Building yields** — active buildings produce outputs. Unrest halves city pop yields.
6. **Building recurring costs** — active buildings consume inputs
7. **Trade processing** — continuous trades transfer resources. Transport CO₂ applied. Transit fees deducted. Hub upgrades executed.
8. **CO₂ sum** — total cycle CO₂ from all sources
9. **Temperature update** — globalTemp += cycleCO₂ × 0.001
10. **Climate effects** — farm yield penalty above +2.0°C (recalculated with updated temp)
11. **Happiness update** — national CO₂ + global temp + shortage penalties
12. **Population effects** — crisis/collapse population loss, collapse riots (random building destroyed)
13. **Clamp negatives** — food/energy floor at 0
14. **Advance cycle**

Also after cycle: auto-disrupt transit agreements where relations < 30.

---

## Workforce System

Every building has a fixed workforce number. Total labor demand = sum of all building workforce.

If population < total demand: newest-built buildings go idle first (LIFO). Idle buildings produce nothing, consume nothing.

If happiness < 30 (crisis/collapse): ALL buildings forced idle regardless of population.

| Building | Workers |
|----------|---------|
| Industrial Complex | 20 |
| Nuclear Plant | 15 |
| Manufacturing | 15 |
| Fossil Plant | 10 |
| City | 10 |
| Green Plant | 8 |
| Transport Hub | 6 |
| Farm | 5 |
| Extractor | 5 |

---

## Technology System

Technology = engineering capacity. Not "research" — it's "do you have enough know-how to build this?"

- **Only source:** Manufacturing (+5/+8/+12 per cycle, +50% with rare earth)
- **Consumed on build:** Green Plant costs 10/18/23 tech cumulative. Nuclear costs 15/25/33.
- **Tradeable:** countries without Manufacturing must import tech to go green
- **Not a permanent unlock:** each build deducts from stockpile

---

## Building Placement Rules

| Building | Constraint |
|----------|-----------|
| Farm | Agricultural terrain only |
| Extractor | Deposit tile only (fuel/uranium/rare_earth) |
| Transport Hub T1 | Any land |
| Transport Hub T2+ | Coastal tile (adjacent to ocean) |
| Green/Nuclear Plant | Requires tech in stockpile |
| All others | Any land (not ocean/arctic) |

One building per tile. Each building must be on a tile owned by the player's country.

### Demolish

Default: 25% of build cost as demolition fee, 35% refund. Nuclear: 35% fee, 25% refund.

### Upgrade

Default: full tier-delta cost. Nuclear: 85% of tier-delta.

---

## Dead Code (in codebase but not used by design)

These types/systems exist in code but are slated for removal:

- `researchLevels` in RegionState — old research system, cut
- `extractionUnlocks` in RegionState — extractors no longer need research unlock
- `breakthroughs` in RegionState — breakthrough system cut
- `BreakthroughProposal` type — cut
- `CombinedResearchProject` type — cut
- `ResearchLicense` type — cut
- `breakthroughProposal`, `combinedProjects`, `researchLicenses` in GameState — cut
- `research.ts` — entire file (extraction research, breakthroughs, licensing)
- `isConstructionBlocked()` — design says no construction lockout, but code still has it

---

## Not Yet Implemented

These mechanics were designed but have no code yet:

1. **Carbon tax slider** — per country, per cycle (0–100)
2. **Domestic factions** — 2 per country (pro-growth vs pro-green), faction satisfaction affects happiness
3. **Summit resolutions** — one proposal per cycle, all countries vote yes/no/abstain
4. **Comparison dashboard** — pioneer/laggard ranking, always-visible button
5. **Event-driven relations** — relations change from trades (+3), transit (+2/−5), votes (+2/−3), hub gifts (+5), broken deals (−8)

---

## Key Design Loops

**Fossil trap:** Fossil is cheap → everyone builds it → CO₂ rises → temperature rises → farms lose yield → food crisis → happiness crashes → population leaves → buildings go idle → economy collapses. Tragedy of the commons.

**Green transition:** Build Manufacturing → generate tech → build green plants → no fuel needed → no CO₂ → farms safe → happy population → more workers → more manufacturing. Virtuous cycle, but expensive entry.

**Trade dependency:** EU has no fuel/rare earth → imports from Russia/OPEC/China → political dependency → those countries have leverage → but if they push too hard, EU goes green → fossil exporters lose market.

**Population leverage:** India/Africa have huge population but low money/tech → can export workers for tech → but losing workers idles own buildings → must balance. Rich countries need workers but gain food/energy burden.

**Food as geopolitics:** LatAm has massive food surplus. China/India/Africa run out in 6–9 cycles without farms. LatAm can demand tech, money, or political concessions.
