# Climate Diplomacy — Minimal Viable Specification

## Philosophy

This is NOT a grand strategy game. It is a **political simulation** for the TUM module POL23200 (Prof. Dr. Miranda Schreurs). The game models one thing well: **why countries with different domestic politics, resources, and historical responsibilities produce different environmental policy outcomes**.

Everything that doesn't serve that question is cut.

---

## Tech Stack (Non-Negotiable)

- React + Vite frontend
- Firebase Auth (anonymous)
- Firebase Realtime Database (rooms, sync, state)
- 2-5 human players, empty slots run on simple autopilot

---

## The World: 5 Countries, Scaled Down

No hex grid. No map pathfinding. Each country is a **panel/card** with stats and controls.

Countries are scaled by real-world proportions to create asymmetry — this is the core of comparative politics.

| Country | Land Units | Starting GDP | Pop (scaled) | Emissions/cap | Historical Emissions % | Renewable % | Key Advantage | Key Vulnerability |
|---|---|---|---|---|---|---|---|---|
| USA | 10 | 250 | 33 | 15.0 | 25% | 22% | Resource diversity, tech | Low climate policy tolerance |
| EU | 4 | 180 | 45 | 6.5 | 22% | 40% | Regulation, renewables | Resource-poor, import-dependent |
| China | 10 | 180 | 140 | 8.0 | 13% | 30% | Rare earths, manufacturing, no elections | Coal-dependent, oil imports |
| India | 3 | 35 | 140 | 2.0 | 3% | 28% | Young population, solar, equity argument | Low GDP, energy poverty |
| OPEC+ | 9 | 80 | 40 | 12.0 | 15% | 5% | Oil/gas monopoly, sovereign wealth | Entire economy is fossil |

Land units are abstract — they determine **resource capacity**, not map tiles. A country with 10 land units can hold more infrastructure upgrades than one with 3.

---

## 6 Resources (The Entire Economy)

Every decision in the game moves these 6 numbers. Nothing else is tracked at the core level.

| Resource | What It Represents | Why It Matters Politically |
|---|---|---|
| **Money** (Treasury/GDP) | Economic output, budget capacity | Funds all policy; GDP loss = voter anger |
| **Energy** | Power supply (fossil + renewable mix) | Drives economy AND emissions; the central tradeoff |
| **Food** | Agricultural output, food security | Population stability; climate-vulnerable |
| **Population** | Labor force, demand, political pressure | Creates need for energy, food, jobs; source of approval |
| **CO2 Emissions** | Annual carbon output | The shared problem; accumulates into global temperature |
| **Approval** | Domestic political support (0-100) | Determines if your policies survive; too low = crisis |

**Why these 6 and not more?** Every additional resource adds UI complexity, formula complexity, and balancing work. These 6 create all the tradeoffs the module needs:

- Money vs. emissions (invest in green or grow dirty?)
- Energy vs. emissions (fossil is cheap but dirty)
- Food vs. land use (agriculture or solar farms?)
- Population pressure vs. resource capacity (India's dilemma)
- Approval vs. ambition (voters punish costly climate policy)
- Your emissions vs. everyone's temperature (tragedy of the commons)

**Derived indicators** (calculated from the 6, not independently tracked):

- Global temperature (sum of all CO2 over rounds)
- HDI/welfare (function of GDP per capita + food security)
- Energy mix ratio (fossil % vs. renewable %)
- Emissions per capita (CO2 / population)
- Historical emissions share (cumulative CO2 over game)

---

## Political Framework: Directly from the Module

### Prof. Schreurs' Framework Applied

The module teaches comparative environmental politics through these lenses. Each maps to a game mechanic:

| Module Concept | Game Mechanic |
|---|---|
| **Collective action problem** (Olson) | 5 players share one atmosphere; individual incentive is to free-ride |
| **CBDR-RC** (UNFCCC principle) | Historical emissions ledger visible to all; shapes equity arguments in UN votes |
| **Pioneer vs. Laggard states** (Jaenicke) | Country asymmetry — EU starts green, OPEC+ starts fossil; end-game compares who moved |
| **Policy diffusion** (Holzinger & Sommerer) | Trade deals can include environmental standards; Brussels Effect mechanic |
| **Regulatory competition** | Race-to-bottom risk if players undercut carbon taxes for GDP growth |
| **Varieties of capitalism** (Hall & Soskice) | USA = liberal market, EU = coordinated market, China = state-directed, India = developmental, OPEC+ = rentier state |
| **Domestic actor constellations** | 3 factions per country with different preferences |
| **Governance instruments** | Carbon tax, budget allocation, trade conditions, UN resolutions |
| **Implementation challenges** | High ambition + low approval = policy reversal |
| **Multi-level governance** | Domestic factions + bilateral deals + UN summits = three levels |

### What This Means for Scope

The game doesn't need combat, fog of war, hex logistics, tech trees, or disaster simulations. It needs:

1. Asymmetric countries with real-world-grounded differences
2. A resource model that forces tradeoffs
3. Domestic politics that constrain what players can do
4. International bargaining that creates interdependence
5. A shared climate outcome that rewards/punishes collective action

---

## Simplified Domestic Politics

Each country has **3 factions** (not 4). Approval = weighted average of faction satisfaction.

| Country | Faction 1 (weight) | Faction 2 (weight) | Faction 3 (weight) |
|---|---|---|---|
| USA | Green/Tech (25%) | Industry/Fossil (40%) | Populist Consumers (35%) |
| EU | Green Parties (35%) | Industrial Competitiveness (30%) | Social Welfare (35%) |
| China | Technocrats (30%) | Growth/Provincial Industry (40%) | Stability/Security (30%) |
| India | Development Coalition (40%) | Climate Justice (20%) | Agricultural/Rural (40%) |
| OPEC+ | Fossil Establishment (45%) | Diversification Modernizers (20%) | Stability/Security (35%) |

**Each faction cares about 2 things:**

- A preferred **climate ambition** level (low/medium/high)
- A preferred **spending priority** (economy, energy, social, research, diplomacy)

Policy that matches faction preferences raises their satisfaction. Policy that clashes lowers it.

**Approval consequences (simplified):**

| Approval | Effect |
|---|---|
| 70+ | Mandate: one free policy action per cycle |
| 40-69 | Normal governance |
| 20-39 | Instability: all output -20% |
| Below 20 | Crisis: policies reset to faction-weighted defaults |

**No media tiers, no information warfare, no narrative campaigns.** Just one optional action: "Public Support Campaign" — spend money to boost one faction's satisfaction by a small amount. Simple.

---

## Simplified International Mechanics

### Bilateral Deals

Players can propose deals during each cycle. A deal is a contract:

- **What you give:** money, energy, food, technology level, carbon credits
- **What you get:** money, energy, food, technology level, carbon credits, political support
- **Duration:** 1-3 cycles
- **Side effects:** emissions change, dependency, relation score change

Example deals that emerge naturally:
- OPEC+ sells energy to EU: EU energy +, EU emissions +, OPEC+ money +
- EU sends climate finance to India: India renewable capacity +, EU money -, both relations +
- China licenses green tech to India: India tech +, China money +

No transport routes. No ships. No chokepoints. Deals are instant.

### UN Summits

Every 2-3 cycles, a **UN resolution card** appears. Players vote: support / oppose / abstain.

Resolutions pass with **3+ votes** (simple majority of 5).

Resolution types (small deck of 8-10 cards):
- Global carbon tax floor
- Climate finance obligation (historical emitters pay)
- Technology sharing mandate
- Coal phaseout target
- Emissions reporting requirements
- Deforestation moratorium
- Green investment commitment
- Sanctions on non-compliant players

Passed resolutions become binding. Non-compliance has a penalty (relations drop, approval cost, trade restrictions).

The historical emissions ledger determines who pays what in finance-related resolutions — this operationalizes CBDR-RC.

---

## Simplified Infrastructure / Upgrades

No building placement. No hex grid. Each country has **upgrade slots** equal to their land units (USA: 10, India: 3, etc.).

Each slot holds one upgrade. Upgrades are chosen from a flat list (no tech tree):

| Upgrade | Cost | Effect |
|---|---|---|
| Fossil Power Plant | Low | Energy ++, Emissions ++ |
| Solar/Wind Farm | Medium | Energy +, Emissions 0 |
| Advanced Renewables | High | Energy ++, Emissions 0 (requires tech level 2) |
| Industrial Complex | Medium | Money ++, Emissions + |
| Green Industry | High | Money +, Emissions 0 (requires tech level 2) |
| Farm / Agriculture | Low | Food ++ |
| Social Program | Medium | Approval +, costs money per cycle |
| Research Center | High | +1 tech level after 2 cycles |
| Carbon Capture | High | Emissions -- (requires tech level 3) |

**Tech level** is a single number (1-3), not a tree. It unlocks better upgrades. Research Centers are how you increase it.

One upgrade per cycle. That's the spatial/infrastructure constraint — simple, no map needed, but land-poor countries (India: 3 slots) face real limits.

---

## Simplified Game Loop

**5-minute decision cycles. No phases.**

During each 5-minute cycle, all players simultaneously:
1. Set carbon tax (slider: 0-100)
2. Allocate budget across 5 categories: Economy, Energy Transition, Social, Research, Diplomacy
3. Build one upgrade (if they have an open slot)
4. Propose / accept / reject deals with other players
5. Vote on UN resolution (if one is active this cycle)

When timer hits zero:
- Lock all inputs
- Run the model update (automatic, ~5 seconds)
- Show cycle summary
- Start next cycle

**Game length:** 7 cycles x 5 minutes = 35 minutes of play + 5 min setup + 5 min end-game discussion = **~45 minutes total**.

---

## The Model Update (What Happens Each Cycle)

Simple formulas, transparent enough to explain in the seminar paper.

```
Money += (GDP_base * industry_modifier) + trade_income - budget_spending - carbon_tax_cost
Energy = fossil_capacity + renewable_capacity + imported_energy - population_demand
Food = farm_output + imported_food - population_demand
Emissions = fossil_energy * emission_factor - carbon_capture - forest_sinks + industry_emissions
Approval = weighted_average(faction_satisfactions)
Global_Temperature += total_world_emissions * warming_factor - total_sinks * cooling_factor
```

Each faction's satisfaction adjusts based on how well the player's policy matches their preferences. High carbon tax pleases greens, angers industry. High social spending pleases populists, costs money.

**Climate feedback:** When global temperature crosses thresholds, penalties kick in:
- +1.5C: Food output -10% globally
- +2.0C: Food -20%, GDP -5% for all
- +2.5C: Food -30%, GDP -10%, approval -10 for all
- +3.0C: Severe penalties, no winner possible

---

## Simplified Scoring

| Component | Weight | What It Measures |
|---|---|---|
| Domestic welfare (GDP + Food + Approval) | 35% | Did you keep your country stable? |
| Emissions reduction (vs. starting level) | 25% | Did you decarbonize? |
| International cooperation (deals + treaty compliance) | 20% | Did you cooperate? |
| Shared climate outcome (final temperature) | 20% | Did humanity survive? |

End-game shows a **comparative table** of all 5 countries. This directly supports the module's requirement to "evaluate environmental policy outcomes comparatively."

---

## What Was Cut (and Why)

| Feature from v3/simplified-scope | Status | Reason |
|---|---|---|
| Hex grid (60x30) | **CUT** | Module is about politics, not geography |
| Per-hex buildings | **CUT** → upgrade slots | Same tradeoff, zero map complexity |
| Transport logistics (ships, planes, rail) | **CUT** | Deals are instant; no route simulation |
| Chokepoints | **CUT** | Can be an event card instead |
| Fog of war | **CUT** | Comparative analysis requires visible data |
| Media tiers (spin, campaign, info warfare) | **CUT** → single "Public Support" action | Keeps narrative insight without 3-tier system |
| 4 factions per country | **REDUCED** → 3 factions | Same dynamics, less UI and balancing |
| Technology tree (3 tracks x 3 levels) | **CUT** → single tech level (1-3) | Research still matters, but no branching |
| Bot AI (Nash, tit-for-tat, minimax) | **CUT** → simple priority weights | Paper can discuss theory; code stays simple |
| Strategic assets (6-10 per country) | **CUT** → country stats + upgrade slots | Same asymmetry, less data |
| Event deck (10-15 cards) | **OPTIONAL** | Nice to have, not required for MVP |
| Game-theory advisory maps | **CUT** | Players use the dashboard; no separate AI advisor |
| Consequence tree visualization | **CUT** | Formulas are transparent enough; tooltip hints suffice |
| Priority/stress map | **CUT** → dashboard warnings | "Energy low!" warning is enough |
| Resource map | **CUT** → country comparison table | Bar charts comparing all 5 players |
| Detailed climate disasters | **CUT** → 4 temperature thresholds | Same lesson, one formula |
| Climate refugees | **CUT** | Interesting but adds a whole mechanic |
| Post-game replay/analytics | **CUT** | End-game comparison table is sufficient |
| Sanctions system | **SIMPLIFIED** → UN resolution penalties | Bilateral sanctions too complex for MVP |

---

## What Remains (Complete Feature List)

1. **React + Firebase multiplayer** with rooms, timer, real-time sync
2. **5 asymmetric countries** with real-world-grounded stats
3. **6 resources** (money, energy, food, population, CO2, approval)
4. **3 factions per country** with satisfaction-driven approval
5. **Budget allocation** across 5 categories
6. **Carbon tax slider**
7. **Upgrade slots** (land-scaled) with a flat upgrade list
8. **Single tech level** (1-3) unlocking better upgrades
9. **Bilateral deals** (instant, no logistics)
10. **UN summit votes** every 2-3 cycles with binding resolutions
11. **Historical emissions ledger** (CBDR-RC mechanic)
12. **Global temperature** with 4 threshold penalties
13. **Comparative dashboard** (all 5 countries side-by-side)
14. **End-game scoring** with comparative analysis table

That's 14 features. The v3 design had 40+. This is the game the module actually needs.

---

## Firebase Data Model (Minimal)

```
rooms/{roomId}/
  meta: { status, currentCycle, cycleDeadline, hostId }
  players/{odPlayerId}: { name, countryId, ready }
  countries/{countryId}: {
    money, energy, food, population, co2, approval,
    gdp, fossilCapacity, renewableCapacity, techLevel,
    carbonTax, budget: {economy, energy, social, research, diplomacy},
    factions: [{name, weight, satisfaction, prefClimate, prefSpending}],
    upgrades: [list of built upgrades],
    maxSlots, historicalEmissions
  }
  cycles/{cycleNum}/
    decisions/{countryId}: { carbonTax, budget, upgrade, deals }
    votes/{countryId}: { resolutionId, vote }
    summary: { ... }
  deals/{dealId}: { from, to, give, get, duration, status }
  global: { temperature, cumulativeEmissions, activeResolution }
  relations/{pairKey}: { score }
```

---

## What Could Be Added Later (Post-MVP)

If time allows, in priority order:

1. Event cards (oil shock, drought, election backlash) — adds unpredictability
2. OPEC+ oil price lever — most impactful unique mechanic
3. Simple bot autopilot for empty seats — weighted priority selection
4. Visual country map (cosmetic, not functional) — makes the UI nicer
5. Brussels Effect on trade deals — policy diffusion mechanic
6. China's rare earth leverage — strategic resource control

Each of these is a self-contained addition, not a dependency chain.
