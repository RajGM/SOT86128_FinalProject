# Climate Diplomacy — Appendix A: Hex Infrastructure & Population Mechanics

## Referenced from: Game Design Document v0.3, Sections 2 & 10

---

## A1. Core Rule: One Building Per Hex

Each hex supports exactly **one** building. This is the fundamental spatial constraint that drives all placement decisions. A coastal hex can be a Port, a City, a Solar Farm, or a Fish Farm — but not two of them. Players must decide what each hex of their territory does.

**Hex layers:**
```
┌─────────────────────────┐
│  BUILDING (0 or 1)      │  ← The single structure on this hex
├─────────────────────────┤
│  TERRAIN                │  ← Immutable base type (land, coastal, desert, etc.)
├─────────────────────────┤
│  RESOURCE DEPOSIT       │  ← Underground/natural resource (oil, coal, rare earth, etc.)
│  (may be empty)         │     Building doesn't have to match the deposit
└─────────────────────────┘
```

A hex with an oil deposit can have a City built on it — but then you can't extract the oil. You'd need to demolish the City (costs GDP, drops approval, displaces population) to build an Oil Rig. This creates real tradeoffs.

**Demolition:** Any building can be demolished. Cost = 30% of original build cost. Takes 1 round. Displaced population (if City) must be absorbed by adjacent Cities or becomes refugee pressure.

---

## A2. Terrain Compatibility Matrix

Not every building can go on every terrain. This matrix defines what's physically possible.

| Building | Land | Coastal | Desert | Mountain | Forest | Agricultural | Ocean | Strait | Arctic |
|---|---|---|---|---|---|---|---|---|---|
| City | ✓ | ✓ | ✗ | ✗ | ✗¹ | ✓ | ✗ | ✗ | ✗ |
| Farm | ✓ | ✓ | ✗ | ✗ | ✗¹ | ✓✓² | ✗ | ✗ | ✗ |
| Solar Plant | ✓ | ✓ | ✓✓² | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Wind Farm | ✓ | ✓✓² | ✓ | ✓✓² | ✗ | ✓ | ✗ | ✗ | ✗ |
| Coal Plant | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Gas Plant | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Nuclear Plant | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Hydro Dam | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Oil Rig | ✗ | ✗ | ✓³ | ✗ | ✗ | ✗ | ✓³ | ✗ | ✗ |
| Mine | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Factory | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Port | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Airport | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Rail Hub | ✓ | ✓ | ✓ | ✗⁴ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Pipeline Node | ✓ | ✓ | ✓ | ✗⁴ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Research Lab | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Hospital | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Police Station | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Fire Station | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Carbon Capture | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Forest Reserve | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Military Base | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Canal Control | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ |

**Notes:**
1. ✗¹ = Requires deforestation first (irreversible, releases stored CO₂, costs diplomatic reputation). The hex terrain changes from Forest → Land.
2. ✓✓² = Bonus output on this terrain type (e.g., Solar in Desert gets 1.5× output, Wind on Coastal/Mountain gets 1.4× output, Farm on Agricultural gets 1.3× yield).
3. ✓³ = Oil Rig only on hexes with oil deposit. Desert oil rigs are onshore; Ocean oil rigs are offshore (higher cost, higher environmental risk).
4. ✗⁴ = Mountains block Rail and Pipeline unless "Tunnel Engineering" tech is researched.

**Hydro Dam special rule:** Hydro Dams can only be placed on a Land or Agricultural hex that is **adjacent to at least 2 water hexes** (ocean, river, or lake — represented as coastal hexes). This models the need for water flow. Not every coastal hex qualifies — it must be a convergence point.

---

## A3. Building Specifications

Each building has: build cost, build time, inputs (what it consumes per round), outputs (what it produces per round), capacity (maximum throughput), maintenance cost, workforce requirement, emissions, and climate vulnerability.

### A3.1 Power Generation

Power is the fundamental resource. Cities, Factories, Research Labs, and most other buildings consume power. Without sufficient power supply in your territory, buildings operate at reduced capacity or shut down.

**Power is calculated nationally** (not per-hex): total power generation across all your hexes vs total power consumption. If generation < consumption, a rolling brownout reduces all building outputs by the deficit percentage.

---

#### Solar Plant

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $50B | Low relative to output |
| Build Time | 1 round | Fast deployment |
| Input | None | No fuel cost — free energy |
| Output | 8 GW (base) | Modified by terrain: Desert ×1.5, Coastal ×1.0, Land ×0.9 |
| Capacity | 8 GW max | Cannot exceed without Grid Storage tech |
| Maintenance | $5B/round | Panel degradation, cleaning |
| Workforce | 500 | Low labor need |
| Emissions | 0 tons CO₂/round | Zero operational emissions |
| Climate Vulnerability | Sandstorm (Desert): -20% output for 1 round. Hail: 10% damage. |
| Tech Upgrades | Advanced Renewables: output ×1.3. Grid Storage: removes capacity cap variability. |

