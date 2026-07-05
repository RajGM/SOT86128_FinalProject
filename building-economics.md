# Building Economics — Balanced Design (v2)

## Design Principles

1. **Every building must create a tradeoff** — no building is purely good
2. **Fossil vs Green** is the one binary choice. No sub-types. Players decide dirty-cheap or clean-expensive.
3. **Nuclear is the wildcard** — zero CO₂ but political cost and scarce uranium
4. **Population = workforce** — every building needs workers. No workers → building goes idle (LIFO: newest built goes dark first)
5. **Population is tradeable** — immigration/labor deals between countries
6. **Tier upgrades scale ~1.6x** yield but workforce stays fixed per building
7. **CO₂ is the only truly shared problem** — everything else is national

## Resources

| Resource | Role |
|----------|------|
| Money | Currency. Build cost, upkeep, trade |
| Energy | Powers industry and cities. Shortage = crisis |
| Food | Feeds population. Shortage = happiness crash |
| Population | **Workforce + consumers.** Each building requires workers. Tradeable between countries. |
| Happiness | Political stability. Too low = faction revolt |
| CO₂ | Emissions. Shared global temperature impact |
| Technology | Unlocks better tiers and green builds |
| Goods | Tradeable manufactured value |

## Workforce Rule

Every building requires a fixed number of workers (population). Sum of all building workforce requirements = **total labor demand**. If a country's population < total labor demand, buildings go idle starting from the **most recently constructed** (LIFO).

An idle building produces nothing and consumes nothing. It stays on the map and reactivates automatically when population recovers (via growth or immigration trade).

This means:
- You can't spam buildings without growing population first
- Population loss (from happiness crash, famine, emigration) cascades into economic collapse
- Trading population (immigration deals) becomes a real diplomatic lever
- Overpopulated countries can "export" workers for money; underpopulated ones must import or grow

---

## 11 Building Types

### ENERGY (3 types — the core political choice)

#### Fossil Plant
*Cheap. Dirty. Free to run. The rational short-term choice that destroys the long game.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 60 money | +45 | +55 |
| **Workforce** | 10 | 10 | 10 |
| **Recurring input** | — | — | — |
| **Yield/cycle** | +40 energy | +65 energy | +90 energy |
| **CO₂/cycle** | +30 | +45 | +55 |
| Terrain | Any land. Bonus on fuel tile: +25% energy |

No upkeep. No fuel cost. Just emissions. Every player can rationalize building one. That's the trap.

#### Green Plant
*Expensive upfront. Needs tech. Zero CO₂. The long game.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 120 money, 10 tech | +90, +8 tech | +110, +5 tech |
| **Workforce** | 8 | 8 | 8 |
| **Recurring input** | 5 money/cycle | 4 money/cycle | 3 money/cycle |
| **Yield/cycle** | +25 energy | +45 energy | +70 energy |
| **CO₂/cycle** | 0 | 0 | 0 |
| Terrain | Any land. Bonus on desert tile: +30% energy |

Less energy than fossil at T1, catches up by T3. Needs technology to build — poor countries can't go green without tech imports. Recurring cost drops with tier (efficiency gains).

#### Nuclear Plant
*Maximum clean energy. Maximum cost. Political risk.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 200 money, 15 tech | +150, +10 tech | +180, +8 tech |
| **Workforce** | 15 | 15 | 15 |
| **Recurring input** | 15 money/cycle | 12 money/cycle | 10 money/cycle |
| **Yield/cycle** | +60 energy | +90 energy | +120 energy |
| **CO₂/cycle** | 0 | 0 | 0 |
| **Happiness** | −5 | −3 | −1 |
| Terrain | Requires uranium deposit tile |

Best energy output in the game. Zero emissions. But: needs uranium (only a few countries have it), costs a fortune, and tanks happiness. The happiness penalty shrinks with tier — public acceptance grows as safety improves.

---

### ECONOMY (2 types)

#### Industrial Complex
*Converts energy into money and goods. Your economic engine.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 100 money | +75 | +95 |
| **Workforce** | 20 | 20 | 20 |
| **Recurring input** | 15 energy/cycle | 25 energy/cycle | 40 energy/cycle |
| **Yield/cycle** | +30 money, +15 goods | +55 money, +30 goods | +80 money, +50 goods |
| **CO₂/cycle** | +8 | +12 | +15 |
| Terrain | Any land |

The workhorse. Needs lots of energy — so your energy choice cascades. Fossil-powered industry = double CO₂. Green-powered industry = clean money. Also needs the most workers of any non-city building.

