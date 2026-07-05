# Transport System — v2 (Single Hub)

## Summary

One building type: **Transport Hub**. Tier determines reach. Capacity is units per cycle. Multiple hubs stack. Route logic (BFS, transit agreements, commissions) stays.

---

## What Changed from v1

| Before (3 buildings) | After (1 building) |
|---------------------|-------------------|
| Airport, Dock, Transport Center | Transport Hub |
| Each building = one route type | Tier unlocks route types |
| Capacity = number of routes per facility | Capacity = total units tradeable per cycle |
| Player picks route type manually | System auto-finds cheapest path for the tier |
| 3 separate build costs, 3 workforce numbers | 1 building, linear scaling |
| Route establishment as separate step | Trade directly if hub can reach + has capacity |

**What stays the same:**
- BFS pathfinding over BORDER_PAIRS for land routes
- `hasLandConnection()` for sea-gap detection
- Transit agreements for intermediate countries
- Commission (one-time or per-cycle) for hops
- Route disruption on low relations

---

## Transport Hub

### Tiers & Reach

| Tier | Reach | How it connects |
|------|-------|----------------|
| T1 | **Land neighbors only** | BFS over BORDER_PAIRS. Must have continuous land path. |
| T2 | **+ Sea routes** | If no land path exists (sea gap), can trade with any country that has a coast. Hub must be on coastal tile. |
| T3 | **+ Air routes (anyone)** | Can trade with any country regardless of geography. No restrictions. |
| T3+N | Same as T3 | Reach doesn't expand further. Only capacity increases. |

### Capacity

Capacity = total units of resources you can move through ALL trades per cycle.

| Tier | Capacity (units/cycle) |
|------|----------------------|
| T1 | 20 |
| T2 | 40 |
| T3 | 60 |
| T3+1 | 80 |
| T3+2 | 100 |
| T3+N | 60 + (N × 20) |

**Multiple hubs stack.** Two T1 hubs = 40 units/cycle total. One T2 + one T1 = 60 units/cycle, and T2's sea reach is available.

A country's **total transport capacity** = sum of all hub capacities. Reach = highest tier among all hubs.

### Costs

| | T1 | T2 | T3 | Each +1 after T3 |
|---|---|---|---|---|
| **Build cost** | 80 money | +70 | +90 | +50 |
| **Workforce** | 6 | 6 | 6 | 6 |
| **Recurring** | 10 money/cycle | 18 money/cycle | 28 money/cycle | +8 money/cycle |
| **Terrain** | Any land | Coastal only (for sea) | Any land | Same tile |

Note: T2 requires coastal tile because it enables sea routes. T1 and T3 can be on any land tile. A country can have a T1 inland hub (land only) AND a T2 coastal hub (adds sea reach).

### Transport CO₂

Each trade generates CO₂ based on the route type used:

| Route type | CO₂ per trade |
|-----------|--------------|
| Land | 3 |
| Sea | 5 |
| Air | 8 |

System auto-picks the cheapest available route type (land first, then sea, then air). Player doesn't choose — lowest CO₂ path is used automatically.

---

## Route Logic (unchanged)

### How a trade happens

1. Player says: "Trade 30 food to EU"
2. System checks: does my country have a hub? What's my highest tier?
3. System checks: is there capacity left this cycle?
4. System finds the route:
   - **Land path exists?** (BFS over BORDER_PAIRS) → use land route (3 CO₂)
   - **No land path, both have coast, I have T2+?** → use sea route (5 CO₂)
   - **No land or sea option, I have T3?** → use air route (8 CO₂)
   - **None of the above?** → trade blocked, need to upgrade hub
5. If land route goes through intermediate countries → transit agreement needed
6. Trade executes, capacity deducted, CO₂ applied

### Transit agreements (kept)

When a land route passes through intermediate regions (e.g. USA → LatAm → Africa → EU), each intermediate country must agree to transit.

- Intermediate country sets fee: **one-time payment** or **recurring % commission per cycle**
- If intermediate country denies transit → that land path blocked, system tries next cheapest route
- If relations with intermediate country drop below 30 → transit auto-cancelled, route disrupted

### Capacity accounting

Each unit of resource traded costs 1 unit of transport capacity.

Example: Country has 60 capacity/cycle (one T3 hub).
- Trade 30 food to India → 30 capacity used, 30 remaining
- Trade 20 energy to EU → 20 capacity used, 10 remaining
- Trade 15 tech to Africa → blocked, only 10 capacity left. Can trade 10 max.

Capacity resets each cycle.

---

## Post-T3 Upgrades

After reaching T3, keep upgrading the same hub. Each upgrade costs 50 money and adds +20 capacity. No tier cap — just linear scaling.

| Upgrade | Total capacity | Cost from T3 |
|---------|---------------|-------------|
| T3 base | 60 | — |
| T3+1 | 80 | +50 |
| T3+2 | 100 | +50 |
| T3+3 | 120 | +50 |
| T3+N | 60 + N×20 | +50 per |

Recurring cost also scales: +8 money/cycle per upgrade level.

### Trading hub tier

A country can **trade hub upgrades directly to another country**. This models infrastructure investment:

- "I'll upgrade your hub from T1 to T2 if you give me 40 fuel"
- The upgrade happens on the receiving country's hub
- Cost is paid by whoever the deal specifies (sender or receiver)
- This lets rich countries build transport infrastructure in developing nations — real-world parallel to development aid

This is a **trade item**, not automatic. Both sides negotiate and agree.

---

## Comparison with v1

| Aspect | v1 (3 buildings) | v2 (1 building) |
|--------|-----------------|-----------------|
| Buildings to learn | 3 (airport, dock, transport center) | 1 (transport hub) |
| Player decisions | Which infra to build, where, which route type | How many hubs, when to upgrade tier |
| Route selection | Manual — player picks from options | Automatic — system picks cheapest |
| Capacity model | Routes per facility | Units per cycle (total) |
| Code complexity | 3 build defs, facility matching, per-facility capacity | 1 build def, sum-based capacity |
| BFS / transit | Yes | Yes (unchanged) |
| Grade relevance | Transport logistics (not political) | Simpler, lets player focus on policy decisions |

---

## Example Gameplay

### Early game (Cycle 1-3)
India builds T1 hub on land tile. Can now trade with China and OPEC (land neighbors via BORDER_PAIRS). 20 units/cycle capacity — enough for small food/energy trades.

### Mid game (Cycle 4-6)
India upgrades to T2 on a coastal tile. Now can trade with anyone via sea (EU, USA, LatAm, Africa). 40 units/cycle. Starts importing tech from EU for food.

### Late game (Cycle 7+)
India upgrades to T3. Can now air-trade with anyone. Capacity 60 units/cycle. Buys 2nd hub (T1) for +20 capacity = 80 total. Becomes a trade hub connecting South and North.

EU offers to upgrade Africa's hub from T1 to T2 in exchange for rare earth access. Africa agrees — gets sea trade capability, EU gets minerals.