**Scientific basis:** Solar irradiance varies by latitude. Desert hexes near equator receive ~2,400 kWh/m²/year vs ~1,000 kWh/m²/year at northern latitudes. The 1.5× desert multiplier reflects this real ratio.

---

#### Wind Farm

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $60B | Slightly more than solar |
| Build Time | 1 round | Fast deployment |
| Input | None | No fuel |
| Output | 6 GW (base) | Coastal ×1.4, Mountain ×1.4, Plains ×1.0 |
| Capacity | 6 GW max | |
| Maintenance | $8B/round | Turbine wear, offshore maintenance higher |
| Workforce | 300 | Low |
| Emissions | 0 | Zero operational |
| Climate Vulnerability | Extreme storms: 15% damage. Icing (Arctic/Mountain): -30% output in winter rounds. |
| Tech Upgrades | Advanced Renewables: output ×1.3. Continental Supergrid: share output across hexes. |

**Scientific basis:** Offshore and elevated wind speeds average 8-10 m/s vs 5-6 m/s inland. Capacity factor difference is roughly 40% vs 25%, reflected in the 1.4× multiplier.

---

#### Coal Plant

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $30B | Cheapest power source |
| Build Time | 1 round | Fast, proven technology |
| Input | 2 units Coal/round | Must have coal supply (own deposit or imported) |
| Output | 12 GW | High, reliable baseload |
| Capacity | 12 GW max | Highest single-plant output |
| Maintenance | $10B/round | Ash disposal, scrubbers |
| Workforce | 2,000 | High labor — politically popular in mining regions |
| Emissions | 8 MT CO₂/round | Highest emissions of any power source |
| Climate Vulnerability | Drought: cooling water shortage → output -40%. Heat wave: efficiency drops -15%. |
| Tech Upgrades | Industrial Decarbonization: emissions -30% (CCS retrofit). Circular Economy: ash recycling reduces maintenance -20%. |

**Scientific basis:** Coal emits ~1,000g CO₂/kWh vs ~450g for gas and ~0g for renewables. The 8 MT/round figure scales from global coal plant averages. Thermal plants require cooling water — drought vulnerability is a documented real-world constraint.

---

#### Gas Plant (Natural Gas / LNG)

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $45B | Moderate |
| Build Time | 1 round | |
| Input | 1.5 units Gas/round | Requires gas supply |
| Output | 10 GW | Good baseload, flexible ramp |
| Capacity | 10 GW max | |
| Maintenance | $7B/round | |
| Workforce | 800 | |
| Emissions | 4 MT CO₂/round | Half of coal — the "transition fuel" |
| Climate Vulnerability | Pipeline disruption: if supply route is cut, output drops to 0. Heat wave: -10%. |
| Tech Upgrades | Efficiency: emissions -20%. Carbon Capture (adjacent hex): can capture 50% of emissions. |

**Scientific basis:** Natural gas emits ~450g CO₂/kWh, roughly half of coal. It's dispatchable (can ramp quickly) making it complementary to intermittent renewables. The "transition fuel" framing is the real-world debate: bridge to renewables or lock-in to fossil infrastructure?

---

#### Nuclear Plant

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $200B | Most expensive to build |
| Build Time | 3 rounds | Longest construction — reflects real-world nuclear project timelines |
| Input | 0.5 units Uranium/round | Very fuel-efficient |
| Output | 15 GW | Highest clean energy output |
| Capacity | 15 GW max | Massive baseload |
| Maintenance | $15B/round | Safety systems, waste management |
| Workforce | 3,000 | High — specialized labor |
| Emissions | 0 tons CO₂/round | Zero operational emissions |
| Climate Vulnerability | Earthquake: 5% meltdown risk (hex becomes unusable for 5 rounds, massive HDI + diplomatic penalty). Flooding: cooling system failure risk. |
| Political Cost | Approval -5 on construction (NIMBY effect). If meltdown: approval -30, global diplomatic penalty. |
| Tech Upgrades | Small Modular Reactors: build time 1 round, cost $80B, output 8 GW. Fusion Research: unlimited clean energy (late-game). |

**Scientific basis:** Nuclear lifecycle emissions are ~12g CO₂/kWh (near zero). Construction timelines of 10-15 years for conventional reactors map to 3 game rounds. The meltdown mechanic references Fukushima's political impact — Japan shut down its entire nuclear fleet after one accident.

---

