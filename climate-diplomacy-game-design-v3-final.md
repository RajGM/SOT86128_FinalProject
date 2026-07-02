# Climate Diplomacy: Environmental Politics Simulation

## Game Design Document — v0.3 (Final Pre-Build)

---

## 1. Elevator Pitch

A hex-grid geopolitical strategy game where 5 players govern real-world power blocs — USA, EU, China, India, and OPEC+ — competing to maximize national welfare while collectively managing a shared climate crisis. Players build infrastructure on a real-world-proportioned map, negotiate trade routes with physical logistics (ships, planes, rail, pipelines), manage domestic political factions through policy and media narrative, research branching technology trees, and vote on UN resolutions — all while the climate deteriorates geographically around them.

Missing players are replaced by bots running game-theoretic strategies (Nash equilibrium, tit-for-tat, minimax, maximin, Nash bargaining).

**Academic anchor:** TUM module POL23200 — Environmental Politics in International Comparison (Prof. Dr. Miranda Schreurs).

**Module learning outcomes → game mechanics:**

| Module Learning Outcome | Game Mechanic |
|---|---|
| Identify key concepts and theories of environmental policy | Country profiles encode real political economy theories (varieties of capitalism, developmental state, petrostate) |
| Distinguish among different theoretical approaches | Each country's bot AI uses a different decision model — players feel the theoretical difference |
| Apply methods of comparative analysis | Dashboard shows all 5 countries side-by-side; post-game analytics enable systematic comparison |
| Compare institutions, actor constellations, processes and outcomes | Domestic Politics Panel (factions = actors), trade/summit negotiations (processes), scoring (outcomes) |
| Evaluate environmental policy outcomes comparatively | End-game scoring + historical replay reveals who succeeded, who failed, and why |

---

## 2. The World Map

### 2.1 Hex Grid Design

The world is represented on a 2D hexagonal grid. Hex grids have uniform adjacency (6 neighbors, all equidistant), making pathfinding and distance calculations fair in all directions.

**Map dimensions:** ~60 wide × 30 tall hexes. Countries are represented at approximate relative real-world size using a simplified equirectangular layout (not Mercator — avoids polar distortion).

```
Approximate hex counts (relative sizing):

USA:           ~80 hexes  (9.8M km²)
EU:            ~35 hexes  (4.2M km²)
China:         ~75 hexes  (9.6M km²)
India:         ~25 hexes  (3.3M km²)
OPEC+:         ~90 hexes  (Saudi + UAE + Russia + Iran + Venezuela — non-contiguous)
Neutral/Ocean: remainder
```

OPEC+ territory is non-contiguous (Russia in the north, Gulf states in the Middle East, Venezuela in South America). This is a gameplay feature — their internal supply lines are long, they depend on sea lanes, and their coalition fragility mechanic reflects the geographic dispersion.

### 2.2 Hex Types

| Terrain | Properties | Examples |
|---|---|---|
| **Land** | Buildable, habitable, may contain resources | Most interior hexes |
| **Coastal** | Land hex adjacent to ocean. Enables port construction. Vulnerable to sea level rise. | Florida, Netherlands, Mumbai, Shanghai |
| **Mountain** | Not buildable but may contain minerals. Wind potential. Blocks rail/pipeline unless tunnel tech researched. | Himalayas, Alps, Rockies, Urals |
| **Desert** | High solar potential, low agriculture. Oil potential. | Sahara, Arabian Peninsula, Gobi |
| **Forest** | Carbon sink. Can be deforested for agriculture (irreversible, releases stored CO₂). | Amazon, Congo, Siberian taiga, SE Asian rainforest |
| **Agricultural** | Food production. Vulnerable to drought and climate events. | US Midwest, Indian Gangetic plain, European plains |
| **Ocean** | Non-buildable (except offshore platforms). Shipping routes. | All ocean hexes |
| **Strait/Canal** | Special ocean hex — chokepoint for trade routes. Controllable. | Suez, Panama, Malacca, Hormuz |
| **Arctic** | Currently impassable. Opens as global temperature rises past +2.5°C. | Northern Sea Route |

### 2.3 Resource Nodes

Resources are distributed on hexes based on real-world geography. Players see full detail on their own hexes, approximations on traded partners' hexes, and terrain-only on unknown hexes (see Section 6: Fog of War).

| Resource | Primary Locations | Function |
|---|---|---|
| **Oil** | Gulf states, Russia, Texas, Venezuela, North Sea | Fuel for industry. High GDP but high emissions. Tradeable commodity. |
| **Natural Gas** | Russia, Qatar, US (shale), Australia | Transition fuel. Lower emissions than oil/coal. |
| **Coal** | China, India, US Appalachia, Australia, Poland | Cheapest energy, highest emissions. Early-game crutch. |
| **Rare Earths** | China (60% of world supply), India, Australia | Required for renewable tech manufacturing. Strategic bottleneck. |
| **Uranium** | Australia, Kazakhstan (OPEC+ adjacent), Canada (neutral) | Nuclear energy. Zero emissions, long build time, political cost. |
| **Lithium** | Australia, Chile (neutral), China | Battery production for EVs and grid storage. |
| **Solar Potential** | Desert hexes, equatorial regions | Determines solar farm output. Latitude-dependent. |
| **Wind Potential** | Coastal hexes, mountain-adjacent, open plains | Determines wind farm output. Geography-dependent. |
| **Arable Land** | Agricultural hexes | Food production. Population support. Climate-vulnerable. |
| **Forest Cover** | Forest hexes | Carbon sink. Each forest hex absorbs X tons CO₂/round. |

---

## 3. The Five Players

### 3.1 United States of America

| Attribute | Value | Basis |
|---|---|---|
| Territory | ~80 hexes | 9.8M km² |
| Starting GDP | $25T | Largest nominal GDP |
| Emissions/capita | 15.0 tons CO₂ | Among highest globally |
| Historical Emissions | 25% of cumulative global total | Largest historical emitter |
| Renewable Share | 22% | 2023 energy mix |
| HDI | 0.92 | High |
| Carbon Tax Tolerance | 30 (low) | Political polarization on climate |
| Research Multiplier | 1.3× | Silicon Valley, university system |
| Key Resources | Oil, Coal, Shale Gas, Arable Land, Wind, Solar | Diversified |