#### Manufacturing
*Produces goods and technology. The tech pipeline.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 120 money | +90 | +110 |
| **Workforce** | 15 | 15 | 15 |
| **Recurring input** | 10 energy/cycle, 5 money/cycle | 18 energy/cycle, 8 money/cycle | 25 energy/cycle, 10 money/cycle |
| **Yield/cycle** | +20 goods, +3 tech | +40 goods, +5 tech | +65 goods, +8 tech |
| **CO₂/cycle** | +5 | +8 | +8 |
| Terrain | Any land. Bonus on rare_earth tile: +50% goods |

The only building that generates technology. Countries without manufacturing can't unlock green plants or nuclear on their own — they must import tech. This is the tech transfer leverage.

---

### POPULATION (2 types)

#### Village
*Slow, happy growth. Low footprint.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 50 money | +35 | +45 |
| **Workforce** | 3 | 3 | 3 |
| **Recurring input** | 8 food/cycle | 15 food/cycle | 25 food/cycle |
| **Yield/cycle** | +15 population, +4 happiness | +30 population, +6 happiness | +50 population, +8 happiness |
| **CO₂/cycle** | 0 | 0 | 0 |
| Terrain | Agricultural, land |

Cheap, barely needs workers to run, boosts happiness. But population growth is slow. For countries that want stability over scale.

#### City
*Fast growth. Economic hub. Heavy demands.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 100 money | +75 | +100 |
| **Workforce** | 10 | 10 | 10 |
| **Recurring input** | 20 food/cycle, 15 energy/cycle | 40 food/cycle, 30 energy/cycle | 65 food/cycle, 50 energy/cycle |
| **Yield/cycle** | +40 population, +15 money | +80 population, +30 money | +130 population, +50 money |
| **CO₂/cycle** | +5 | +8 | +10 |
| **Happiness** | −2 | −3 | −5 |
| Terrain | Any land |

Cities generate population fast and earn money, but eat massive food and energy. A T3 city demands 65 food and 50 energy per cycle. If you can't feed it, happiness crashes and people leave — which idles your other buildings.

---

### FOOD (1 type)

#### Farm
*Feeds your population. Climate-vulnerable.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 40 money | +30 | +40 |
| **Workforce** | 5 | 5 | 5 |
| **Recurring input** | — | 3 energy/cycle | 8 energy/cycle |
| **Yield/cycle** | +30 food | +55 food | +85 food |
| **CO₂/cycle** | 0 | 0 | 0 |
| Terrain | Agricultural only |
| **Climate risk** | Yield drops 20% when global temp > +2.0°C, 40% above +3.0°C |

Cheapest building. No emissions. But only works on agricultural tiles (unevenly distributed — LatAm and India have many, OPEC has few). And climate change hits farms first. This directly connects the CO₂ problem to food security.

---

### TRANSPORT (3 types — enables trade routes)

#### Airport
*Any-to-any routes. Highest cost and emissions.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 140 money | +105 | +130 |
| **Workforce** | 8 | 8 | 8 |
| **Recurring input** | 20 money/cycle | 35 money/cycle | 50 money/cycle |
| **Route capacity** | 2 | 4 | 6 |
| **Route CO₂** | +8/route | +5/route | +3/route |
| Terrain | Any land |

Connects any two countries regardless of geography. USA↔India? Airport. But expensive upkeep and highest transport emissions.

#### Dock
*Sea routes. Moderate. Coastal geography required.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 100 money | +75 | +95 |
| **Workforce** | 6 | 6 | 6 |
| **Recurring input** | 15 money/cycle | 25 money/cycle | 40 money/cycle |
| **Route capacity** | 2 | 4 | 6 |
| **Route CO₂** | +5/route | +3/route | +2/route |
| Terrain | Coastal only |

Middle ground. Needs coastline on both ends.

#### Transport Center
*Land routes. Cheapest. Requires border adjacency.*

| | T1 | T2 | T3 |
|---|---|---|---|
| **Build cost** | 80 money | +60 | +75 |
| **Workforce** | 5 | 5 | 5 |
| **Recurring input** | 10 money/cycle | 18 money/cycle | 28 money/cycle |
| **Route capacity** | 2 | 4 | 6 |
| **Route CO₂** | +3/route | +2/route | +1/route |
| Terrain | Land, agricultural |

Cheapest and cleanest transport. But only works between land-connected regions (BORDER_PAIRS). USA↔EU impossible by land — ocean in the way.

---

## Summary Table

