# Region Build and Trade Rules Brainstorm

## Purpose

This file clarifies the next gameplay layer before implementation: region resource identity, possible builds, resource-gated construction, happiness agendas, transport infrastructure, and international trade permissions.

The goal is still a simplified environmental politics simulation, not a full city builder. The map and buildings should support political decisions: who has what, who needs whom, what kind of development each region chooses, and whether the world becomes sustainable.

## Core Idea

Each region has:

- A map area made of model-sized tiles.
- Specific resource strengths.
- Population and happiness pressures.
- Domestic agenda preferences.
- A need to trade with other regions to cover weaknesses.

Players manage a small world model:

- Money.
- Resources.
- Energy.
- Food.
- Population.
- Happiness.
- CO2 emissions.
- International relations.

Every 5-minute cycle, players inspect the map, charts, recommendations, and consequence tree, then decide what to build, whom to trade with, and what political agreements to make.

## Region Resource Identity

Each region should be clearly rich in one or two things. This makes the international politics readable: no region can be self-sufficient in everything.

Suggested starting identity:

| Region | Main richness | Secondary strength | Main weakness |
|---|---|---|---|
| USA | Money and industrial capacity | Food, oil/gas, technology | High emissions, political polarization |
| EU | Technology and regulation | Green industry, finance | Limited raw resources, energy dependence |
| Russia | Gas and coal | Land, minerals, northern route leverage | Fossil dependence, lower diversification |
| China | Manufacturing and rare earths | Coal, technology scaling | High energy demand, high emissions |
| India | Population and solar potential | Food potential, low historical emissions | Energy shortage, lower money/technology |
| OPEC+ | Oil and gas | Solar potential, money from fossil exports | Low food diversity, fossil lock-in |
| Latin America | Food and forests | Hydro, minerals/lithium | Infrastructure and finance gaps |
| Africa | Solar and minerals | Population growth, food potential | Energy access and capital shortage |

Design rule:

- Every region should have a reason other players need it.
- Every region should have a reason it needs other players.
- Resource asymmetry should create negotiation, not automatic victory.

## Tile and Resource Model

The map should remain simple. Tiles do not need deep simulation, but they should make build placement meaningful.

Suggested tile tags:

| Tile tag | Enables |
|---|---|
| Oil | Oil plant, oil extraction, fossil export deals |
| Gas | Gas plant, gas extraction, fossil export deals |
| Coal | Coal plant, coal extraction, cheap industrial energy |
| Hydro | Hydro power plant |
| Solar | Solar power plant |
| Uranium/Nuclear | Nuclear power plant |
| Arable | Farm, high-tech farm |
| Mineral/Rare Earth | Manufacturing, green technology supply chain |
| Coastal | Dock/port, sea trade |
| Urban/Workforce | City, industry, manufacturing efficiency |

Open design question:

- Should a power plant require a local resource tile only, or should imports also unlock it?

Recommended simple rule for MVP:

- Building a plant requires a matching local resource tile.
- Later extension: allow imported fuel to power a plant, but make it dependent on an active trade route.

## Build Categories

Any region can build from the same menu, but not every build is available everywhere because some builds require specific resource tiles.

General tier meaning:

| Tier | Meaning |
|---|---|
| Tier 1 | Cheap, fast, low output, usually less efficient |
| Tier 2 | Medium cost, better output, may require technology or higher population |
| Tier 3 | Expensive, high output, lower emissions per unit, requires stability/technology |

Tier upgrades should improve output without forcing too many building types.

## Money and Production Builds

Money is generated through domestic production and international deals.

### Trade and Agreements

Not a building, but a major money source.

Effects:

- Exporting scarce resources gives money.
- Importing missing resources costs money but solves shortages.
- Long-term agreements improve relations.
- Broken agreements damage trust and future trade access.

### Industrial Complex, Tier 1-3

Purpose:

- Converts energy and resources into money/GDP.

Effects:

- Money up.
- Energy demand up.
- CO2 up unless powered by clean energy.
- Happiness may fall if pollution becomes high.

Suggested requirements:

- Tier 1: any non-ocean tile.
- Tier 2: requires city or workforce nearby.
- Tier 3: requires high technology or manufacturing base.