**Gameplay identity:** Most resource-diverse player. Can self-sustain longer than anyone. But low carbon tax tolerance means aggressive climate policy triggers domestic backlash. The "has everything but can't politically use it" player.

**Unique mechanic — Midterm Elections:** Every 4 rounds, if approval < 50, carbon tax forcibly reduced by 20 and one green policy reversed. If approval > 70, "mandate" bonus — free policy action with no faction cost.

**Domestic factions:**
- Green Coalition (20%) — high carbon tax, renewables, UN compliance
- Industry Lobby (30%) — low carbon tax, high industry budget, fossil subsidies
- Populist Base (30%) — low energy prices, high social spending, "America First"
- Tech Progressives (20%) — high research, moderate on climate, pro-trade

**Bot strategy:** Homo economicus. U = 0.5 × GDP + 0.2 × HDI + 0.2 × diplomatic + 0.1 × emissions_reduction. Cooperate only when the math works.

### 3.2 European Union

| Attribute | Value | Basis |
|---|---|---|
| Territory | ~35 hexes | 4.2M km² |
| Starting GDP | $18T | Combined EU |
| Emissions/capita | 6.5 tons CO₂ | Below US/China |
| Historical Emissions | 22% of cumulative global total | Second largest historical emitter |
| Renewable Share | 40% | EU 2023 electricity mix |
| HDI | 0.90 | High, relatively equal |
| Carbon Tax Tolerance | 70 (high) | Public acceptance, green parties |
| Research Multiplier | 1.1× | Strong but distributed |
| Key Resources | Wind (North Sea), Nuclear (France), limited Gas, Arable Land | Resource-poor, import-dependent |

**Gameplay identity:** The regulatory pioneer. Highest carbon tax tolerance and best starting renewable share. But resource-poor — dependent on OPEC+ energy imports (real vulnerability). The Brussels Effect gives EU trade standards soft-power influence.

**Unique mechanic — Brussels Effect:** When EU establishes a trade relationship, the partner must match EU environmental product standards within 3 rounds or face trade penalties. This is Holzinger & Sommerer's "upward spiral" — regulatory diffusion through trade conditionality.

**Domestic factions:**
- Green Parties (30%) — pioneer climate policies, strong environmental regulation
- Industrial Conservatives (25%) — competitiveness focus, cautious on regulation pace
- Social Democrats (25%) — HDI focus, worker transition support, equity emphasis
- Sovereigntists (20%) — less EU integration, national control, skeptical of transfers

**Bot strategy:** Tit-for-tat with forgiveness (Axelrod). U = 0.25 × GDP + 0.3 × emissions_reduction + 0.25 × HDI + 0.2 × diplomatic. Start cooperative, mirror, forgive after 2 rounds.

### 3.3 People's Republic of China

| Attribute | Value | Basis |
|---|---|---|
| Territory | ~75 hexes | 9.6M km² |
| Starting GDP | $18T | Second largest |
| Emissions/capita | 8.0 tons CO₂ | Highest total emissions |
| Historical Emissions | 13% of cumulative global total | Rising fast but lower historical share |
| Renewable Share | 30% | World's largest renewable investor |
| HDI | 0.77 | Medium-high, rising |
| Carbon Tax Tolerance | 95 (very high) | No elections to lose |
| Research Multiplier | 1.2× | State-directed R&D, large STEM workforce |
| Key Resources | Coal (massive), Rare Earths (dominant, 60%), Manufacturing Capacity, Solar | Coal-rich, rare-earth monopoly |

**Gameplay identity:** The manufacturing engine. Rare earth monopoly means everyone needs China for renewable tech. Can execute policy shifts instantly (no election mechanic). But coal-dependent baseline and oil-import-dependent. The "I control the supply chain" player.

**Unique mechanic — Belt and Road Initiative (BRI):** Can build infrastructure in other players' territories (with consent or investment deal). BRI ports/railways reduce China's transport costs but create dependency in the host nation.

**Domestic factions (party-internal, not electoral):**
- Party Hardliners (30%) — GDP growth, geopolitical power, industrial output
- Technocrats (25%) — research, modernization, strategic green pivot
- Regional Governors (25%) — local GDP, resist central mandates that hurt provinces
- Military-Industrial (20%) — security spending, resource control, self-sufficiency

**Note on China's approval mechanic:** No election risk. But low Regional Governor satisfaction → provinces ignore central mandates (carbon tax enforcement drops 50%). Low Military-Industrial satisfaction → internal power struggle (lose 1 round to consolidation).

**Bot strategy:** Minimax with 3-round horizon. U = 0.4 × GDP + 0.15 × emissions_reduction + 0.25 × HDI + 0.2 × geopolitical_influence. Sacrifice early for late dominance.

### 3.4 Republic of India

| Attribute | Value | Basis |
|---|---|---|
| Territory | ~25 hexes | 3.3M km² |
| Starting GDP | $3.5T | Fifth largest, low per-capita |
| Emissions/capita | 2.0 tons CO₂ | Lowest of the 5 |
| Historical Emissions | 3% of cumulative global total | Minimal historical responsibility |
| Renewable Share | 28% | National Solar Mission |
| HDI | 0.64 | Lowest — development priority |
| Carbon Tax Tolerance | 20 (very low) | Energy poverty, development needs |
| Research Multiplier | 0.8× | Brain drain, underfunded (improves with social spending) |
| Key Resources | Coal (significant), Solar (excellent), Arable Land, Some Rare Earths, Thorium | Energy-poor relative to population |

**Gameplay identity:** The equity player. Lowest per-capita emissions and lowest historical share, but massive energy deficit. The "I didn't cause this, why should I pay?" argument is mechanically grounded in the Historical Emissions Ledger. Technology transfer from rich countries is the critical lever.

**Unique mechanic — Demographic Dividend:** India's young population generates a GDP growth bonus IF social spending > 25% of budget. Below that threshold, the dividend becomes a liability (unemployment, instability, approval drop).

**Domestic factions:**
- Development Coalition (35%) — GDP growth, energy access, infrastructure at all costs
- Climate Justice Movement (20%) — equity demands, hold developed nations accountable
- Agricultural Base (25%) — water security, food prices, rural investment
- Urban Middle Class (20%) — modernization, clean air, global integration