#### Hydro Dam

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $120B | High upfront |
| Build Time | 2 rounds | Major construction project |
| Input | None | Water flow is free |
| Output | 10 GW | Strong baseload |
| Capacity | 10 GW max | |
| Terrain Requirement | Land/Agricultural hex adjacent to ≥ 2 water hexes | River convergence simulation |
| Maintenance | $8B/round | Sedimentation management |
| Workforce | 1,500 | |
| Emissions | 0.5 MT CO₂/round | Reservoir methane emissions (real but small) |
| Climate Vulnerability | Drought: output drops proportional to water level (can go to 0 in severe drought). Flooding: dam failure risk (2% if temp > +2.5°C — catastrophic downstream damage). |
| Side Effect | Floods the adjacent agricultural hex (if any) — that hex loses farm capability. Displaces population. |

**Scientific basis:** Hydropower reservoir methane emissions (from decomposing vegetation) are increasingly documented — typically 20-60g CO₂eq/kWh in tropical regions, less in temperate. Dam failure risks increase with extreme weather events. The Three Gorges and Aswan displacement parallels are intentional.

---

### A3.2 Resource Extraction

---

#### Oil Rig

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $80B (onshore Desert) / $150B (offshore Ocean) | Offshore is more expensive |
| Build Time | 2 rounds | |
| Input | 2 GW power/round | Extraction needs energy |
| Output | 5 units Oil/round | Tradeable commodity |
| Capacity | 5 units max (expandable with tech) | |
| Maintenance | $12B/round (onshore) / $20B/round (offshore) | Offshore maintenance expensive |
| Workforce | 2,000 (onshore) / 500 (offshore) | |
| Emissions | 3 MT CO₂/round | Extraction emissions (flaring, methane leaks) |
| Climate Vulnerability | Hurricane (offshore): 20% damage, oil spill risk (environmental penalty). Permafrost thaw (Arctic): structural damage. |
| Depletion | Oil deposits have finite quantity. Each hex has 30-80 units. When depleted, the rig produces nothing. Players don't know exact quantity until extraction begins. |
| Environmental Risk | 5% oil spill chance per round (offshore). Spill: -15 diplomatic reputation, -10 approval (Green faction), adjacent ocean hexes fishing output halved for 3 rounds. |

---

#### Mine (Coal, Rare Earth, Lithium, Uranium)

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $40B | |
| Build Time | 1 round | |
| Input | 3 GW power/round | Heavy energy use |
| Output | 4 units of deposit resource/round | Type depends on hex deposit |
| Capacity | 4 units max | |
| Maintenance | $8B/round | |
| Workforce | 5,000 | Very high — mining is labor-intensive |
| Emissions | 2 MT CO₂/round | Diesel equipment, processing |
| Climate Vulnerability | Flooding: mine shaft flooding (output 0 for 2 rounds). Heat: worker productivity -20%. |
| Depletion | Finite deposit. 20-60 units depending on hex. |
| Political Note | Coal mines employ many workers. Closing a mine (demolishing) causes -20 satisfaction in Industry/Populist factions due to job losses. This is the "just transition" problem. |

---

### A3.3 Population and Services

---

#### City

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $100B | Major investment |
| Build Time | 2 rounds | |
| Input | 5 GW power/round, 2 units Food/round | Cities consume power and food |
| Output | $30B GDP/round, 10,000 workforce | Economic engine + labor supply |
| Capacity | 10,000 population (expandable: see City Levels) | |
| Maintenance | $15B/round | Infrastructure upkeep |
| Emissions | 3 MT CO₂/round (base) | Reducible with tech: Electric Vehicles -30%, Smart Grid -20% |
| Climate Vulnerability | **See Section A4 (Critical)** |
| Service Requirements | **See Section A5 (Critical)** |

**City Levels (growth):**

Cities can grow if adjacent hexes provide sufficient food, power, and services.

| Level | Population | GDP Output | Power Need | Food Need | Services Needed |
|---|---|---|---|---|---|
| Town | 5,000 | $15B/round | 3 GW | 1 Food | None |
| City | 10,000 | $30B/round | 5 GW | 2 Food | 1 Hospital |
| Metro | 25,000 | $80B/round | 12 GW | 5 Food | 1 Hospital, 1 Police, 1 Fire |
| Megacity | 50,000 | $200B/round | 25 GW | 10 Food | 2 Hospital, 2 Police, 1 Fire |

Cities grow automatically when conditions are met (surplus food, power, services). Growth takes 2 rounds per level. Players can also choose to NOT grow (cap the city) to avoid service burden.

---

#### Farm

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $20B | Cheapest building |
| Build Time | 1 round | |
| Input | 1 GW power/round (irrigation, equipment) | |
| Output | 4 units Food/round | Feeds Cities |
| Capacity | 4 Food max | |
| Terrain Bonus | Agricultural hex: ×1.3 output. Coastal: ×1.0. Land: ×0.9. | |
| Maintenance | $3B/round | |
| Workforce | 3,000 | Agriculture is labor-intensive |
| Emissions | 1.5 MT CO₂/round | Fertilizer, livestock, machinery |
| Climate Vulnerability | **Drought:** output -50%. **Flooding:** output 0 for 1 round. **Heat wave:** output -30%. **Locust event:** output -60% for 1 round. |
| Tech Upgrades | Drought-Resistant Crops: drought penalty halved. Vertical Farming: output ×1.5, no climate vulnerability (indoor). Synthetic Food: replaces 2 farms' output with 1 lab. |