### Manufacturing Building, Tier 1-3

Purpose:

- Converts minerals/rare earths, energy, and labor into manufactured value.

Effects:

- Money up.
- Goods production up.
- Technology progress can improve.
- Energy demand and CO2 increase unless clean energy share is high.

Suggested requirements:

- Tier 1: any region can build.
- Tier 2: requires mineral/rare earth tile or import agreement.
- Tier 3: requires technology level and stable energy.

### Goods Production, Tier 1-3

Purpose:

- Produces consumer goods that support money and happiness.

Effects:

- Money up.
- Happiness up if goods per population is adequate.
- Tradeable as "goods" to regions with population pressure.

Suggested requirements:

- Tier 1: manufacturing building or industrial complex.
- Tier 2: requires stable energy.
- Tier 3: requires advanced manufacturing or technology.

## Energy Builds

Energy powers industry, cities, farms, airports, docks, and high-tech systems. Energy shortages should create strong pressure.

Basic rule:

- Power plants can only be built on a matching resource tile.
- Each plant produces energy.
- Fossil plants produce more CO2.
- Clean plants cost more or need technology, but reduce emissions.

Suggested energy builds:

| Build | Required tile | Main benefit | Main cost/risk |
|---|---|---|---|
| Oil Plant | Oil | High energy, strong money synergy for oil regions | High CO2, fossil lock-in |
| Gas Plant | Gas | Reliable energy, lower CO2 than coal/oil | Still fossil dependent |
| Coal Plant | Coal | Cheap and strong early energy | Very high CO2, happiness/pollution risk |
| Hydro Plant | Hydro | Clean stable energy | Limited by geography |
| Solar Plant | Solar | Clean energy, strong in sunny regions | Lower reliability unless upgraded |
| Nuclear Plant | Uranium/Nuclear | High clean energy | High cost, political/happiness risk if agenda opposes it |

Optional tier approach:

- Tier 1 plant: basic output.
- Tier 2 plant: higher output and better efficiency.
- Tier 3 plant: high output, lower emissions or higher stability.

Design note:

- For simplicity, all energy should go into a national/regional energy pool rather than requiring local grid simulation.

## Population Builds

Population is not just "more is better". It creates labor, demand, food need, energy need, and political pressure.

### Village, Tier 1-3

Purpose:

- Adds population slowly and supports rural stability.

Effects:

- Population up.
- Food demand up slowly.
- Happiness stable if food and energy are adequate.

Suggested use:

- Good for regions with food or land advantage.

### City, Tier 1-3

Purpose:

- Adds workforce and economic scale.

Effects:

- Population up.
- Money potential up.
- Energy and food demand up.
- Happiness becomes more sensitive to pollution, shortages, and unemployment.

Suggested use:

- Needed for higher-tier industry, manufacturing, airports, and goods production.

### Green City, Tier 1-3

Purpose:

- Population growth with lower environmental pressure.

Effects:

- Population up.
- Happiness up.
- Lower emissions and lower energy waste than normal city.
- Costs more money and technology.

Suggested requirements:

- Tier 1: city plus clean energy share.
- Tier 2: technology level.
- Tier 3: high clean energy and high happiness.

Design note:

- Green city should be a political choice: expensive, slower, but stabilizes happiness and climate outcomes.

## Food Builds

Food supports population and happiness. Food shortage should be one of the clearest crisis signals on the priority map.

### Farm, Tier 1-3

Required tile:

- Arable.

Effects:

- Food up.
- Water/climate vulnerability.
- Low technology requirement.

Tier meaning:

- Tier 1: basic food.
- Tier 2: better yield.
- Tier 3: strong yield but higher energy/water demand.

### High-Tech Farm, Tier 1-3

Required tile:

- Arable.

Additional requirements:

- Technology level.
- Energy stability.

Effects:

- Food up strongly.
- Less climate vulnerability.
- Higher energy use.
- Higher money cost.

Design note:

- High-tech farming gives rich or tech-heavy regions a way to reduce food risk, but it should not erase the value of naturally food-rich regions.

## Happiness and Agendas

Each region should have happiness as both a local and global indicator.

Country/region happiness:

- Affects political stability.
- Affects whether ambitious climate policy can continue.
- Falls when there are shortages, pollution, broken promises, unemployment, or agenda conflicts.
- Rises when the player meets domestic needs and follows agenda-compatible policies.

Overall world happiness:

- Represents global legitimacy and perceived fairness.
- Falls when climate disasters rise, inequality grows, or major agreements fail.
- Rises when emissions fall without causing mass shortages.

Agenda examples:

| Region | Agenda preferences |
|---|---|
| USA | Money, industry, consumer prices, technology, moderate transition |
| EU | Clean energy, regulation, international cooperation, social stability |
| Russia | Fossil revenue, energy leverage, stability, slow transition |
| China | Manufacturing, energy security, technology, stability |
| India | Development, energy access, food security, climate justice |
| OPEC+ | Fossil exports, money, stability, paid diversification |
| Latin America | Food exports, forest protection payments, development finance |
| Africa | Energy access, development, climate finance, food security |

Agenda rule:

- If a build or deal matches the region's agenda, happiness penalty is lower or happiness gain is higher.
- If a build or deal violates the agenda, it can still be done, but it creates political cost.

Examples:

- EU building solar: happiness up.
- EU building coal: energy up, but happiness and legitimacy down.
- India receiving climate finance for solar: happiness up, emissions path improves.
- OPEC+ rapidly shutting oil without compensation: emissions down, but happiness and money crash.

## Transport Builds

Transport makes trade possible. It also creates emissions and political dependence.

### Airport, Tier 1-3

Purpose:

- Enables air trade and high-value urgent cargo.

Tier effects:

| Tier | Cargo | Range | Emissions |
|---|---|---|---|
| Tier 1 | Low | Short | High per unit |
| Tier 2 | Medium | Medium | Medium per unit |
| Tier 3 | High | Long | Lower per unit, but still not zero |

Rules:

- Both origin and destination need airports.
- Higher tier allows more cargo, more range, and lower emissions per cargo.
- If the route crosses a third region's airspace, that third region must grant air transit permission.
- A top-tier airport does not bypass political permission.

### Dock/Port, Tier 1-3

Purpose:

- Enables sea trade for heavy resources and food.

Tier effects:

| Tier | Cargo | Range | Emissions |
|---|---|---|---|
| Tier 1 | Medium | Regional | Medium |
| Tier 2 | High | Intercontinental | Lower per unit |
| Tier 3 | Very high | Intercontinental | Best efficiency |

Rules:

- Requires coastal tile.
- Both origin and destination need docks for regular sea trade.
- Sea trade can move more cargo than air trade.
- Sea routes may require permission through controlled chokepoints if included later.

### Road/Land Connection

Purpose:

- Enables direct trade across borders and indirect trade through intermediate regions.

Rules:

- Regions sharing a border can trade directly by land if relations allow it.
- Regions not directly connected need an intermediate region with a transit agreement.
- If a route crosses multiple intermediate regions, every intermediate region must grant permission.
- A transit country can charge a fee or demand political concessions.

Example:

- EU trades with China by land.
- If the route passes through Russia, Russia must allow transit.
- If Russia refuses, EU and China must use sea/air routes or another diplomatic path.

## Trade Route Permission Rules

Trade should be political, not automatic.

### Direct Border Trade

Allowed when:

- Regions share a border.
- Neither side has blocked trade.
- The deal is accepted by both players.

Examples:

- China and India.
- EU and Russia.
- USA and Latin America.

### Indirect Land Trade

Allowed when:

- Origin and destination accept the deal.
- Every intermediate region gives transit permission.
- The route has enough road/land capacity.

Effects:

- Intermediate region may earn transit money.
- Intermediate region gains diplomatic leverage.
- Broken relations can disrupt supply chains.

### Sea Trade

Allowed when:

- Origin and destination both have docks.
- Dock tiers support the cargo size/range.
- Any required chokepoint permission is granted, if chokepoints are modeled.

Best for:

- Oil.
- Gas.
- Food.
- Bulk goods.
- Minerals.

### Air Trade

Allowed when:

- Origin and destination both have airports.
- Airport tiers support the range and cargo.
- Every crossed airspace region gives permission.