**Bot strategy:** Maximin / Rawlsian. U = 0.2 × GDP + 0.1 × emissions_reduction + 0.4 × HDI + 0.3 × equity_score. Demand equity, seek tech transfer, form coalitions.

### 3.5 OPEC+ Coalition

| Attribute | Value | Basis |
|---|---|---|
| Territory | ~90 hexes (non-contiguous) | Saudi + Russia + Iran + UAE + Venezuela |
| Starting GDP | $8T (combined) | Coalition total |
| Emissions/capita | 12.0 tons CO₂ | High, fossil-driven |
| Historical Emissions | 15% of cumulative global total | Significant via extraction-enabled emissions |
| Renewable Share | 5% | Lowest — almost entirely fossil |
| HDI | 0.78 (weighted average) | Varies wildly within coalition |
| Carbon Tax Tolerance | 15 (lowest) | Existential threat to economy |
| Research Multiplier | 0.7× | Historically low R&D (sovereign wealth can compensate) |
| Key Resources | Oil (dominant, 60% world reserves), Gas (massive), Desert Solar Potential | Fossil monopoly |

**Gameplay identity:** The incumbent fossil power. Entire economy is oil/gas — climate transition is existential. Controls Strait of Hormuz chokepoint. Has sovereign wealth funds to invest but short-term incentive is to delay. The "pay us to transition or we'll flood the market with cheap oil" player.

**Unique mechanic — Oil Market Manipulation:** Each round, OPEC+ sets global oil production: Flood (cheap oil, kills renewable economics globally, boosts GDP, increases emissions), Restrict (expensive oil, renewables more competitive, hurts importers), Steady (neutral). Single most powerful lever in the game.

**Unique vulnerability — Coalition Fragility:** If approval < 30, the coalition splinters. Russia and Gulf states begin making independent decisions (bot splits into two sub-bots with diverging interests). Can be triggered by other players through targeted diplomacy or information warfare.

**Domestic factions:**
- Fossil Establishment (35%) — maximize oil production, resist transition, extract while possible
- Sovereign Wealth Modernizers (20%) — diversify, post-oil economy (Vision 2030 model)
- Religious/Traditional (25%) — social stability, low disruption, domestic focus
- Military-Security (20%) — geopolitical leverage, chokepoint control, defense spending

**Bot strategy:** Nash bargaining. U = 0.3 × GDP + 0.2 × emissions_reduction + 0.2 × HDI + 0.3 × fossil_asset_value. Use oil as lever. Delay transition. Extract payments.

---

## 4. Domestic Politics Panel

### 4.1 Core Mechanic

Each country has 4 factions with a population share (sums to 100%) and a satisfaction level (0–100). The weighted average satisfaction equals the country's **approval rating**.

```
Approval = Σ (faction_share × faction_satisfaction) / 100
```

Faction satisfaction changes each round based on how closely the player's actual policy matches that faction's preferences. Every budget allocation, carbon tax setting, trade deal, and UN vote either pleases or angers specific factions.

**Example:** USA sets carbon tax to 50 (above tolerance of 30).
- Green Coalition: +15 satisfaction (they wanted this)
- Industry Lobby: -20 satisfaction (threatens profits)
- Populist Base: -15 satisfaction (higher energy prices)
- Tech Progressives: +5 satisfaction (moderate approval)
- Net approval change: (0.20 × 15) + (0.30 × -20) + (0.30 × -15) + (0.20 × 5) = -6.5

The player raised the carbon tax but lost 6.5 approval points. To sustain this policy, they need to either spend on media/narrative to reframe it or compensate with social spending to cushion the populist base.

### 4.2 Approval Consequences

| Approval Range | Effect | Real-world parallel |
|---|---|---|
| 70–100 | **Mandate:** One free policy action with no faction cost per round | Strong electoral mandate, broad consensus |
| 40–69 | **Normal governance:** No bonuses or penalties | Functional democracy, routine politics |
| 25–39 | **Instability:** All productivity multipliers -20%, random policy reversals possible | Gridlock, protests, yellow vests |
| 10–24 | **Crisis:** GDP drops 5%/round, cannot pass new legislation, international credibility collapses | Government shutdown, mass unrest |
| 0–9 | **Regime change:** All policies reset to faction-weighted defaults, lose 1 round of actions | Revolution, coup, snap election |

**China-specific:** No election risk, but:
- Regional Governors satisfaction < 30 → provinces ignore central mandates (carbon tax enforcement drops 50%)
- Military-Industrial satisfaction < 30 → internal power struggle (lose 1 round to consolidation)

**OPEC+-specific:**
- Overall approval < 30 → coalition splinters (Russia and Gulf states diverge)
- Military-Security satisfaction < 20 → chokepoint control weakened (other players can bypass Hormuz)

### 4.3 Media and Narrative Mechanic

Players can allocate part of their budget to "Public Communications" — spending money to shift faction satisfaction without changing policy. Three tiers of increasing power and risk.

**Tier 1 — Spin (low cost, short-term)**

Reframe existing policy for a target faction. "We didn't cut renewable spending, we're investing in energy security." "This carbon tax isn't a tax, it's a market incentive."

- Effect: +5 satisfaction to one targeted faction
- Duration: decays after 2 rounds (the spin wears off)
- Limit: 1 spin action per round
- Political lesson: greenwashing works short-term but doesn't compound

**Tier 2 — Media Campaign (medium cost, structural)**

Fund a sustained narrative shift. Launch a "clean coal" campaign, fund think tanks promoting climate skepticism, or conversely run a "green jobs" messaging blitz showing renewable sector employment.

- Effect: shifts a faction's policy preference position slightly toward the player's current policy. The faction's ideal point moves, not just their satisfaction. The Overton window shifts.
- Duration: takes 2 rounds to activate, lasts 4 rounds
- Limit: 1 campaign active at a time
- Political lesson: long-term narrative investment reshapes what the public considers acceptable policy. This is why Germany accepts high energy prices for Energiewende and the US doesn't — decades of different narrative investment.

**Tier 3 — Information Warfare (high cost, high risk, targets other players)**

Fund activists, media, or disinformation in another player's country to destabilize their domestic politics.