**Scientific basis:** Agriculture contributes ~10-12% of global greenhouse gas emissions (IPCC AR6). Crop yield reduction under +2°C is documented at 5-15% for major cereals (wheat, rice, maize). The drought/heat penalties scale from IPCC crop yield projections.

---

#### Hospital

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $40B | |
| Build Time | 1 round | |
| Input | 2 GW power/round | |
| Output | Healthcare service (covers 10,000 population in a 2-hex radius) | |
| Capacity | 10,000 population served | |
| Maintenance | $8B/round | |
| Workforce | 1,500 | |
| Emissions | 0.5 MT CO₂/round | Minimal |
| Effect | +0.02 HDI per hospital. Reduces mortality from climate events. Without hospital coverage, climate event casualties double. |
| Climate Vulnerability | Flooding: hospital offline for 1 round (catastrophic during events). |

---

#### Police Station

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $20B | |
| Build Time | 1 round | |
| Input | 1 GW power/round | |
| Output | Security service (covers 10,000 population in a 2-hex radius) | |
| Capacity | 10,000 population served | |
| Maintenance | $5B/round | |
| Workforce | 1,000 | |
| Emissions | 0.3 MT CO₂/round | |
| Effect | Prevents crime penalty. Without police coverage, Cities with population > 10,000 suffer: GDP -10%, approval -5 (all factions). Crime events trigger randomly in unpoliced cities. |

---

#### Fire Station

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $15B | |
| Build Time | 1 round | |
| Input | 1 GW power/round | |
| Output | Fire service (covers hexes in a 2-hex radius) | |
| Capacity | Covers ~12 hexes | |
| Maintenance | $4B/round | |
| Workforce | 800 | |
| Emissions | 0.2 MT CO₂/round | |
| Effect | Reduces wildfire damage by 80% in covered hexes. Reduces fire spread to adjacent hexes. Without fire coverage: wildfire destroys building entirely, forest hexes burn (carbon sink lost + emissions spike), fire can spread to adjacent hexes each tick. |
| Climate Trigger | Wildfire probability increases with temperature: base 5%/round at +1.5°C, 15%/round at +2.5°C, 30%/round at +3.0°C. |

---

### A3.4 Industry and Trade Infrastructure

---

#### Factory (Manufacturing Hub)

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $80B | |
| Build Time | 2 rounds | |
| Input | 8 GW power/round, 2 units raw materials/round | Consumes power + raw resources |
| Output | 6 units Manufactured Goods/round, $20B GDP/round | Converts raw materials to higher-value goods |
| Capacity | 6 units max | |
| Maintenance | $12B/round | |
| Workforce | 8,000 | High employment — politically significant |
| Emissions | 5 MT CO₂/round | Heavy industry |
| Climate Vulnerability | Heat wave: worker productivity -20%. Flooding: offline 2 rounds. |
| Supply Chain | Raw materials (ore, rare earth, lithium, oil derivatives) must be delivered to the factory hex via trade route or from an adjacent mine/rig. |
| Tech Upgrades | Industrial Decarbonization: emissions -40%. Circular Economy: raw material input -30% (recycling). |

**Note on China's advantage:** China starts with more Factory hexes than any other player. This is their manufacturing dominance — everyone else either builds their own factories (expensive, slow) or buys Chinese manufactured goods (trade dependency).

---

#### Port

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $60B | |
| Build Time | 2 rounds | Major construction |
| Input | 3 GW power/round | Cranes, logistics |
| Output | Enables sea trade from this hex. Throughput: 10 units cargo/round. | |
| Capacity | 10 units/round (expandable with tech) | |
| Terrain Requirement | Coastal hex only | |
| Maintenance | $10B/round | |
| Workforce | 3,000 | |
| Emissions | 2 MT CO₂/round | Diesel cranes, ship fueling |
| Climate Vulnerability | Sea level rise (+2.0°C): port efficiency -30%. Storm surge (+2.5°C): offline 1 round. Flooding (+3.0°C): port destroyed. |
| Tech Upgrades | Green Shipping: emissions -60%. Electrification: emissions -80%. |

---

#### Airport

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $70B | |
| Build Time | 1 round | Faster than port |
| Input | 4 GW power/round | |
| Output | Enables air trade. Throughput: 3 units cargo/round (low capacity, fast). | |
| Capacity | 3 units/round | |
| Maintenance | $12B/round | |
| Workforce | 2,000 | |
| Emissions | 4 MT CO₂/round | Aviation fuel — highest per-unit emissions |
| Climate Vulnerability | Extreme storms: offline 1 round. Heat wave: runway heat limits → capacity -20%. |
| Tech Upgrades | Hydrogen Freight: emissions -50%. Zero-Emission Logistics: emissions -90%. |