| Building | Build $ | Workers | Recurring Cost | Main Yield | CO₂ | Key Tradeoff |
|----------|---------|---------|---------------|------------|-----|--------------|
| Fossil Plant | 60 | 10 | Free | Energy+++ | Very High | Cheap but destroys climate |
| Green Plant | 120+tech | 8 | 5→3 money | Energy+ → ++ | Zero | Expensive, needs tech imports |
| Nuclear Plant | 200+tech | 15 | 15→10 money | Energy+++ | Zero | Needs uranium, tanks happiness |
| Industrial Complex | 100 | 20 | 15→40 energy | Money++, Goods+ | Medium | Needs energy — source matters |
| Manufacturing | 120 | 15 | 10 energy, 5 money | Goods++, Tech+ | Low | Only tech source in game |
| Village | 50 | 3 | 8→25 food | Pop+, Happy+ | Zero | Slow but stable |
| City | 100 | 10 | 20 food, 15 energy | Pop+++, Money+ | Low | Fast but hungry and unhappy |
| Farm | 40 | 5 | Free → 8 energy | Food++ | Zero | Climate-vulnerable |
| Airport | 140 | 8 | 20→50 money | Trade (any) | Per-route | Expensive, connects anyone |
| Dock | 100 | 6 | 15→40 money | Trade (sea) | Per-route | Needs coast both sides |
| Transport Ctr | 80 | 5 | 10→28 money | Trade (land) | Per-route | Cheapest, land-adjacent only |

---

## Population Trade

Population is tradeable like any other resource. This models:

- **Labor migration** — India/Africa have surplus population, EU/Russia need workers
- **Immigration deals** — "I'll send 50 workers if you give me 30 technology"
- **Brain drain risk** — exporting population means fewer workers for your own buildings
- **Demographic leverage** — countries with large populations can offer workforce in exchange for money, tech, or food

### Trade balance
Sending population away reduces your workforce (buildings may go idle) but can earn money/tech/food you desperately need. Receiving population gives you workers but increases food/energy demand from your cities and villages.

This creates a genuine North-South dynamic: rich countries with low population (EU, Russia) want workers; poor countries with high population (India, Africa) want capital and technology. Both sides have something the other needs.

---

## Workforce Demand by Strategy

| Strategy | Typical buildings | Total workforce needed |
|----------|------------------|----------------------|
| Fossil rush | 2 Fossil + 2 Industry + City + Farm | 10+10+20+20+10+5 = 75 |
| Green path | 2 Green + Manufacturing + Industry + Village + Farm | 8+8+15+20+3+5 = 59 |
| Trade hub | 2 Fossil + Airport + Dock + Industry + Farm | 10+10+8+6+20+5 = 59 |
| Agricultural | 3 Farm + Village + Green + Transport Ctr | 5+5+5+3+8+5 = 31 |

A T1 city produces 40 population/cycle. Two cycles of a single city = 80 workers. That's enough to staff a mid-size economy. But you need food and energy to keep that city running — which means farms and power plants — which need workers too.

The constraint keeps the game from snowballing: you can't build everything at once. You must sequence and prioritize.

---

## Why This Works as Environmental Politics

### The fossil trap
Fossil plant costs 60 and runs free. Green plant costs 120 + technology and has upkeep. Every rational player picks fossil. By cycle 4-5, global temperature spikes, farms lose yield, food-dependent countries suffer. The players who went fossil face: demolish and rebuild (expensive, workers idle during transition) or keep polluting. **Tragedy of the commons.**

### The rich-poor divide
Green and nuclear need technology. Manufacturing produces technology. Rich countries (USA, EU, China) have manufacturing. Poor countries (India, Africa) don't — they're stuck with fossil unless someone trades them tech. **Climate justice.**

### Population as geopolitics
India and Africa have massive populations but low money/tech. EU and Russia have money but shrinking workforces. Immigration deals become essential: "Send us 100 workers and we'll send you 20 tech." Both sides benefit but both take risks. **Migration politics.**

### Food as climate feedback
Farms lose yield above +2.0°C. Agricultural countries (LatAm, India, Africa) get hit first by climate change they didn't cause. Food shortages → happiness crashes → population leaves → buildings go idle → economy collapses. **Climate vulnerability.**

### Energy cascades
Industry needs energy. Cities need energy. Fossil energy is cheap but adds CO₂. Green energy is expensive and needs tech. Your energy source choice defines your entire economy's carbon footprint. **Energy transition tradeoff.**

---

## Country Strategies

| Country | Pop | Money | Natural path | Key tension |
|---------|-----|-------|-------------|-------------|
| USA | 330 | 850 | Fossil + Industry + City | Can afford green but fossil is easier |
| EU | 220 | 620 | Green + Manufacturing | High tech but low energy, needs imports |
| Russia | 180 | 380 | Fossil + Industry | Economy depends on fossil; low population |
| China | 1400 | 720 | Fossil + Manufacturing + City | Massive workforce, rare earth leverage |
| India | 1380 | 280 | Farm + Village → Green later | Huge population, no money for green yet |
| OPEC | 280 | 540 | Fossil export economy | Existential: transition kills their income |
| LatAm | 420 | 320 | Farm + Village + Hydro(dock) | Food exporter, climate-vulnerable |
| Africa | 1300 | 180 | Farm + Village → needs everything | Lowest money, largest unmet needs |
