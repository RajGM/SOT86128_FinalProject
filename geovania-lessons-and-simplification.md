# Geovania Analysis: What We Can Learn and How to Simplify Further

## What Is Geovania?

Geovania is a simulation game developed by TU Delft Gamelab, University of Stavanger, Ghent University, and **TUM (Prof. Miranda Schreurs)** — the same professor whose module (POL23200) our project targets. It was funded by an Erasmus+ grant (~260,000 EUR) and built 2021-2023.

This is directly relevant: **our professor co-developed this game**. Our project should acknowledge Geovania, learn from its design choices, and position itself as a complementary or extended take on the same pedagogical goals.

---

## Geovania's Core Design (Reconstructed from Public Sources)

### Structure
- **4 fictional countries** on a hypothetical continent (not real-world nations)
- **4 player roles per country**: Leader (policy negotiations), Minister of Energy, Minister of Finance & Technology, Minister of Social Welfare
- Hybrid game: digital simulation + analog negotiation (classroom or video chat)
- Multiple negotiation rounds, each representing ~5-10 years

### Resources (5 types based on public descriptions)
From the game descriptions mentioning trades of "energy, technology, tax or food" and the goal of "sufficient energy, food, housing and economic welfare":

| Resource | Role in Game |
|---|---|
| **Energy** | Core resource; must transition from coal/gas to wind/solar/hydro |
| **Money/Tax** | Funds transitions, tradeable, budget constraints |
| **Food** | Population needs; connected to land use and climate |
| **Technology** | Researchable; enables renewable transition; tradeable |
| **CO2 Emissions** | Shared negative outcome; must be collectively reduced |

Population/housing and welfare appear as goals rather than independent tradeable resources.

### Mechanics
- Countries have **different biomes** (resource endowments vary — some are fossil-rich, some have solar/wind potential, some are agricultural)
- Players **construct and demolish buildings** on a map
- Players **trade** energy, technology, food, and money
- Players **research new technologies**
- **Domestic negotiation** (within country team) + **international negotiation** (between countries)
- Pressure increases each round — CO2 targets get tighter
- Countries must phase out coal and gas, bring in wind/solar/hydro

### What It Teaches
- Effects of cooperation vs. non-cooperation on CO2 and energy transition
- Burden-sharing possibilities and effects
- Investment tradeoffs in renewable technologies
- Why countries with different endowments have different incentives
- The difficulty of international agreement when national interests diverge

---

## Key Lessons for Our Project

### 1. Geovania Validates Our Resource Count

Geovania uses essentially **5 resource types**: Energy, Money, Food, Technology, and CO2. Our minimal spec has 6 (Money, Energy, Food, Population, CO2, Approval). The addition of Population and Approval as explicit resources adds domestic politics modeling — which Geovania handles through role-playing (human players argue as ministers) rather than simulation.

**Lesson:** 5-6 resources is the right complexity level for a serious academic simulation game. We don't need more.

### 2. Fictional Countries vs. Real Countries

Geovania uses **fictional countries** to avoid political sensitivity and allow cleaner asymmetry design. Our spec uses real-world blocs (USA, EU, China, India, OPEC+).

**Tradeoff:**
- Fictional: safer, more flexible, but students must learn the fictional world first
- Real: immediately recognizable, directly connects to module reading list (Schreurs, Jaenicke, etc.), but risks oversimplification of real politics

**Decision for our project:** Keep real-world blocs. The module explicitly asks students to "compare internationally the institutions, actor constellations, processes and outcomes of **national** environmental politics." Real nations ground the comparison in the course material. Geovania already covers the fictional approach — we can differentiate.

### 3. Role-Based Teams vs. Individual Players

Geovania assigns **4 human players per country** (leader + 3 ministers). This means 16 players minimum for a full game. The domestic politics dimension comes from human disagreement within the team.

Our design has **1 player per country** with simulated domestic politics (factions + approval). This means 5 players total.

**Tradeoff:**
- Geovania's approach: richer negotiation, more realistic, but needs 16+ people and a classroom setting
- Our approach: playable with 2-5 people online, domestic politics modeled computationally

**Decision for our project:** Keep single-player-per-country. Our game is designed for smaller groups and asynchronous/online play. The faction system substitutes for what Geovania achieves through role-playing. This is a genuine differentiator — our game models domestic politics as a system constraint, not just a social exercise.

### 4. Map with Buildings vs. Abstract Upgrades

Geovania has a **hex-map continent** where players construct and demolish buildings. This is similar to our v3 design that we cut.

**Lesson:** Geovania was built by a professional game lab with a dedicated software engineer and ~260K EUR budget. If they used a map, it's because they had the resources. We probably don't. Our upgrade-slot abstraction achieves the same strategic tradeoffs (what to build, where to invest) without the map rendering complexity.

**However:** If we want to add a cosmetic map later (post-MVP), Geovania shows it can work at this scale. But it's not necessary for the learning outcomes.

### 5. Technology as a Tradeable Resource

Geovania treats technology as something you **research AND trade**. This is important — it models technology transfer, which is a central issue in real climate negotiations (UNFCCC Article 4.5, Paris Agreement Article 10).

**Lesson for our project:** Our minimal spec has tech level as a single number (1-3). We should make sure technology transfer is possible through bilateral deals. A country can "sell" or "gift" tech level advancement to another country. This keeps the mechanic without needing a tech tree.

### 6. Increasing Pressure Over Rounds