- Examples: fund environmental activists in OPEC+ to weaken fossil establishment. Fund climate skeptic media in EU to erode green party support. Fund separatist narratives in OPEC+ to accelerate coalition fragility.
- Effect: -10 satisfaction to a targeted faction in another country
- Detection risk: probability based on target's intelligence spending level
  - If undetected: effect applies silently
  - If detected: effect applies BUT diplomatic relations drop -30, international credibility penalty, possible sanctions
- Limit: 1 info warfare action per round
- Political lesson: foreign interference in domestic politics is a real instrument (Russian climate disinformation in EU, fossil industry funding of US climate denial). It's powerful but carries severe reputational risk.

### 4.4 Narrative as Political Strategy — Why This Matters for the Module

The media mechanic demonstrates a core insight from comparative environmental politics: identical climate policies produce different outcomes in different countries not because the science differs but because the domestic political landscape differs. Germany's Energiewende succeeded partly because the green movement captured public narrative in the 1980s–90s. US climate policy oscillates because the fossil industry invested heavily in counter-narrative. The media mechanic makes this visible and playable.

Players will discover organically that:
- Good policy without narrative support fails (approval crashes → policy reversed)
- Narrative without policy is hollow (spin decays, factions eventually see through it)
- The optimal strategy is policy + narrative together — which is exactly what successful environmental pioneers do (Jänicke & Weidner 1995)

---

## 5. Historical Emissions Ledger

### 5.1 Mechanic

A permanently visible global panel showing each player's **cumulative emissions since industrialization** (game start represents the accumulated historical total, then each round's emissions add to it).

| Player | Starting Historical Share | Basis |
|---|---|---|
| USA | 25% | Largest historical emitter since Industrial Revolution |
| EU | 22% | Second largest historical emitter |
| China | 13% | Large but concentrated in recent decades |
| OPEC+ | 15% | Via extraction-enabled emissions + domestic |
| India | 3% | Minimal historical contribution |

### 5.2 Gameplay Effects

- **UN Summit legitimacy modifier:** Resolutions that impose equal burdens without accounting for historical emissions face an automatic -20 legitimacy penalty. Resolutions with "common but differentiated responsibilities" language get +10 legitimacy bonus.
- **Equity argument tool:** India and developing-leaning players can invoke the ledger in trade negotiations. "You emitted for 200 years. You owe us technology transfer." This isn't just rhetoric — the ledger gives it a mechanical number.
- **Climate debt mechanic:** If a resolution passes requiring historical emitters to fund green tech transfer, the ledger determines each player's contribution share. USA pays 25%, EU pays 22%, etc.

### 5.3 Political Lesson

The ledger operationalizes the foundational UNFCCC principle of "common but differentiated responsibilities and respective capabilities" (CBDR-RC). It's the single most contested principle in climate negotiations and the reason why COP agreements always include differentiated targets. Making it a visible, quantified game element forces players to confront the equity question every round.

---

## 6. Fog of War and Information

### 6.1 Three Visibility Tiers

**Full visibility (own territory):**
- Exact resource quantities per hex
- All infrastructure
- Precise faction satisfaction numbers
- Full tech tree