Best for:

- Technology.
- High-value goods.
- Emergency food or energy support.

Rule:

- Airport tier improves capacity and range, but does not remove airspace permission.

## Suggested Tradeable Items

Keep the trade menu short.

| Trade item | Why it matters |
|---|---|
| Money | Climate finance, compensation, investment |
| Energy | Covers shortages, enables industry |
| Food | Supports population and happiness |
| Fossil fuel | Cheap energy but high CO2 |
| Minerals/Rare earths | Enables manufacturing and green technology |
| Technology | Enables higher-tier clean builds |
| Goods | Supports money and happiness |
| Transit permission | Enables indirect trade |
| Airspace permission | Enables air routes |

Design note:

- Avoid too many separate resources at first. Oil/gas/coal can exist as tile tags and trade categories, but the dashboard can still summarize them under "energy resources".

## Game-Theory Suggestions

The game should suggest what is needed, but not decide for the player.

Suggestion examples:

- "Your energy shortage threatens industry. Recommended options: build gas plant, import energy from OPEC+, or invest in solar if you have a solar tile."
- "Your food per population is low. Recommended options: build farm, import food from Latin America, or negotiate aid."
- "China controls rare earths. Green technology costs will be higher unless you trade, invest, or find alternative suppliers."
- "Russia is an intermediate land route between EU and China. Transit permission may be valuable."
- "Your planned coal plant improves energy but lowers happiness because your agenda favors clean transition."

Recommended implementation:

- Use simple priority scoring, not advanced AI.
- Show 2-3 suggestions per cycle.
- Let players ignore recommendations.

## Priority Map

The priority map should visually show what each region currently lacks.

Suggested status levels:

| Status | Meaning |
|---|---|
| Green | Stable |
| Yellow | Watch |
| Orange | Problem |
| Red | Crisis |

Priority categories:

- Money.
- Energy.
- Food.
- Population pressure.
- Happiness.
- Emissions.
- Trade access.
- Technology gap.

Example:

- India: energy red, food yellow, happiness yellow, emissions green.
- EU: energy orange, technology green, emissions green, trade access yellow.
- OPEC+: money green, energy green, food orange, emissions red.

## Consequence Tree

The consequence tree should be small and readable.

Example 1:

```text
Build Coal Plant
  -> Energy +++
  -> Money potential +
  -> CO2 +++
  -> Happiness - if clean agenda is strong
  -> Global temperature pressure +
```

Example 2:

```text
Import Food from Latin America
  -> Food shortage reduced
  -> Happiness +
  -> Money -
  -> Latin America money +
  -> Relations with Latin America +
  -> Requires valid route or port access
```

Example 3:

```text
Build Green City
  -> Population capacity +
  -> Happiness +
  -> Energy demand +
  -> CO2 lower than normal city
  -> Requires money, technology, and clean energy share
```

## Research and Technology

Research solves two problems: it gives top-tier regions a reason to keep investing, and it creates diplomatic pressure to cooperate rather than isolate.

### Post-Tier-3 Infinite Research

Once a region maxes out a building category at Tier 3, it unlocks infinite incremental research upgrades for that category. Each upgrade improves output by a fixed small amount (e.g. +5% efficiency per level). The cost increases linearly: level 1 costs X, level 2 costs 2X, level 3 costs 3X, and so on.

This means rich regions always have something to spend on, but the returns diminish relative to cost — a region at research level 10 is only marginally better than level 7, while having spent far more. Poorer regions that stabilize and reach Tier 3 can catch up to a competitive level without needing to match every research level.

Design rule: infinite research should never create an unbeatable advantage. It should feel like optimization, not domination.

### Breakthrough Research (Collaborative)

Breakthroughs are special research events that unlock fundamentally new capabilities — more sustainable versions of existing infrastructure, new building types, or efficiency jumps that incremental research cannot reach.

Rules:

- A breakthrough requires at least 4 regions to collaborate.
- USA and EU are always required participants (they represent the technology and regulation base needed for breakthroughs).
- The other 2 participants are drawn randomly each cycle from the remaining 6 regions.
- All 4 participating regions must agree and contribute resources.
- If any required region refuses, the breakthrough does not happen that cycle — new random partners are drawn next cycle.

