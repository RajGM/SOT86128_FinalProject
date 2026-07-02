# Climate Diplomacy - TUM-Aligned Simplified Scope

## Purpose

This file simplifies the current game concept so it fits the TUM module POL23200, "Environmental Politics in International Comparison", without turning the project into a full commercial strategy game.

The course focus is not "build the biggest game possible". The focus is to model environmental politics comparatively: institutions, actors, policy conflicts, governance instruments, implementation problems, international bargaining, and the reasons why pioneer and laggard states produce different environmental policy outcomes.

The game should therefore be a focused political simulation with enough economic modeling to create tradeoffs, not a complete world simulator.

## Short Version

Keep:

- React frontend.
- Firebase multiplayer with rooms and real-time synchronization.
- Five asymmetric players: USA, EU, China, India, and OPEC+.
- Core world model: money, resources, energy, food, population, happiness/approval, emissions, and international relations.
- Economic model: GDP/money, emissions, HDI/welfare, budget allocation, energy mix, trade dependence.
- Domestic politics: factions, approval, policy tolerance, political backlash.
- International politics: trade deals, technology transfer, UN resolutions, climate finance, sanctions/non-compliance penalties.
- Climate model: global temperature, emissions accumulation, climate thresholds, shared global consequence.
- Advisory layer: game-theory suggestions, resource map, priority map, consequence tree, and comparative charts.
- Comparative dashboard and end-game analysis.

Simplify:

- The hex map.
- Infrastructure details.
- Transport logistics.
- Fog of war.
- Media and information warfare.
- Technology tree.
- Climate disasters and refugee mechanics.
- Bot AI.
- Post-game replay and analytics.
- Rigid multi-phase turn structure.

The final product should feel like a playable seminar simulation for environmental politics, not a grand strategy game.

## TUM Module Alignment

| TUM module requirement | Simplified game response |
|---|---|
| Identify key concepts and theories of environmental policy | Players encounter collective action, CBDR-RC, policy diffusion, pioneer/laggard dynamics, regulatory competition, and fossil lock-in. |
| Distinguish theoretical approaches | Country profiles represent different political-economic logics: liberal market economy, regulatory state, developmental state, emerging economy, petrostate. |
| Apply comparative analysis | The dashboard compares all countries using the same indicators: money/GDP, resources, energy, food, population, happiness, emissions, historical responsibility, and treaty compliance. |
| Compare institutions, actors, processes, and outcomes | Domestic factions model actors; budgets and carbon taxes model institutions/instruments; UN votes and trade deals model processes; scores model outcomes. |
| Evaluate environmental policy outcomes comparatively | End-game summary asks why some countries decarbonized, why others delayed, and how domestic politics and international constraints shaped results. |

This means the game only needs enough mechanics to make these comparisons visible.

## Non-Negotiable Core

These features should remain because they directly support the module and project specification.

### 1. React + Firebase Multiplayer

Must remain.

Minimum version:

- React/Vite browser app.
- Firebase Anonymous Auth.
- Firebase Realtime Database or Firestore rooms.
- Room code creation and joining.
- Host starts game.
- 2-5 human players.
- Empty countries can be bot-controlled or use simple automatic default actions.
- Shared game state updates after each five-minute decision cycle.

Simplification:

- Multiplayer does not need live animation, action-by-action sync, or complex conflict resolution.
- Players can adjust decisions during the five-minute cycle.
- Firebase stores submitted decisions.
- When the five-minute cycle timer ends, the system locks submissions, applies changes, and immediately starts the next cycle.

### 2. Economic and Policy Model

Must remain.

Minimum indicators per country:

- Money/treasury.
- GDP.
- Resource access or stockpiles.
- Energy supply and demand.
- Food supply and demand.
- Population.
- Happiness/approval.
- Emissions.
- Emissions per capita or emissions intensity.
- HDI/welfare.
- Energy mix: fossil, renewable, nuclear/low-carbon.
- Budget split.
- Technology level.
- Historical emissions share.
- Bilateral relations with every other player.

