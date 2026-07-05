# Simplified Route System v2

## Core Concept
Routes are **separate from trades**. First establish a route, then trade on it.

## Infrastructure (buildable on hex tiles)
- **Airport** — enables air routes. Any tile.
- **Dock/Port** — enables sea routes. Coastal tiles only.
- **Transport Center** — enables land routes. Any land tile.

Each can be built multiple times per region. Tier (1–3) determines:

| Tier | Max Routes | Emissions/cycle | Upkeep/cycle |
|------|-----------|-----------------|-------------|
| 1    | 2         | High            | 20 money    |
| 2    | 4         | Medium          | 35 money    |
| 3    | 6         | Low             | 50 money    |

**Capacity** = max active routes using that specific facility. Building more facilities of the same type adds more route slots.

## Route Types
- **Land** — both regions need a transport center + must be connected via BORDER_PAIRS adjacency graph (direct or multi-hop)
- **Sea** — both regions need a dock. Available between any two regions with coastal access.
- **Air** — both regions need an airport. Available between any two regions.

## Sea-Gap Rule
If two regions have **no land path** (no chain of border adjacency), only air or sea routes are possible. Land routes require a continuous chain of land-bordering regions.

## Route Proposal Flow
1. Player selects destination region and route type (land/air/sea)
2. System auto-finds all valid paths for that type
3. Player picks from the list of options
4. If intermediary regions exist in the path → transit requests sent
5. Intermediary accepts with fee terms: flat per cycle OR commission %
6. Once all intermediaries approve → route becomes active

## Transit Fees
- **Flat fee**: fixed money per cycle, deducted from route owner
- **Commission**: percentage of each trade's value, deducted per trade

## Trading on Routes
Once a route is active, player can propose trades on it:
- Select an active route
- Choose item + amount + mode (one-time / continuous)
- Trade executes using that route's emissions profile

## Cycle Processing
Each cycle:
1. Deduct infrastructure upkeep (all airports/docks/transport centers)
2. Deduct flat transit fees
3. Process continuous trades (apply commission, emissions, resource transfer)
4. Auto-disrupt routes if relations drop below 30

## What's Removed
- Route animations (plane/ship/truck icons)
- Animation toggle button
- Route type "border" and "land_transit" → unified as "land"
- Implicit route creation via trade proposal