Breakthrough effects:

- Unlocks a sustainable upgrade path for existing infrastructure (e.g. carbon capture retrofit for fossil plants, fusion energy, vertical farming).
- All participating regions receive the breakthrough immediately.
- Non-participating regions must acquire it through trade (see below).

Design note: making USA and EU mandatory reflects the real-world dynamic where major technology transitions require Western research infrastructure, but randomizing the other partners creates unpredictable alliances and forces diplomacy with regions players might otherwise ignore.

### Research Licensing and Sales

Regions that hold a research breakthrough (either from participating or purchasing) can sell it to other regions. Two licensing models:

1. One-time fee: the buyer pays a large lump sum and owns the research permanently. Simple, clean, no ongoing obligations.
2. Royalty agreement: no upfront cost (or a small one), but the buyer pays a percentage of revenue generated by infrastructure using that research, indefinitely. This creates a long-term income stream for the seller and a long-term cost for the buyer.

Design rule: the seller chooses which model to offer. The buyer can accept, reject, or counter-propose. This creates real negotiation — a cash-poor region might prefer royalties now, while a cash-rich region might prefer to pay once and be done.

### Combined Research (Pooled Projects)

Any 3 to 5 regions can propose a combined research project targeting a specific upgrade or capability. This is distinct from breakthroughs — combined research is player-initiated, not event-driven.

Rules:

- 3 to 5 regions agree on a research goal and pool resources toward it.
- Each region contributes what it can (money, technology, resources). Contributions do not need to be equal.
- All contributing regions receive the research result immediately upon completion.
- The last 1-2 regions to join (or regions that contributed significantly less than others) receive the research but must pay a discounted price to the pool — they benefit from the work but compensate the heavier contributors.

Design note: this creates a "free rider" tension. Joining a pool late or contributing little is cheaper than leading, but the discount is not free — and other regions may refuse to include a known free rider in future projects. This mirrors real-world climate finance debates where developing nations argue for technology access while developed nations want cost-sharing.

Example scenario:

- EU proposes combined research on advanced solar storage.
- EU, USA, and India contribute heavily. China joins but contributes less.
- All four get the research. China pays a discounted fee to the pool.
- Africa and OPEC+ can later buy the research from any holder via licensing.

### Research as a Trade Item

Research (both incremental levels and breakthroughs) should appear in the trade menu alongside money, energy, food, etc. This means:

- A region can offer research access as part of a larger deal (e.g. "I'll give you fusion tech if you grant me transit rights and sell me food at a discount").
- Research can be bundled with political agreements.
- Refusing to share research is a valid strategy but may damage relations or trigger counter-coalitions.

## Open Questions Before Building

1. Should every building occupy a tile, or should regions have abstract build slots?
2. Should power plants require local resources only, or should imports unlock fuel-based plants?
3. Should docks and airports be buildings on specific tiles, or region-level transport upgrades?
4. Should transit permission be a separate trade item, or part of every route-based deal?
5. Should happiness be one number per region, or split into faction satisfaction plus overall happiness?
6. Should goods be a separate resource, or a derived output from industry/manufacturing?
7. Should roads be explicit builds, or should shared borders automatically count as road-capable?
8. Should each region have one dominant agenda, or multiple domestic agendas like the earlier faction model?

## Recommended MVP Version

For the first build, keep it simple:

- Use region-level build slots, not one building per tile.
- Keep resource tiles as build requirements.
- Allow one build or one upgrade per 5-minute cycle.
- Use 3 tiers for population, food, money/production, airport, and dock.
- Use energy plant type plus optional tier upgrades.
- Use direct border trade, sea trade, and air trade.
- Require transit permission for indirect land routes and airspace permission for air routes crossing third regions.
- Show charts, priority map, resource map, and consequence tree.
- Keep the game-theory map advisory only.

## One-Sentence Scope

The game is a simplified regional sustainability simulation where each region has distinct resource strengths, builds energy/food/population/production infrastructure, negotiates transport permissions and trade agreements, and tries to keep money, resources, energy, food, population, happiness, and emissions in balance through international politics.