---

#### Rail Hub

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $40B per hex | Must build connected chain of rail hexes |
| Build Time | 1 round per hex | |
| Input | 2 GW power/round per hub | |
| Output | Land trade route. Throughput: 8 units cargo/round. Speed: 2 hex/tick. | |
| Capacity | 8 units/round | |
| Maintenance | $5B/round per hex | |
| Workforce | 1,000 per hub | |
| Emissions | 1.5 MT CO₂/round (diesel) → 0.3 MT (electric rail tech) | |
| Terrain Restriction | Cannot cross Mountain or Ocean without tunnel/bridge tech | |
| Tech Upgrades | Electric Vehicles: emissions -80%. High-Speed Rail: speed 4 hex/tick. Maglev: speed 6 hex/tick, 0 emissions. |

---

#### Pipeline Node

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $30B per hex | Must connect in chain from source to destination |
| Build Time | 1 round per hex | |
| Input | 1 GW power/round (pumping stations) | |
| Output | Continuous oil/gas flow: 6 units/round. No loading/unloading delay. | |
| Capacity | 6 units/round | |
| Maintenance | $3B/round per hex | |
| Workforce | 200 per node | Low — automated |
| Emissions | 0.5 MT CO₂/round | Methane leakage |
| Climate Vulnerability | Permafrost thaw (Arctic): structural failure, 20% leak chance. Earthquake: rupture risk. |
| Sabotage Risk | In hostile relations (< -30), adjacent player can sabotage pipeline. Repair: 1 round + cost. |

---

### A3.5 Research and Defense

---

#### Research Lab

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $60B | |
| Build Time | 2 rounds | |
| Input | 4 GW power/round | Supercomputing, facilities |
| Output | +2 Research Points/round (modified by country multiplier) | |
| Capacity | 2 RP max per lab | |
| Maintenance | $10B/round | |
| Workforce | 2,000 (specialized — requires social spending for education pipeline) | |
| Emissions | 1 MT CO₂/round | Data centers, lab operations |
| Climate Vulnerability | Low — labs are hardened facilities. Flooding: offline 1 round. |
| Adjacency Bonus | Two labs on adjacent hexes: +1 RP bonus (research cluster effect). Three+: +2 RP. Simulates Silicon Valley / Zhongguancun cluster dynamics. |

---

#### Carbon Capture Facility

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $150B | Very expensive |
| Build Time | 2 rounds | |
| Input | 6 GW power/round | Extremely energy-intensive |
| Output | Removes 3 MT CO₂/round from atmosphere | Direct air capture |
| Capacity | 3 MT max | |
| Maintenance | $12B/round | |
| Workforce | 1,000 | |
| Emissions | 0 (net negative if powered by clean energy) | If powered by fossil, net benefit is reduced |
| Requirement | Research Level: Carbon Capture tech unlocked | Cannot build without research |
| Net Calculation | If powered by coal plant (8 MT emissions), carbon capture removes 3 MT → net 5 MT. If powered by nuclear/solar, full 3 MT removed. Power source matters. |

**Scientific basis:** Current DAC (Direct Air Capture) facilities like Climeworks' Orca plant capture ~4,000 tons CO₂/year. The energy intensity is ~6-10 GJ per ton CO₂. The mechanic reflects that carbon capture is only useful if powered by clean energy — otherwise you're burning fossil fuel to capture carbon, which is a net loss. This is a real and active debate in climate policy.

---

#### Military Base

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $80B | |
| Build Time | 2 rounds | |
| Input | 5 GW power/round | |
| Output | Security coverage (5-hex radius): trade route protection, chokepoint defense, sanctions enforcement credibility | |
| Capacity | 1 base covers ~60 hexes | |
| Maintenance | $15B/round | Highest maintenance of any building |
| Workforce | 5,000 | |
| Emissions | 3 MT CO₂/round | Military operations are carbon-intensive |
| Effect | Deters sanctions against you. Protects trade routes from piracy events. Enables blockade of adjacent chokepoints. Satisfies Military-Industrial/Security faction. |
| Opportunity Cost | $15B/round maintenance could fund 3 solar plants or 1 research lab instead. This IS the guns-vs-butter tradeoff. |

---

### A3.6 Special Buildings

---