**Approximate visibility (trade partners, adjacent hexes):**
- Terrain type and general resource category ("oil-rich," "mineral deposits")
- Visible infrastructure (you can see what they've built)
- Approximate GDP (rounded to nearest $0.5T)
- General faction mood ("stable," "restless," "crisis")

**Unknown (no contact):**
- Terrain type only (satellite-level — land/ocean/mountain/desert visible)
- No resource data
- No economic data

### 6.2 Revealing Information

| Method | What it reveals | Cost |
|---|---|---|
| Trade agreement | Partner's resource hexes (approximate) | Mutual — both sides gain visibility |
| Intelligence spending (diplomacy budget) | Specific hex quantities in target country | Part of diplomacy budget allocation |
| Technology: "Satellite Survey" | All terrain types globally | Research investment |
| Technology: "Economic Modeling" | Accurate GDP estimates for all players | Research investment |
| Espionage (information warfare) | Exact production numbers of target | High risk — if caught, relations -30 |

### 6.3 Public Information (Everyone Sees)

- Each player's reported emissions per capita (submitted at UN — players could theoretically under-report, but if caught via intelligence, massive credibility penalty)
- UN summit votes
- Trade route activity (ships/planes visible on the map)
- Built infrastructure (visible on the hex map)
- Global temperature anomaly
- Historical Emissions Ledger
- Oil price (set by OPEC+)

---

## 7. Core Game Loop

```
┌──────────────────────────────────────────────────────┐
│                  ROUND START (1 Year)                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Phase 1: POLICY (all players simultaneously)         │
│  ├── Set carbon tax rate (0–100)                      │
│  ├── Allocate budget across 7 sectors                 │
│  │   (Energy, Industry, Research, Social,             │
│  │    Diplomacy, Military, Public Communications)     │
│  ├── Choose infrastructure to build                   │
│  ├── Choose 1 special action (country-specific)       │
│  ├── OPEC+ sets oil production level                  │
│  └── Timer: 90 seconds                                │
│                                                       │
│  Phase 2: TRADE & DIPLOMACY (bilateral)               │
│  ├── Propose trade deals (resources, tech, credits)   │
│  ├── Propose investment deals (FDI, loans, revenue)   │
│  ├── Accept / reject incoming proposals               │
│  ├── Propose / enforce sanctions                      │
│  └── Timer: 60 seconds                                │
│                                                       │
│  Phase 3: UN SUMMIT (every 3 rounds: R3, R6, R9)     │
│  ├── Resolution proposed (player-drafted or random)   │
│  ├── Amendment proposals                              │
│  ├── Vote: support / oppose / abstain                 │
│  ├── Binding if ≥4 support (supermajority)            │
│  └── Timer: 45 seconds                                │
│                                                       │
│  Phase 4: RESOLUTION (automatic, ~15 seconds)         │
│  ├── Calculate GDP changes                            │
│  ├── Calculate emissions changes                      │
│  ├── Update HDI                                       │
│  ├── Process trade routes (move cargo along hexes)    │
│  ├── Apply infrastructure completion                  │
│  ├── Update faction satisfaction                      │
│  ├── Apply media/narrative effects                    │
│  ├── Update relations matrix                          │
│  ├── Update Historical Emissions Ledger               │
│  ├── Update global temperature                        │
│  ├── Check climate impact thresholds                  │
│  ├── Process climate refugee flows                    │
│  ├── Random event (30% chance)                        │
│  ├── Check approval thresholds (mandate/crisis)       │
│  └── Display round summary                            │
│                                                       │
│  → Next Round (10 rounds total)                       │
└──────────────────────────────────────────────────────┘
```

**Timing:** Policy 90s + Trade 60s + Summit 45s (3 times) + Resolution 15s ≈ ~3 min/round × 10 rounds ≈ **30 minutes per game**. Without summits, rounds are ~2.5 min, so non-summit rounds are faster.

---

## 8. Trade and Logistics

### 8.1 Transport Modes

| Mode | Speed | Capacity | Emissions | Cost | Requirements |
|---|---|---|---|---|---|
| **Cargo Ship** | 1 hex/tick (slow) | Very High (bulk) | Low per unit | Low | Port at origin + destination |
| **Freight Plane** | 5 hex/tick (fast) | Low | Very High per unit | High | Airport at origin + destination |
| **Rail** | 2 hex/tick | High | Medium | Medium | Connected rail network |
| **Pipeline** | Continuous flow | Oil/Gas only | Very Low | High (to build) | Built between connected hexes |

Each round has ~10 ticks. Ships take multiple rounds for long routes. Planes arrive same-round but at huge emission and cost penalties.

**Research reduces transport emissions and increases speed:**
- Level 1 → Electric rail
- Level 2 → LNG-powered ships
- Level 3 → Hydrogen freight
- Level 4 → Green shipping (near-zero emissions)

### 8.2 Chokepoints

| Chokepoint | Controlled by | Effect if blocked/taxed |
|---|---|---|
| Suez Canal | Neutral (EU-adjacent) | EU-Asia trade reroutes around Africa (+8 hexes) |
| Strait of Hormuz | OPEC+ | Blocks 30% of world oil shipments |
| Strait of Malacca | Neutral (China-adjacent) | Blocks China's oil imports from Gulf |
| Panama Canal | Neutral | US coast-to-coast + Americas-Asia route |
| Bosphorus | Neutral (EU-adjacent) | Russia's Black Sea exports to Mediterranean |
| Northern Sea Route | Russia (OPEC+) | Opens at +2.5°C — Europe-Asia shortcut |

Players can tax trade through their chokepoints, blockade them (severe diplomatic cost), or invest in canal infrastructure (throughput + transit fee revenue).

### 8.3 Trade Access and Relations

Trade access depends on bilateral relations:

| Relations Level | Trade Access |
|---|---|
| Below -20 | Trade blocked entirely |
| -20 to 0 | Emergency resource purchases only (3× cost) |
| 0 to 30 | Basic commodity trade |
| 30 to 60 | Full trade + investment deals |
| 60+ | Technology sharing + joint research + transit rights |

**Reaching distant countries:** Not every pair has a direct route. Physical geography and intermediary relations matter.

Direct routes (no intermediary):
- USA ↔ EU (Atlantic)
- EU ↔ OPEC+ (Mediterranean, overland)
- EU ↔ China (Suez or New Silk Road rail)
- China ↔ India (land border — limited; mainly via ports)
- OPEC+ ↔ India (Indian Ocean)
- OPEC+ ↔ China (Malacca or pipeline)
- USA ↔ China (Pacific — long)

Requires intermediary or special route:
- USA ↔ India (via EU or Pacific — long)
- USA ↔ OPEC+ (via Atlantic-Mediterranean or Pacific-Indian Ocean)

Building relations with intermediary countries enables **transit rights** — routing trade through their territory at reduced cost.

### 8.4 Tradeable Assets

| Asset | Mechanism |
|---|---|
| **Raw Resources** | Oil, gas, coal, rare earths, lithium, uranium — physical cargo on trade routes |
| **Manufactured Goods** | Processed from raw materials at manufacturing hubs. Higher value, lighter weight. |
| **Green Tech License** | Sell a tech tree advancement. Buyer gains capability, seller earns lump sum or royalty. |
| **Carbon Credits** | Player below emission budget sells allowance to player above. Price negotiated. |
| **Forest Conservation Credits** | Pay any forest-holding player to preserve (not deforest) specific hexes. |
| **Research Points** | Sell accumulated research for GDP. Buyer accelerates their tech tree. |

### 8.5 Investment and Finance

| Type | Mechanism | Risk | Real-world parallel |
|---|---|---|---|
| **FDI** | Player A builds infrastructure in B's territory. A pays cost, B gets GDP, A gets % revenue for N rounds. | B could nationalize (seize asset). | Chinese BRI, US companies in EU |
| **Sovereign Loan** | A lends GDP to B. B repays with interest over N rounds. Collateral = hex resource output. | B could default → A seizes collateral output. | IMF loans, Chinese debt diplomacy |
| **Revenue Sharing** | A and B jointly develop a resource hex. Split output by agreed %. | Disputes if one underinvests. | Joint oil ventures, shared pipelines |
| **Carbon Credit Market** | Below-budget player sells credits to above-budget player. | Market manipulation if one player hoards. | EU ETS, Kyoto CDM, Paris Art. 6 |

---

## 9. Coercive Diplomacy (Not War)

### 9.1 Design Philosophy: Why No Military Conquest

The module is about why countries cooperate and fail to cooperate on environmental issues within the existing international order — not about military conquest. If war is mechanically viable, rational players discover that conquering China's rare earth hexes is faster than trading for them. Military becomes the dominant strategy and the environmental policy layer becomes decoration.

Instead, the game models coercive power through the tools real countries actually use in climate politics: sanctions, energy dependence, economic leverage, and information warfare.

### 9.2 Military Budget as Opportunity Cost

Military spending is a budget category. It does not produce conquerable armies. It produces:

- **Trade route security:** protects shipping from piracy events and makes sanctions enforcement credible
- **Chokepoint defense:** makes your chokepoint hexes harder for others to bypass or blockade
- **Deterrence:** high military spending makes sanctions against you riskier for the sanctioning player (they lose more trade value)
- **Domestic faction satisfaction:** Military-Industrial and security-focused factions want military spending

The political lesson: military spending crowds out climate investment, which is a real and documented phenomenon in development economics. Every dollar in military is a dollar not in energy, research, or social.

### 9.3 Sanctions

A player or coalition can impose trade sanctions on another player:

- **Trade sanctions:** block specific trade routes or all trade with the target. Costs the sanctioning player too (lost trade revenue).
- **Tech embargo:** deny technology license access to the target. Slows their research.
- **Financial sanctions:** freeze investment deals and loan agreements with the target.
- **Conditions for lifting:** the sanctioning player sets conditions (e.g., "reduce emissions by 10%," "comply with UN resolution X"). Target can comply to lift sanctions.

Sanctions require relations > 0 with at least 2 other players to be credible. Unilateral sanctions are weaker (target can reroute trade through third parties).

Real-world parallel: EU Carbon Border Adjustment Mechanism is essentially a climate sanction. US sanctions on Iran affected oil markets globally.

### 9.4 Weaponized Energy Dependence

Already in the game via OPEC+'s oil manipulation and China's rare earth monopoly. Russia cutting gas to Europe (2022) was more coercive than most military actions. These are the real weapons of modern geopolitics and they emerge naturally from the trade system.

### 9.5 Diplomatic Isolation

If 4 players collectively refuse to trade with the 5th, that player is effectively besieged. This emerges from the relations system — not a separate mechanic. Coalition formation against a defector is the natural consequence of repeated non-cooperation (game theory: punishment strategy in iterated prisoner's dilemma).

---

## 10. Climate System

### 10.1 Global Temperature Tracking

Global temperature anomaly is a shared metric, starting at +1.0°C above pre-industrial. It rises based on total world emissions and falls (slowly) based on carbon sinks.

```
ΔTemp per round = (total_world_emissions × emission_factor) - (total_carbon_sinks × sink_factor)
```

Carbon sinks include: intact forest hexes, ocean absorption (diminishes as temperature rises), carbon capture infrastructure.

### 10.2 Climate Impact Zones

| Temperature | Impact | Gameplay Effect |
|---|---|---|
| +1.0°C (start) | Baseline | No additional effects |
| +1.5°C | Increased storm intensity, coral die-off | Coastal hex maintenance +20%. Fishing output drops. |
| +2.0°C | Sea level rise, agricultural stress | Low-lying coastal hexes lose productivity. Drought risk +30% in equatorial agricultural hexes. |
| +2.5°C | Arctic opens, permafrost thaw | Northern Sea Route passable (benefits Russia). Methane feedback: bonus +0.1°C. |
| +3.0°C | Severe flooding, crop failures, mass migration | Coastal hexes flood (infrastructure destroyed). Agriculture -40% equatorial. Climate refugee flows trigger. |
| +3.5°C | Catastrophic — game enters crisis mode | All players' scores penalized heavily. No winner possible above this threshold. |

### 10.3 Climate Refugee Flows

When temperature crosses +2.5°C, climate-affected hexes generate refugee pressure. Refugees flow to neighboring countries based on proximity and relations.

- **Source hexes:** flooded coastal hexes, drought-stricken agricultural hexes, uninhabitable desert-expansion hexes
- **Destination:** adjacent player territories. If India's coastal hexes flood, refugees flow to India's interior and potentially to China/OPEC+ if borders are adjacent.
- **Effect on destination:** social spending demand increases by +5% per refugee wave. HDI pressure. Approval drops in anti-immigration factions.
- **Effect on source:** hex becomes unproductive. GDP drops. Population and labor force shrink.
- **Political lesson:** climate impacts are geographically unequal but consequences are shared through migration. This is a major topic in environmental politics — the climate-migration nexus.

Refugee flows are a **consequence of collective failure**, not a player action. They make the shared climate score tangible — your neighbor's flooding becomes your social spending crisis.

---

## 11. Technology Tree

Research spending advances through a branching tree. Each level requires more points. Players must specialize — no one researches everything in 10 rounds. This creates natural trade incentives for tech licensing.

```
                        ┌─── Carbon Capture ─── Direct Air Capture ─── Atmospheric Restoration
                        │
Green Energy ──── Advanced Renewables ──── Grid Storage ──── Fusion Power
    │                   │
    │                   └─── Smart Grid ──── Continental Supergrid
    │
    ├─── Efficiency ──── Industrial Decarbonization ──── Circular Economy
    │
Transport ──── Electric Vehicles ──── Green Shipping ──── Hydrogen Freight ──── Zero-Emission Logistics
    │               │
    │               └─── High-Speed Rail ──── Maglev Network
    │
    ├─── Satellite Survey (reveals all terrain globally)
    │
    ├─── Nuclear ──── Advanced Fission ──── Small Modular Reactors ──── Fusion Research
    │
Intelligence ──── Signals Intel ──── Economic Modeling ──── Predictive Analytics
    │
    └─── Agriculture ──── Drought-Resistant Crops ──── Vertical Farming ──── Synthetic Food
```

**Research speed multipliers:**
- USA: 1.3× (Silicon Valley, university system)
- EU: 1.1× (strong but distributed)
- China: 1.2× (state-directed, large STEM workforce)
- India: 0.8× (brain drain — improves with social spending above 30%)
- OPEC+: 0.7× (historically low R&D — sovereign wealth can compensate)

---

## 12. UN Summit Mechanic

### 12.1 Timing and Process

Every 3 rounds (R3, R6, R9). Any player can propose a resolution (costs diplomatic capital). Others can propose amendments. Final text is voted on: Support / Oppose / Abstain. Passes if ≥4 support.

### 12.2 Example Resolutions

| Resolution | Real-world basis | Beneficiaries | Opponents |
|---|---|---|---|
| "Common but differentiated responsibilities: developed nations fund green tech transfer" | UNFCCC principle, Paris Art. 9 | India, OPEC+ (receive) | USA, EU (pay) |
| "Global carbon tax floor of 40" | EU CBAM | EU (already above) | USA, OPEC+ (political/economic cost) |
| "Phase out coal by round 8" | COP26 Glasgow Pact | EU (little coal) | China, India (coal-dependent) |
| "International green research fund (5% of research budget)" | Green Climate Fund | All (shared innovation) | Whoever leads in tech (loses edge) |
| "Binding 2°C pathway: 5% emissions reduction/round" | Paris NDCs | EU, India (low per-capita) | USA, China, OPEC+ |
| "REDD+ forest conservation payments" | REDD+ framework | Forest-holding nations | Net payers |
| "Open patent pool: all green tech shared" | TRIPS waiver debates | India, OPEC+ (tech-poor) | USA, EU, China (IP holders) |
| "Sanctions on non-compliant nations" | Nordhaus climate club proposal | Compliant players | Non-compliant players |
| "Historical emissions-based contribution formula" | CBDR-RC principle | India (3% share), China (13%) | USA (25%), EU (22%) |

### 12.3 Enforcement

- Non-compliance with binding resolutions → diplomatic penalty (-15 relations with all supporters) + sanctions eligibility
- Repeated non-compliance → compounding reputation damage
- No military enforcement — this mirrors real international law (Paris Agreement has no enforcement mechanism)

---

## 13. Events System

30% chance per round. Events are geographically and state-contingent.

### 13.1 Climate Events (probability scales with temperature)

| Event | Trigger | Impact |
|---|---|---|
| Hurricane/Typhoon | Temp ≥ +1.5°C | Coastal infrastructure damage (USA Gulf, India, China coast) |
| Drought | Temp ≥ +2.0°C | Agricultural hex output drops (India, China interior, US Midwest) |
| Flooding | Temp ≥ +2.0°C | Low-lying hexes impassable 2 rounds (Netherlands, Bangladesh, Florida) |
| Wildfire | Temp ≥ +1.5°C | Forest hex destroyed (carbon sink lost, emissions spike) |
| Permafrost Thaw | Temp ≥ +2.5°C | Methane release → temperature +0.1°C (Arctic hexes) |
| Coral Die-off | Temp ≥ +1.5°C | Fishing output drops (India, OPEC+ coastal) |

### 13.2 Political Events

| Event | Trigger | Effect |
|---|---|---|
| Election upset | Democracies (USA/EU/India), random | Carbon tax tolerance shifts ±15 |
| Leadership change | OPEC+ approval < 30 | Coalition fragility event |
| Youth climate protest | Random (global) | All carbon tax tolerances +10 for 2 rounds |
| Trade war | Relations < -30 between any pair | Bilateral trade costs 2× for 3 rounds |
| Climate refugee crisis | Temp ≥ +2.5°C | Affected player HDI drops, neighbor social costs rise |
| Tech breakthrough | Research ≥ 5 in any player | Random free tech for highest researcher |
| Whistleblower | After info warfare action | 40% chance of exposing foreign interference |

### 13.3 Economic Events

| Event | Effect |
|---|---|
| Oil price shock | Fossil costs ±30% globally |
| Financial crisis | Random player loses 10% GDP, cascades to trade partners |
| Green tech cost crash | Solar/wind costs halve for 2 rounds |
| Rare earth disruption | Renewable infrastructure costs spike (benefits China alternatives) |
| Sovereign debt crisis | Highly indebted player faces forced austerity (budget constraints) |

---

## 14. Scoring System

### 14.1 End-Game Composite Score

| Component | Weight | Measures |
|---|---|---|
| GDP Growth | 20% | % change from starting GDP |
| Emissions Reduction | 20% | % reduction in per-capita emissions |
| HDI Improvement | 15% | Absolute HDI gain |
| Infrastructure Score | 10% | Hex improvements (renewable weighted higher) |
| Diplomatic Score | 10% | Average relations + treaty compliance |
| Tech Level | 10% | Research tree progress |
| **Global Climate Outcome** | **15%** | **Collective temperature trajectory (shared equally)** |

The 15% shared score is the game's moral engine. Pure self-interest is suboptimal (free-rider loses shared points). Pure altruism is also suboptimal (sacrifices too much GDP). Nash equilibrium is moderate cooperation — which is exactly what real climate politics produces.

### 14.2 Post-Game Analytics

- World map replay (round-by-round hex changes, trade routes animated)
- Temperature trajectory with 1.5/2.0/2.5/3.0°C threshold lines
- GDP comparison (all 5 over 10 rounds)
- Emissions waterfall (who contributed what to warming)
- Historical Emissions Ledger final state
- Trade network graph (volume and direction)
- Technology tree comparison
- Faction satisfaction history (who had domestic crises?)
- "What if" counterfactual replay

---

## 15. Bot AI — Game Theory Models

| Player | Model | Utility Function | Key Behavior |
|---|---|---|---|
| USA | Rational self-interest | U = 0.5×GDP + 0.2×HDI + 0.2×diplo + 0.1×emissions | Maximize GDP, cooperate only when math works |
| EU | Tit-for-tat + forgiveness | U = 0.25×GDP + 0.3×emissions + 0.25×HDI + 0.2×diplo | Start cooperative, mirror, forgive, push multilateralism |
| China | Minimax (3-round horizon) | U = 0.4×GDP + 0.15×emissions + 0.25×HDI + 0.2×geopol | Sacrifice early for late dominance, hoard leverage |
| India | Maximin / Rawlsian | U = 0.2×GDP + 0.1×emissions + 0.4×HDI + 0.3×equity | Demand equity, seek transfers, form coalitions |
| OPEC+ | Nash bargaining | U = 0.3×GDP + 0.2×emissions + 0.2×HDI + 0.3×fossil_value | Use oil as lever, delay, extract payments |

Each bot also manages its domestic factions using a simplified optimization: allocate media budget to the faction whose satisfaction drop would most threaten approval stability.

---

## 16. Technical Architecture

### 16.1 Stack

| Layer | Technology | Justification |
|---|---|---|
| Frontend | React (Vite) + Zustand | Component-based, fast iteration, lightweight state |
| Hex Grid | HTML5 Canvas (rendering) + SVG overlay (tooltips/UI) | Canvas for performance, SVG for interactivity |
| Real-time Backend | Firebase Realtime Database | Room-based multiplayer, no server needed |
| Auth | Firebase Anonymous Auth | Zero signup friction |
| Hosting | Firebase Hosting | Free tier sufficient |
| Bot Engine | Client-side JS (host's browser) | Simple arithmetic utility functions, < 2s compute |
| Pathfinding | A* on hex grid | Standard, efficient for ~1800 hexes |

### 16.2 Firebase Data Model

```
rooms/
  {roomId}/
    metadata/
      status, currentRound, currentPhase, phaseDeadline, hostId, settings

    players/
      {playerId}/
        name, country, isBot, isReady

    world/
      hexes/
        {hexId}/
          terrain, owner, resources (encrypted per-owner visibility),
          infrastructure, forestHealth, populationPressure
      globalTemperature: number
      oilPrice: number
      historicalEmissions: { [countryId]: number }

    countries/
      {countryId}/
        gdp, emissions, hdi, renewableShare, researchLevel, approvalRating
        carbonTax, budget: { energy, industry, research, social, diplomacy, military, media }
        techTree: bitmask
        factions: { [factionId]: { share, satisfaction, preferenceVector } }
        visibilityMap: { [hexId]: "full" | "approximate" | "unknown" }
        activeMediaCampaigns: [...]
        activeInfoWarfare: [...]

    rounds/
      {roundNumber}/
        actions/
          {playerId}/ ...
        trades/
          {tradeId}/ from, to, offer, status, routeId, ticksRemaining
        summit/ (only on R3, R6, R9)
          resolution, amendments, votes, passed
        events/ [...]
        results/ { [countryId]: { gdpΔ, emissionsΔ, hdiΔ, approvalΔ, ... } }

    relations/
      {countryA}_{countryB}: number

    tradeRoutes/
      {routeId}/
        from, to, mode, cargo, path: [hexIds], currentHex, ticksRemaining, emissions

    sanctions/
      {sanctionId}/
        imposedBy, target, type, conditions, active
```

### 16.3 Offline / Single-Player Mode

All game logic runs client-side without Firebase. Bots run locally. Firebase is only the sync layer for multiplayer. The game is fully playable solo against 4 bots.

---

## 17. Development Phases

### Phase 1: Core Prototype (Single-Player, No Firebase)
- [ ] Hex grid renderer with world map (real geography)
- [ ] 5 country territories with relative sizing
- [ ] Resource distribution on hexes
- [ ] Budget allocation UI (7 sectors + carbon tax)
- [ ] Domestic Politics Panel (factions, satisfaction, approval)
- [ ] Round resolution engine (GDP, emissions, HDI, approval)
- [ ] Bot AI (5 strategies with faction management)
- [ ] Basic dashboard with comparative stats
- [ ] Historical Emissions Ledger display
- **Deliverable:** Playable single-player game against 4 bots.

### Phase 2: Trade, Geography, and Logistics
- [ ] Trade route pathfinding (A* on hex grid)
- [ ] Transport modes (ship/plane/rail/pipeline) with time and emissions
- [ ] Port and infrastructure building on hexes
- [ ] Chokepoint mechanics
- [ ] Trade proposal UI with route visualization
- [ ] Fog of war / resource visibility tiers
- [ ] Media/narrative mechanic (Tier 1 and 2)

### Phase 3: Multiplayer
- [ ] Firebase project setup
- [ ] Room creation/joining (6-char codes)
- [ ] Real-time state sync
- [ ] Phase timer coordination
- [ ] Bot backfill for missing players

### Phase 4: Diplomacy, Events, and Polish
- [ ] UN Summit full mechanic (draft, amend, vote)
- [ ] Investment/loans/FDI system
- [ ] Sanctions mechanic
- [ ] Information warfare (Tier 3 media)
- [ ] Climate impact zones with geographic consequences
- [ ] Climate refugee flows
- [ ] Technology tree UI with branching visualization
- [ ] Random events system
- [ ] Post-game analytics and charts
- [ ] Sound and visual polish
- [ ] Mobile responsiveness

### Stretch Goals
- [ ] Replay system (round-by-round map playback)
- [ ] Tournament mode (cumulative scoring across games)
- [ ] Scenario editor (custom starting conditions)
- [ ] Historical mode (start from 1990, 2000, 2015 with real data)
- [ ] Real-data integration (Our World in Data API for validation)
- [ ] Classroom management dashboard (professor view of all rooms)

---

## 18. Report Structure (4–5 Pages)

1. **Theoretical Foundation** (~1 page) — Varieties of capitalism → country design. Collective action / prisoner's dilemma → shared climate score. Policy diffusion → Brussels Effect. Pioneer/laggard → asymmetric starting conditions. Actor constellations → Domestic Politics Panel factions. CBDR-RC → Historical Emissions Ledger.

2. **Game as Simulation Methodology** (~1 page) — Serious games in political science education. Why simulation enables experiential learning. How imperfect information, geographic constraints, asymmetric power, and domestic politics reproduce real-world dynamics. Nash equilibrium in bot design as pedagogical tool. The media mechanic as demonstration of narrative's role in policy outcomes.

3. **Technical Architecture** (~1 page) — Hex grid choice and geographic modeling. Firebase real-time sync. Fog of war implementation. Transport logistics. Bot AI utility functions and game-theoretic models.

4. **Emergent Dynamics** (~1 page) — Playtest observations. Did the free-rider problem emerge in UN summits? Did China's rare earth leverage create dependency? Did OPEC+ use oil as weapon? Did the media mechanic reveal narrative's power? Did the Historical Emissions Ledger shift negotiation dynamics? What winning strategies emerged?

5. **Limitations and Extensions** (~0.5 page) — Simplified domestic politics (4 factions vs real complexity). Static resource quantities. No population dynamics beyond refugees. Bot AI limitations vs human unpredictability. No subnational actors. Extensions: more countries, real data validation, classroom deployment at scale.

---

## 19. Module Reading List Connections

| Reading | Game Mechanic |
|---|---|
| Holzinger & Sommerer (2012) — upward spiral in environmental standards | Brussels Effect: EU trade standards propagate to partners |
| Jänicke & Weidner (1995) — successful environmental policy | Pioneer/laggard dynamic in asymmetric country design + approval system |
| Muno (2010) — comparative governance instruments | Player action space: carbon tax, subsidies, regulation, market instruments, media |
| Schreurs (2002) — US, Germany, Japan environmental politics comparison | USA vs EU archetype. Political oscillation mechanic. Media/narrative divergence. |
| Steinberg & VanDeveer (2012) — comparative environmental politics | Entire game: same climate problem, different institutions, different outcomes |
| UNFCCC — common but differentiated responsibilities | Historical Emissions Ledger + UN summit equity resolutions |
| Paris Agreement — NDCs and Article 6 | Carbon credit market + binding resolution mechanic |
| EU CBAM — carbon border adjustment | Sanctions mechanic + Brussels Effect trade conditionality |