Minimum player actions during each five-minute decision cycle:

- Set carbon tax or climate ambition.
- Allocate budget across 4-5 categories:
  - Economy/industry.
  - Energy transition.
  - Social welfare/compensation.
  - Research/technology.
  - Diplomacy/climate finance.
- Choose one policy card or infrastructure upgrade.
- Make or accept trade/technology/climate finance deals.
- Decide with whom to cooperate, trade, finance, pressure, or compete.
- Vote on UN resolutions when a summit vote is active.

Simple model loop:

- Money funds policy.
- Resources determine what each country can produce or trade.
- Energy powers the economy and affects emissions.
- Food supports population and happiness.
- Population creates labor, demand, and political pressure.
- Happiness/approval determines whether ambitious policy is politically sustainable.
- International relations determine who can access missing resources, technology, finance, and support.
- Total emissions change the shared climate trajectory, which then feeds back into food, money, happiness, and stability.

Simplification:

- Avoid modeling every sector separately.
- Avoid detailed population services such as hospitals, police stations, fire stations, and city placement.
- Use formulas that are transparent enough to explain in the paper.

### 3. Advisory Maps, Charts, and Decision Tree

Must remain, but as a simplified decision-support layer rather than a complex AI system.

The game should show players what the model thinks is important, but the player must still decide what to do and with whom to cooperate. The advisory layer should never automatically choose policy for the player.

Minimum advisory views:

- Resource map:
  - Shows which countries control key resources: fossil fuels, rare earths, food capacity, renewable potential, finance, and technology.
  - Can be a simplified country/bloc map or a matrix, not a detailed hex map.

- Priority map:
  - Shows each country's current stress points.
  - Example: energy shortage, food shortage, low happiness, high emissions, weak relations, low money, technology gap.
  - Uses color levels such as stable, warning, crisis.

- Game-theory suggestion map:
  - Suggests useful partners and risks.
  - Example: "India needs clean technology; EU has climate finance; China controls rare earths; OPEC+ can offer cheap fossil energy but raises emissions."
  - The suggestion is advisory only. The player decides whether to follow, reject, or exploit it.

- Comparative charts:
  - Money/GDP.
  - Emissions.
  - Energy mix.
  - Food security.
  - Population pressure.
  - Happiness/approval.
  - International relations.
  - Global temperature.

- Consequence tree:
  - A small recurrent decision tree showing likely effects of a chosen action.
  - Example: raise carbon tax -> emissions down -> industry satisfaction down -> happiness risk -> social spending can reduce backlash.
  - Example: buy oil from OPEC+ -> energy shortage solved -> emissions up -> fossil dependency up -> OPEC+ relations improve.

Simplification:

- The maps are visual summaries of the model, not separate simulation systems.
- The game-theory layer uses simple weighted recommendations, not full Nash-equilibrium computation.
- The consequence tree should show 2-3 likely effects, not a huge branching strategy tree.

### 4. Domestic Politics

Must remain because actor constellations are central to the module.

Minimum version:

- Each country has 3 factions instead of 4.
- Each faction has:
  - Political weight.
  - Satisfaction.
  - Preferred climate ambition.
  - Preferred economic/social priority.
- Approval is the weighted average of faction satisfaction.
- Low approval reduces policy capacity or causes rollback risk.

Recommended simplified factions:

| Country | Faction 1 | Faction 2 | Faction 3 |
|---|---|---|---|
| USA | Green/Tech Coalition | Industry/Fossil Lobby | Populist Consumers |
| EU | Green Parties | Industrial Competitiveness | Social Welfare Coalition |
| China | Technocrats | Growth/Provincial Industry | Stability/Security Bloc |
| India | Development Coalition | Climate Justice Movement | Agricultural/Rural Base |
| OPEC+ | Fossil Establishment | Diversification Modernizers | Stability/Security Bloc |

Simplification:

- Remove multi-tier media mechanics.
- Replace with one action: "Public Support Campaign", which increases one faction's satisfaction or reduces backlash from a policy.
- Remove foreign information warfare from the MVP.

### 5. International Bargaining

Must remain.

Minimum version:

- Bilateral deals:
  - Fossil fuel supply.
  - Rare earth or green technology supply.
  - Technology transfer.
  - Climate finance.
  - Emissions credit/offset agreement.
- UN summit appears as a vote card inside the five-minute decision cycle after every two cycles.
- Resolutions pass by supermajority.
- Resolutions can create:
  - Carbon tax floors.
  - Climate finance obligations.
  - Technology sharing.
  - Coal phaseout targets.
  - Penalties for non-compliance.

Simplification:

- Do not simulate route-by-route logistics.
- Trade works as a contract between players with cost, benefit, and emissions effects.
- Chokepoints can be represented as event cards or modifiers, not map pathfinding.

### 6. Climate and Shared Outcome

Must remain.

Minimum version:

- Global temperature starts at a fixed value.
- Each automatic update after a five-minute cycle adds warming based on total net emissions.
- Forests/carbon capture can reduce net emissions, but only as simple modifiers.
- Temperature thresholds trigger global or country-specific penalties.
- A shared climate score affects everyone.

Simplification:

- Use 3-4 thresholds instead of detailed geographic climate damage.
- Example:
  - +1.5 C: climate events become more frequent.
  - +2.0 C: agriculture and HDI penalties.
  - +2.5 C: adaptation costs rise.
  - +3.0 C: severe shared score penalty.
- Remove per-hex sea level rise, refugee flows, wildfire spread, and detailed disaster geography from the MVP.

## What Should Be Simplified

### Hex Map

Current design:

- 60 x 30 map.
- Terrain-specific placement.
- One building per hex.
- Detailed resources, chokepoints, pathfinding, climate impact zones.

Simplified version:

- Use a symbolic world map or country panels.
- Each country has 6-10 "strategic assets" instead of dozens of hexes.
- Assets can be:
  - Fossil base.
  - Renewable potential.
  - Manufacturing capacity.
  - Rare earth access.
  - Agricultural vulnerability.
  - Forest/carbon sink.
  - Port/trade access.
  - Research capacity.
- The map is mainly for orientation and comparison, not detailed spatial simulation.

Recommended MVP:

- No full hex grid.
- If a map is needed visually, use a simplified clickable region map.
- Keep geography as country attributes and strategic assets.

Reason:

The module is about comparative environmental politics, not geographic route optimization.

### Infrastructure

Current design:

- Solar plants, wind farms, coal plants, gas plants, nuclear plants, hydro dams, oil rigs, mines, farms, hospitals, police, fire stations, ports, airports, rail hubs, pipelines, research labs, military bases, carbon capture, canals.

Simplified version:

- Collapse infrastructure into upgrade categories:
  - Fossil Energy Capacity.
  - Renewable Energy Capacity.
  - Grid/Storage.
  - Industrial Capacity.
  - Social/Adaptation Capacity.
  - Research Capacity.
  - Carbon Sink/Removal.

Player action:

- Build or upgrade one category during each five-minute decision cycle.

Reason:

The political tradeoff remains: fossil growth is cheap but dirty; green transition costs money but reduces emissions; social spending protects approval; research helps later. The exact building list is not necessary.

### Trade and Logistics

Current design:

- Ships, planes, rail, pipelines.
- A* pathfinding.
- Route ticks.
- Chokepoints.
- Transport emissions.

Simplified version:

- Trade deals are contracts with direct effects.
- Each deal has:
  - Resource or technology transferred.
  - Price or concession.
  - Duration.
  - Emissions impact.
  - Dependency impact.
- Chokepoints become occasional events or country-specific leverage.

Example:

- OPEC+ sells oil to EU for 3 cycles: EU GDP stability +, EU emissions +, OPEC+ GDP +, EU fossil dependency +.
- China licenses battery technology to India: India renewable transition cost -, China diplomacy/GDP +.
- EU climate finance to India: India approval + and emissions -, EU GDP cost but diplomatic score +.

Reason:

This keeps interdependence and bargaining without forcing the project to become a logistics simulator.

### Technology Tree

Current design:

- Large branching tree with many technologies.

Simplified version:

Use 3 tracks with 3 levels each:

| Track | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| Clean Energy | Cheaper renewables | Grid storage | Deep decarbonization |
| Industrial Transition | Efficiency | Low-carbon industry | Circular economy |
| Adaptation/Governance | Disaster readiness | Social resilience | High compliance capacity |

Reason:

Research remains meaningful, but players can understand it quickly during a 20-30 minute seminar game.

### Bot AI

Current design:

- Nash equilibrium, tit-for-tat, minimax, maximin, Nash bargaining.

Simplified version:

- Each bot uses a country-specific priority weight table.
- Bots select the action with the highest weighted score.
- Example weights:
  - USA: GDP high, approval high, emissions medium-low.
  - EU: emissions high, diplomacy high, GDP medium.
  - China: GDP high, technology high, emissions medium.
  - India: HDI high, equity high, GDP medium.
  - OPEC+: fossil revenue high, transition low unless climate finance is offered.

Reason:

The paper can still explain theoretical behavior, but implementation stays manageable.

### Fog of War

Current design:

- Multiple visibility tiers.
- Hidden resource data.
- Intelligence systems.

Simplified version:

- Remove fog of war for the MVP.
- All major indicators are public.
- Trade offers and submitted actions can remain private until the current cycle resolves if desired.

Reason:

The module requires comparison. Hidden information makes comparison harder and adds engineering work.

### Events

Current design:

- Large climate, political, and economic event system.

Simplified version:

- Use a small event deck of 10-15 cards.
- Events trigger based on temperature, approval, or trade dependence.
- Each event modifies one or two indicators.

Example events:

- Oil price shock.
- Youth climate protest.
- Drought.
- Green technology cost drop.
- Trade conflict.
- Election backlash.
- Climate finance scandal.

Reason:

Events add realism and surprise, but should not dominate the core model.

### Scoring and Analytics

Current design:

- Many categories and advanced replay/what-if analytics.

Simplified version:

Final score:

| Component | Weight |
|---|---:|
| Domestic welfare: GDP + HDI + approval | 30% |
| Emissions reduction | 25% |
| International cooperation: treaties, finance, trade fairness | 20% |
| Equity and historical responsibility handling | 10% |
| Shared global climate outcome | 15% |

End-game output:

- Final country comparison table.
- Temperature graph.
- Emissions graph.
- Short explanation of each country's outcome.
- Optional export/screenshot for the seminar paper.

Reason:

This directly supports comparative evaluation without requiring a replay engine.

## What To Defer

These features are good ideas but should not be part of the first course-aligned build:

- Full hex-grid world simulation.
- One-building-per-hex infrastructure placement.
- Detailed terrain compatibility matrix.
- Transport pathfinding and moving ships/planes.
- Pipeline and rail construction networks.
- Full fog of war and intelligence mechanics.
- Information warfare.
- Detailed climate refugee flows.
- Per-hex sea level rise and wildfire simulation.
- Large technology tree.
- Complex game-theoretic bot algorithms.
- Replay system.
- Tournament mode.
- Scenario editor.
- Real-data API integration.
- Classroom professor dashboard.
- Sound and visual polish beyond usability.

These can be listed as limitations or future extensions in the final report.

## Recommended MVP Game Loop

Use a continuous five-minute decision cycle.

Each cycle is 5 minutes total. During those 5 minutes, players can inspect charts and maps, read the advisory suggestions, negotiate, adjust policy, propose deals, and submit their final decision. When the timer reaches zero, the system automatically locks the current inputs, applies the model update, shows a short summary, and starts the next 5-minute cycle.