#### Forest Reserve (designation, not construction)

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $0 | Just designate — it's already a forest |
| Build Time | 0 rounds | Instant |
| Input | None | |
| Output | Carbon sink: absorbs 2 MT CO₂/round per hex. Biodiversity bonus: +0.01 HDI. | |
| Maintenance | $2B/round | Park rangers, anti-poaching |
| Workforce | 500 | |
| Opportunity Cost | Cannot build anything else on this hex. Cannot extract resources underneath. The "cost" is what you give up. |
| Vulnerability | Wildfire: if no fire station coverage, forest burns → hex changes to Land terrain (irreversible). Carbon stored is released as emissions. |
| Tradeable | Other players can pay you to maintain Forest Reserves (REDD+ credits). |

---

#### Canal Control (Strait hexes only)

| Parameter | Value | Notes |
|---|---|---|
| Build Cost | $100B | |
| Build Time | 2 rounds | |
| Input | 3 GW power/round | |
| Output | Controls trade throughput. Earns transit fees: $2B per cargo unit passing through. Can block or tax traffic. | |
| Capacity | 15 units/round throughput | |
| Maintenance | $10B/round | |
| Workforce | 2,000 | |
| Effect | Major revenue source + geopolitical leverage |
| Climate Vulnerability | Sea level rise: requires ongoing investment to maintain. At +3.0°C, canal may become impassable without $50B upgrade. |

---

## A4. Climate Vulnerability — Detailed Impact Model

### A4.1 Sea Level Rise (Coastal Hex Degradation)

As global temperature rises, coastal hexes degrade progressively. This is the most visible and devastating climate impact in the game.

| Temperature | Coastal Hex Effect | Buildings Affected |
|---|---|---|
| +1.5°C | Minor erosion: maintenance costs +20% for all coastal buildings | All coastal buildings |
| +2.0°C | Moderate flooding: building output -30%. Storm surge events (20% chance/round). | Cities, Ports, Farms most affected |
| +2.5°C | Major flooding: buildings at 50% capacity. Infrastructure damage events (30% chance/round). | Port throughput halved. Coastal Cities generate refugees. |
| +3.0°C | Inundation: coastal hex becomes **permanently impassable**. All buildings destroyed. Population displaced. | Total loss. Hex flips to Ocean terrain. Irreversible. |

**Which countries suffer most from sea level rise:**
- **India:** Massive coastline, Mumbai and Chennai are coastal Cities. Gangetic delta flooding displaces millions.
- **EU:** Netherlands, northern Germany, coastal Mediterranean cities.
- **USA:** Florida, Gulf Coast, East Coast cities.
- **China:** Shanghai, Hong Kong, Shenzhen — major economic hubs on coast.
- **OPEC+:** Gulf states (low-lying desert coast), but also Russia's Arctic coast (different mechanism — permafrost thaw).

**Scientific basis:** IPCC AR6 projects 0.3-0.6m sea level rise at +1.5°C and 0.5-1.0m at +2.0°C. At +3.0°C, multi-meter rise is possible over centuries. The progressive hex degradation compresses this timeline for gameplay but preserves the relative severity and geographic distribution.

### A4.2 Heat and Drought

| Temperature | Effect |
|---|---|
| +1.5°C | Agricultural hexes: 10% chance of drought per round. Farm output -30% during drought. |
| +2.0°C | Agricultural hexes: 25% drought chance. Worker productivity -10% in all desert/equatorial hexes. |
| +2.5°C | Agricultural hexes: 40% drought chance. Farm output during drought: -60%. Water conflict events between adjacent players sharing river systems. |
| +3.0°C | Agricultural hexes: 60% drought chance. Equatorial hexes become too hot for outdoor labor (Factory/Mine output -40% in affected hexes). |

### A4.3 Wildfire

| Temperature | Forest Hex Fire Risk/Round | Spread |
|---|---|---|
| +1.0°C | 3% | Does not spread |
| +1.5°C | 8% | Spreads to 1 adjacent forest hex |
| +2.0°C | 15% | Spreads to 2 adjacent hexes (including non-forest) |
| +2.5°C | 25% | Spreads to 3 adjacent hexes. Can destroy cities. |
| +3.0°C | 40% | Firestorm: spreads to all adjacent hexes. Only fire stations can stop it. |

**Fire consequences:**
- Forest hex: terrain changes Forest → Land (irreversible). Stored carbon released as emissions spike.
- City hex: building damaged. -30% GDP output for 2 rounds. Population casualties → HDI drop.
- Farm hex: crop destroyed. 0 food output for 2 rounds.
- Fire Station coverage: reduces fire spread by 80% and damage by 60%.

### A4.4 Extreme Weather Events

Each round, there's a base probability of extreme weather events that increases with temperature. Events target specific hex types.

| Event | Base Probability | Temp Scaling | Target | Effect |
|---|---|---|---|---|
| Hurricane/Cyclone | 10%/round | +5% per +0.5°C | Coastal hexes (tropical) | 20% building damage, 1 round offline |
| Tornado | 5%/round | +3% per +0.5°C | Plains/Agricultural hexes | Farm output 0 for 1 round, 10% building damage |
| Heatwave | 15%/round | +10% per +0.5°C | All non-Arctic hexes | Worker productivity -20%, power demand +30% |
| Cold Snap | 5%/round | -2% per +0.5°C (less likely as temp rises) | Northern hexes | Power demand +50%, gas consumption spikes |
| Flooding (non-sea) | 10%/round | +5% per +0.5°C | River-adjacent, low-elevation | Mine flooding, city damage, farm destruction |