Geovania increases climate pressure each round — CO2 targets tighten, consequences escalate. Our design does this through temperature thresholds (+1.5C, +2.0C, +2.5C, +3.0C).

**Lesson:** This is the right approach. Both games create the "tragedy of the commons under time pressure" dynamic. Our threshold system is cleaner than a gradually tightening target because it creates discrete crisis moments that force negotiation.

---

## What We Can Simplify Further (Learning from Geovania's Minimalism)

Geovania was built with serious funding and a professional team, yet it's still simpler than our v3 design. This confirms we should simplify aggressively.

### Already cut in our minimal spec (confirmed correct by Geovania comparison):
- Hex grid logistics ✓ (Geovania has a map but simpler than our v3)
- Transport pathfinding ✓
- Fog of war ✓
- Information warfare ✓
- Complex bot AI ✓
- Detailed climate disasters ✓

### Could simplify further based on Geovania:

| Our Feature | Geovania Equivalent | Possible Simplification |
|---|---|---|
| 3 factions per country with satisfaction scores | Human role-players argue naturally | Could reduce to **2 factions** (pro-transition vs. status-quo) with a single tension slider instead of 3 separate satisfaction scores |
| 5 budget categories | Ministers handle their own domain | Could reduce to **3 budget categories**: Economy, Green Transition, Social — cuts UI by 40% |
| Bilateral deals with duration/terms | Negotiation rounds with trades | Deals could be **single-round only** (no multi-cycle contracts) — simpler state management in Firebase |
| UN summit resolutions (deck of 8-10) | General Assembly negotiations | Could use **3-4 fixed resolution types** instead of a card deck |
| Upgrade slots with 9 upgrade types | Building construction on map | Could reduce to **5-6 upgrade types** — fossil power, renewable power, industry, farm, social, research |
| Scoring with 4 weighted components | Collective CO2 goal + national welfare | Could simplify to **2 scores**: national welfare + climate outcome |

### What NOT to simplify further:
- **5 countries** — Geovania has 4, we have 5. Keep 5 because OPEC+ adds the fossil-incumbent dynamic that is central to real climate politics and the module
- **Asymmetric starting conditions** — this IS the game; both Geovania and our design depend on it
- **Trading between countries** — this IS the international dimension; both games center on it
- **CO2 as a shared problem** — the collective action failure is the whole point

---

## Positioning Our Project vs. Geovania

| Dimension | Geovania | Our Project |
|---|---|---|
| Countries | 4 fictional | 5 real-world blocs |
| Players needed | 16+ (4 per country) | 2-5 (1 per country) |
| Domestic politics | Human role-play | Simulated factions + approval |
| Platform | Hybrid (digital sim + classroom) | Fully digital (React + Firebase) |
| Map | Hex continent with buildings | Abstract upgrade slots |
| Academic framework | Geopolitics of renewables | Comparative environmental politics (broader) |
| Module alignment | Energy transition focus | Full POL23200 scope (actors, institutions, processes, outcomes) |
| Accessibility | Requires classroom + facilitator | Playable online, any time |

**Our value proposition:** A fully digital, small-group-playable simulation that models not just the energy transition but the full comparative environmental politics framework — including domestic actor constellations, governance instruments, policy diffusion, and pioneer/laggard dynamics — as computational mechanics rather than facilitated discussion.

---

## Recommended Final Simplifications to Our Minimal Spec

Based on Geovania's example, here are concrete changes to `climate-diplomacy-minimal-spec.md`:

1. **Reduce budget categories from 5 to 3:** Economy, Green Transition, Social. Research and Diplomacy fold into Green Transition and Social respectively. This matches Geovania's simpler resource allocation.

2. **Reduce upgrade types from 9 to 6:**
   - Fossil Power (energy++, emissions++)
   - Renewable Power (energy+, emissions 0)
   - Industry (money++, emissions+)
   - Farm (food++)
   - Social Program (approval+)
   - Research Center (tech level+)
   
   Cut: Advanced Renewables, Green Industry, Carbon Capture → these become effects of higher tech levels, not separate upgrades.

3. **Simplify deals to single-round:** No multi-cycle contracts. Each cycle you can trade resources. Simpler Firebase state, simpler UI.

4. **Reduce factions from 3 to 2 per country:** One pro-transition faction, one status-quo faction. Approval is the balance between them. Cuts faction UI in half while preserving the core tension.

5. **Fixed UN resolution types:** Instead of a card deck, use 3 fixed resolution types that rotate:
   - Carbon tax floor (emissions constraint)
   - Climate finance transfer (money redistribution based on historical emissions)
   - Technology sharing mandate (tech transfer obligation)

6. **Simplify scoring to 2 components:**
   - National Score (50%): GDP + food security + approval
   - Climate Score (50%): shared, based on final global temperature

These changes would bring our feature count from 14 to ~10 and make the game genuinely buildable by a small student team in one semester while still covering all 5 TUM module learning outcomes.

---

## References

- Geovania official site: https://geovania.nettopuis.live/
- Jedd, T., Sattich, T., Bekebrede, G., Van de Graaf, T., Scholten, D., & Schreurs, M. (2024). "Sparking Students' Interest: Teaching About International Climate Negotiation with a Renewable Energy Transition Simulation Game." Journal of Political Science Education.
- TU Delft Gamelab: https://seriousgaming.tudelft.nl/games/geovania/
- TUM Environmental Policy chair: https://www.hfp.tum.de/en/environmentalpolicy/