What players see during the whole cycle:

- Country dashboard: money, resources, energy, food, population, happiness, emissions, and relations.
- Resource map: who controls oil, gas, rare earths, food capacity, renewable potential, finance, and technology.
- Priority map: what is currently urgent for each player.
- Game-theory suggestion map: recommended partners, likely conflicts, and possible bargaining leverage.
- Consequence tree: likely effects of the player's current planned decision.
- International relations panel: deals, offers, treaty obligations, and trust levels.

What players can do during the cycle:

- Set carbon tax or climate ambition.
- Allocate budget.
- Choose one policy or infrastructure upgrade.
- Propose, accept, or reject international deals.
- Vote on a UN resolution if one is active.
- Revise choices until the timer ends.

Automatic update at the end of each cycle:

- Update money/GDP.
- Update resources, energy, and food balance.
- Update population pressure and happiness/approval.
- Update emissions and global temperature.
- Update bilateral relations and treaty compliance.
- Update technology progress and policy effects.
- Display a short cycle summary.

UN votes should not require a separate long phase. After every two normal cycles, a UN resolution card appears inside the same 5-minute decision cycle. Players can still manage domestic policy and deals, but they must also vote before the timer ends.

The MVP can run for a fixed total time, for example 45 minutes:

- 5 minutes setup/lobby.
- 35 minutes active simulation, equal to 7 decision cycles.
- 5 minutes final comparison and discussion.

Why this is better:

- It feels more like politics under time pressure.
- It reduces waiting for slower players.
- It keeps the game moving even if one player hesitates.
- It works well for multiplayer because Firebase only needs to synchronize the cycle timer, submitted decisions, deals, votes, and resolved state.
- It still gives the model clean update moments, which keeps the economics and climate calculations understandable.

## Recommended Data Model

Firebase can stay simple.

```text
rooms/{roomId}
  metadata:
    status
    currentCycle
    cycleStartedAt
    hostId
    cycleDeadline
    activeResolutionId

  players/{playerId}:
    displayName
    countryId
    ready
    isBot

  countries/{countryId}:
    money
    gdp
    resources
    energy
    food
    population
    happiness
    emissions
    hdi
    approval
    energyMix
    carbonTax
    budget
    techLevels
    factions
    historicalEmissions
    strategicAssets

  cycles/{cycleId}:
    actions/{countryId}
    deals/{dealId}
    votes/{countryId}
    advisory/{countryId}
    results/{countryId}

  global:
    temperature
    cumulativeEmissions
    activeResolution
    eventHistory

  relations/{countryPairId}:
    score
```

Do not store per-hex state in the MVP.

## Suggested Course Project Framing

Working title:

"Climate Diplomacy: A Multiplayer Simulation of Comparative Environmental Politics"

Research question:

"How can a multiplayer simulation model the interaction between domestic actor constellations, economic constraints, and international bargaining in comparative environmental politics?"

Argument:

The game demonstrates that environmental policy outcomes differ not only because countries have different resources, but because they have different domestic coalitions, historical responsibilities, economic dependencies, and positions in international negotiation structures.

Method:

- Design-based simulation.
- Comparative case abstraction of five political-economic blocs.
- Playtest observation.
- Post-game comparative analysis.

Important limitation:

The game simplifies geography, demography, and infrastructure to keep the analytical focus on environmental politics.

## Final Scope Statement

Climate Diplomacy is a React and Firebase multiplayer browser simulation in which five asymmetric country/bloc players manage a simplified world model of money, resources, energy, food, population, happiness, emissions, and international relations. The game runs through automatic five-minute decision cycles. During each cycle, players inspect charts, maps, game-theory suggestions, and a consequence tree, but they still decide whom to trade with, cooperate with, finance, pressure, or oppose. The simplified version removes detailed hex logistics and full infrastructure simulation so that the project remains feasible and clearly aligned with the TUM module's focus on comparative environmental politics.