---

## A5. Population and Service Requirements

### A5.1 Population Mechanics

Population is generated by Cities and consumed as workforce by all other buildings. Every building requires workers. If total workforce demand exceeds total population, buildings operate at reduced capacity proportional to the labor shortage.

```
Labor Utilization = min(1.0, total_population / total_workforce_demand)
All building outputs × Labor Utilization
```

**Population growth:** Cities grow by 5% per round IF:
- Food supply meets demand
- Power supply meets demand
- Service requirements met (Hospital, Police, Fire)
- Approval rating > 30

**Population decline:** Cities lose population IF:
- Food deficit (starvation): -10% population/round
- Power deficit (brownout): -3% population/round (emigration)
- No hospital coverage: -5% population/round (mortality)
- Climate event casualties: varies by event severity
- War refugee displacement from adjacent flooded/destroyed hexes

### A5.2 Service Coverage Model

Services (Hospital, Police, Fire) have a **2-hex radius** coverage area. A City is "covered" if a service building exists within 2 hexes of it. Cities outside coverage suffer penalties.

```
  Example: H = Hospital, C = City, · = empty hex

       · · ·
      · H · ·      ← Hospital at center
     · · · · ·     ← Covers all hexes within 2 rings
      · C · ·      ← This City IS covered (1 hex away)
       · · ·
        · C ·      ← This City is NOT covered (3 hexes away)
```

### A5.3 Unserviced City Penalties

| Missing Service | Penalty | Escalation |
|---|---|---|
| **No Hospital** | HDI -0.03/round. Climate event casualties ×2. Population growth stops. | After 3 rounds: disease outbreak event. -10% population. |
| **No Police** | GDP -10% (theft/corruption). Approval -5 all factions. | After 3 rounds: crime wave event. GDP -20%. Factory output -30%. |
| **No Fire Station** | Wildfire damage ×5. Fire spreads unchecked to adjacent hexes. | After fire event: potential cascade destruction of multiple hexes. |
| **No Hospital + No Police** | Combined penalties + "failed state" modifier: all building outputs -30%. | International credibility collapse. Relations -10 with all players. |

### A5.4 Service Building Placement Dilemma

This is where the one-building-per-hex rule creates genuine tradeoffs. A City hex surrounded by 6 adjacent hexes can allocate those hexes to:

```
Example layout for a growing Metro (needs Hospital + Police + Fire):

         Solar
      Farm   Hospital
   Airport  CITY  Police
      Farm   Fire
         Factory

That's 8 hexes used: 1 City + 2 Farms + 1 Solar + 1 Hospital + 1 Police + 1 Fire + 1 Airport + 1 Factory

But what if this hex also has oil underneath? And you need a Port for trade?
Something has to go. Do you sacrifice a Farm (food deficit)?
Remove the Fire Station (wildfire risk)? Skip the Airport (no air trade)?

THIS is the game.
```

---

## A6. Supply Chain Model

### A6.1 Resource Flow

Resources flow through a chain: Extraction → Processing → Consumption. Not everything is directly usable.

```
Raw Resources          Processing              End Use
─────────────         ────────────            ──────────
Oil Deposit  ──→  Oil Rig  ──→  Crude Oil  ──→  Gas Plant (fuel)
                                            ──→  Factory (plastics, chemicals)
                                            ──→  Export (trade revenue)

Coal Deposit ──→  Mine    ──→  Coal        ──→  Coal Plant (fuel)
                                            ──→  Factory (steel)
                                            ──→  Export

Rare Earth   ──→  Mine    ──→  Rare Earth  ──→  Factory (→ Solar Panels, Batteries, Electronics)
                                            ──→  Export (China's leverage)

Uranium      ──→  Mine    ──→  Uranium     ──→  Nuclear Plant (fuel)

Lithium      ──→  Mine    ──→  Lithium     ──→  Factory (→ Batteries → Grid Storage, EVs)

Farm         ──→  (direct) ──→ Food        ──→  City (population sustenance)
```

**Key implication:** You can't just build solar panels from nothing. Solar Plants require manufactured solar panels, which require rare earths, which require mines, which require rare earth deposits. If you don't have rare earth deposits, you must import from whoever does (China controls 60%). This is the supply chain dependency that makes trade essential.

### A6.2 Factory Input-Output Table

| Input | Output | Ratio | Notes |
|---|---|---|---|
| 2 Rare Earth + 2 GW power | 3 Solar Panels | Per round | Used to build Solar Plants |
| 2 Lithium + 1 Rare Earth + 3 GW power | 2 Battery Units | Per round | Used for Grid Storage, EVs |
| 3 Coal + 2 Iron (from Mine) + 4 GW power | 4 Steel Units | Per round | Used for infrastructure construction |
| 2 Oil + 2 GW power | 3 Plastic/Chemical Units | Per round | Used for manufacturing, medical supplies |

**Simplification note for gameplay:** We don't need to model every intermediate product. The key insight is that **manufacturing requires inputs**, inputs come from specific hexes, and controlling those hexes (or trading for them) is the strategic game. The exact ratios can be tuned during playtesting.

---

## A7. Power Grid Balance

### A7.1 National Power Calculation

Each round, the game calculates total power generation vs total power consumption for each player.

```
Total Generation = Σ (all power plant outputs in your territory)
Total Consumption = Σ (all building power inputs in your territory)
Power Balance = Generation - Consumption
```

| Balance | Effect |
|---|---|
| Surplus (> 0) | All buildings run at 100%. Excess can be exported (if Continental Supergrid tech). |
| Balanced (= 0) | All buildings run at 100%. No margin for new construction. |
| Deficit (< 0) | **Brownout:** all buildings operate at (Generation / Consumption × 100)% capacity. |
| Severe deficit (< -30%) | **Blackout:** critical buildings (Hospitals, Police) get priority. Factories, Airports shut down. GDP crashes. Approval drops -15. |

### A7.2 Energy Transition Challenge

This mechanic is why energy transition is hard in the game (and in reality). A player currently running on coal can't just demolish all coal plants and build solar — the intermediate period would cause blackouts. They must:

1. Build new renewable capacity WHILE keeping coal running (needs spare hexes)
2. Wait for renewable output to match coal output
3. THEN demolish coal plants
4. But the coal plant hex workforce (2,000 workers) is now unemployed → faction anger

This sequence mirrors the real-world energy transition challenge. Germany's Energiewende, US coal-to-gas shift, China's renewable buildout alongside continued coal expansion — all face this same timing problem.

---

## A8. Scientific Model References

The game's environmental mechanics are grounded in real scientific models, simplified for gameplay.

| Mechanic | Scientific Basis | Source |
|---|---|---|
| Temperature → sea level rise | IPCC AR6 sea level projections | IPCC, 2021 |
| Temperature → crop yield | IPCC AR6 food security chapter | Porter et al., 2014 |
| Temperature → extreme weather frequency | Attribution science (increasing probability with warming) | NAS, 2016 |
| Coal vs gas vs renewables emissions | Lifecycle emission factors (gCO₂/kWh) | IPCC WGIII, 2022 |
| Carbon capture energy intensity | 6-10 GJ/ton CO₂ for DAC | Fasihi et al., 2019 |
| Methane from reservoirs | Tropical reservoir emissions | Deemer et al., 2016 |
| Wildfire probability scaling | Fire weather index projections | Jolly et al., 2015 |
| Permafrost methane feedback | Arctic carbon feedback models | Schuur et al., 2015 |
| Solar irradiance by latitude | NASA Surface Solar Energy dataset | NASA SSE |
| Wind speed by geography | Global Wind Atlas | DTU Wind Energy |

---

## A9. Hex Interaction — UI Specification

### A9.1 Hex Selection

- **Click hex:** Select it. Side panel shows: terrain type, resource deposit (if visible), current building (if any), climate vulnerability status, workforce, power consumption/generation.
- **Right-click / long-press:** Context menu with available actions: Build, Demolish, Designate Forest Reserve, View Details.
- **Hover:** Tooltip showing hex coordinates, terrain type, owner, building name.

### A9.2 Build Menu

When building, the menu only shows buildings compatible with the selected hex's terrain type (per the compatibility matrix in A2). Greyed-out buildings show why they can't be built: "Requires Coastal terrain," "Requires Carbon Capture tech," "Insufficient GDP."

### A9.3 Visual Indicators on Hexes

| Indicator | Visual |
|---|---|
| Building | Icon centered on hex (factory smokestack, solar panel, wind turbine, etc.) |
| Resource deposit | Small colored dot in hex corner (black = oil, brown = coal, purple = rare earth, green = lithium, yellow = uranium) |
| Climate damage | Red border on hex. Intensity increases with damage level. |
| Flooding | Blue overlay with wave pattern. Opacity increases with sea level. |
| Fire | Orange/red animated glow. Spreads visually to adjacent hexes. |
| Power deficit | Flickering effect on affected buildings. |
| Service coverage | When placing Hospital/Police/Fire, highlight the 2-hex coverage radius. |
| Trade route | Animated dots moving along the path between ports/airports. |
| Fog of war | Unexplored hexes are darker. Approximate hexes have slight fog. Full visibility is clear. |
