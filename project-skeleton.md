# Climate Diplomacy — Project Skeleton

## Tech Stack (Locked)

```
React 19 + Vite + TypeScript
Firebase 11 (Realtime Database + Google Auth + Cloud Functions)
honeycomb-grid (hex math) + custom SVG rendering
Zustand (client state)
Tailwind CSS + shadcn/ui (UI)
Recharts (dashboard charts)
Vercel (static hosting)
```

---

## 1. Directory Structure

```
climate-diplomacy/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── .env                          # Firebase config (VITE_FIREBASE_*)
├── .env.example
├── vercel.json
│
├── public/
│   ├── favicon.svg
│   └── map-data/
│       └── hex-layout.json       # Pre-computed hex positions for 6 countries
│
├── src/
│   ├── main.tsx                  # React root + router
│   ├── App.tsx                   # Route definitions
│   ├── index.css                 # Tailwind imports
│   │
│   ├── config/
│   │   ├── firebase.ts           # Firebase app init, auth, db refs
│   │   ├── countries.ts          # Starting stats for all 6 countries
│   │   ├── upgrades.ts           # Upgrade definitions (cost, effect)
│   │   ├── resolutions.ts        # UN resolution card definitions
│   │   ├── factions.ts           # Faction definitions per country
│   │   └── constants.ts          # CYCLE_DURATION_MS, MAX_CYCLES, thresholds
│   │
│   ├── types/
│   │   ├── game.ts               # Country, Player, Cycle, Deal, Resolution
│   │   ├── hex.ts                # HexTile, HexCoord, TerrainType
│   │   ├── decisions.ts          # PlayerDecision, BudgetAllocation
│   │   └── firebase.ts           # DB path types, snapshot shapes
│   │
│   ├── stores/
│   │   ├── authStore.ts          # Google auth state (user, loading)
│   │   ├── gameStore.ts          # Room state synced from Firebase
│   │   ├── uiStore.ts            # Panel selection, modals, local UI
│   │   └── decisionStore.ts      # Current cycle's unsaved decisions
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Google sign-in/out
│   │   ├── useRoom.ts            # Create/join/leave room
│   │   ├── useGameSync.ts        # Firebase onValue listeners → gameStore
│   │   ├── useTimer.ts           # Local countdown from cycleDeadline
│   │   ├── useDeals.ts           # Propose/accept/reject deals
│   │   └── useVote.ts            # UN resolution voting
│   │
│   ├── lib/
│   │   ├── hexGrid.ts            # honeycomb-grid setup, hex ↔ pixel math
│   │   ├── mapGenerator.ts       # Generate hex layout for 6 countries
│   │   ├── formulas.ts           # Cycle resolution formulas (shared w/ server)
│   │   ├── validation.ts         # Decision validation (shared w/ server)
│   │   └── scoring.ts            # End-game score calculation
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── GameLayout.tsx    # Main game screen grid layout
│   │   │   ├── Header.tsx        # Timer, cycle count, player info
│   │   │   └── Sidebar.tsx       # Country panel / action tabs
│   │   │
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx   # Google sign-in button
│   │   │
│   │   ├── lobby/
│   │   │   ├── LobbyScreen.tsx   # Create/join room
│   │   │   ├── RoomCard.tsx      # Room code, player list
│   │   │   ├── PlayerSlot.tsx    # Country assignment + ready toggle
│   │   │   └── JoinRequest.tsx   # Host accept/reject incoming players
│   │   │
│   │   ├── map/
│   │   │   ├── HexMap.tsx        # SVG container, pan/zoom
│   │   │   ├── HexTile.tsx       # Single hex polygon + terrain color
│   │   │   ├── CountryOverlay.tsx # Country borders, labels
│   │   │   └── MapLegend.tsx     # Terrain type legend
│   │   │
│   │   ├── dashboard/
│   │   │   ├── ResourcePanel.tsx  # Own country's 6 resources
│   │   │   ├── ComparisonChart.tsx # All 6 countries side-by-side
│   │   │   ├── EmissionsGraph.tsx  # CO2 over cycles (line chart)
│   │   │   ├── TemperatureGauge.tsx # Global temp + thresholds
│   │   │   ├── FactionPanel.tsx    # Faction satisfaction bars
│   │   │   └── HistoricalLedger.tsx # Cumulative emissions share
│   │   │
│   │   ├── actions/
│   │   │   ├── CarbonTaxSlider.tsx  # 0-100 slider
│   │   │   ├── BudgetAllocator.tsx  # Drag/slider budget split
│   │   │   ├── UpgradeSelector.tsx  # Pick upgrade for this cycle
│   │   │   └── SubmitButton.tsx     # Lock in decisions
│   │   │
│   │   ├── diplomacy/
│   │   │   ├── DealProposal.tsx    # Create a deal offer
│   │   │   ├── DealInbox.tsx       # Incoming offers
│   │   │   ├── DealCard.tsx        # Single deal display
│   │   │   ├── TradeHistory.tsx    # Previous trades log
│   │   │   ├── RelationsMatrix.tsx # 6x6 relations grid
│   │   │   └── SanctionsPanel.tsx  # Apply/view sanctions
│   │   │
│   │   ├── summit/
│   │   │   ├── ResolutionCard.tsx  # Current UN resolution
│   │   │   ├── VotePanel.tsx       # Support/oppose/abstain
│   │   │   └── ResolutionHistory.tsx # Past resolutions + compliance
│   │   │
│   │   ├── endgame/
│   │   │   ├── ResultsScreen.tsx   # Final comparison table
│   │   │   ├── ScoreBreakdown.tsx  # Per-country score components
│   │   │   └── TemperatureOutcome.tsx # Final climate result
│   │   │
│   │   └── shared/
│   │       ├── Timer.tsx           # Countdown display
│   │       ├── CountryFlag.tsx     # Country icon/color
│   │       └── ResourceIcon.tsx    # Icons for money/energy/food etc.
│   │
│   └── pages/
│       ├── LoginPage.tsx
│       ├── LobbyPage.tsx
│       ├── GamePage.tsx
│       └── ResultsPage.tsx
│
├── functions/                     # Firebase Cloud Functions (separate package)
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Export all functions
│   │   ├── onCycleResolve.ts     # Main: validate decisions, run formulas, write state
│   │   ├── onRoomCreate.ts       # Initialize country data when game starts
│   │   ├── onJoinRequest.ts      # Handle join request notifications
│   │   ├── onDealSubmit.ts       # Validate deal terms
│   │   ├── enqueueCycle.ts       # Enqueue next cycle timer via Cloud Tasks
│   │   ├── shared/
│   │   │   ├── formulas.ts       # SAME formulas as client (symlinked or shared pkg)
│   │   │   ├── validation.ts     # SAME validation as client
│   │   │   └── countries.ts      # SAME starting data as client
│   │   └── utils/
│   │       └── dbRefs.ts         # Typed database references
│   │
│   └── .env                      # Function-specific config
│
└── shared/                        # Shared code between client & functions
    ├── package.json               # Local package, both client & functions reference
    ├── types.ts                   # Game types used by both
    ├── formulas.ts                # Cycle resolution math
    ├── validation.ts              # Decision validation rules
    ├── countries.ts               # Starting stats
    └── constants.ts               # Shared constants
```

### Why the `shared/` folder?

The cycle resolution formulas and validation MUST be identical on client and server. The client uses them for previewing consequences ("if I set carbon tax to 60, my emissions drop by X"). The server uses them as the source of truth. A shared local package avoids drift.

---

## 2. Firebase Realtime Database Schema

```
root/
│
├── rooms/
│   └── {roomId}/                          # nanoid, 6 chars
│       │
│       ├── meta/
│       │   ├── status: "lobby" | "playing" | "paused" | "finished"
│       │   ├── hostUid: string            # Google Auth UID
│       │   ├── currentCycle: number       # 1-based
│       │   ├── maxCycles: 7
│       │   ├── cycleDurationMs: 300000    # 5 min
│       │   ├── cycleStartedAt: ServerTimestamp
│       │   ├── cycleDeadline: number      # startedAt + duration (computed)
│       │   ├── createdAt: ServerTimestamp
│       │   └── activeResolutionId: string | null
│       │
│       ├── joinRequests/
│       │   └── {uid}/
│       │       ├── displayName: string
│       │       ├── photoURL: string
│       │       ├── requestedAt: ServerTimestamp
│       │       └── status: "pending" | "accepted" | "rejected"
│       │
│       ├── players/
│       │   └── {uid}/
│       │       ├── displayName: string
│       │       ├── photoURL: string
│       │       ├── countryId: string | null    # assigned country
│       │       ├── ready: boolean
│       │       └── connected: boolean          # presence system
│       │
│       ├── countries/
│       │   └── {countryId}/                    # "usa", "eu", "russia", "china", "india", "opec"
│       │       │
│       │       ├── resources/
│       │       │   ├── money: number
│       │       │   ├── energy: number
│       │       │   ├── food: number
│       │       │   ├── technology: number      # level 1-5
│       │       │   ├── co2: number             # current annual emissions
│       │       │   └── rawResources: number    # rare earth, uranium, gas (combined)
│       │       │
│       │       ├── derived/
│       │       │   ├── population: number
│       │       │   ├── happiness: number       # 0-100
│       │       │   ├── health: number          # 0-100
│       │       │   ├── gdpPerCapita: number
│       │       │   ├── emissionsPerCapita: number
│       │       │   ├── energyMix/
│       │       │   │   ├── fossil: number      # percentage
│       │       │   │   └── renewable: number
│       │       │   └── approval: number        # weighted faction satisfaction
│       │       │
│       │       ├── policy/
│       │       │   ├── carbonTax: number       # 0-100
│       │       │   └── budget/
│       │       │       ├── economy: number     # percentage, all sum to 100
│       │       │       ├── greenTransition: number
│       │       │       ├── social: number
│       │       │       ├── research: number
│       │       │       └── diplomacy: number
│       │       │
│       │       ├── factions/
│       │       │   └── {factionId}/
│       │       │       ├── name: string
│       │       │       ├── weight: number      # percentage of population
│       │       │       ├── satisfaction: number # 0-100
│       │       │       ├── prefCarbonTax: number
│       │       │       └── prefBudget: string  # preferred budget category
│       │       │
│       │       ├── upgrades/
│       │       │   └── {slotIndex}/            # 0 to maxSlots-1
│       │       │       ├── type: string | null  # upgrade type or empty
│       │       │       └── builtCycle: number
│       │       │
│       │       ├── maxSlots: number            # based on land area
│       │       ├── historicalEmissions: number  # cumulative
│       │       └── historicalEmissionsShare: number # percentage of global
│       │
│       ├── cycles/
│       │   └── {cycleNum}/
│       │       ├── decisions/
│       │       │   └── {countryId}/
│       │       │       ├── carbonTax: number
│       │       │       ├── budget: { economy, greenTransition, social, research, diplomacy }
│       │       │       ├── upgrade: string | null
│       │       │       ├── submittedAt: ServerTimestamp
│       │       │       └── locked: boolean
│       │       │
│       │       ├── summary/
│       │       │   ├── resolvedAt: ServerTimestamp
│       │       │   ├── globalTempDelta: number
│       │       │   ├── totalEmissions: number
│       │       │   └── events: string[]        # triggered events
│       │       │
│       │       └── resolutionVotes/
│       │           └── {countryId}: "support" | "oppose" | "abstain"
│       │
│       ├── deals/
│       │   └── {dealId}/
│       │       ├── fromCountry: string
│       │       ├── toCountry: string
│       │       ├── offer: { resource: string, amount: number }
│       │       ├── request: { resource: string, amount: number }
│       │       ├── status: "proposed" | "accepted" | "rejected" | "expired"
│       │       ├── cycle: number
│       │       ├── proposedAt: ServerTimestamp
│       │       └── resolvedAt: ServerTimestamp | null
│       │
│       ├── sanctions/
│       │   └── {sanctionId}/
│       │       ├── imposedBy: string[]         # country IDs
│       │       ├── target: string              # country ID
│       │       ├── type: "trade" | "tech" | "finance"
│       │       ├── reason: string
│       │       ├── cycle: number
│       │       └── active: boolean
│       │
│       ├── resolutions/
│       │   └── {resolutionId}/
│       │       ├── type: "carbonFloor" | "climateFinance" | "techSharing" | "coalPhaseout"
│       │       ├── description: string
│       │       ├── cycle: number
│       │       ├── passed: boolean
│       │       ├── votes: { [countryId]: "support" | "oppose" | "abstain" }
│       │       └── binding: { ... }            # specific terms if passed
│       │
│       ├── global/
│       │   ├── temperature: number             # starts at 1.0 (°C above pre-industrial)
│       │   ├── cumulativeEmissions: number
│       │   ├── temperatureHistory: number[]    # per-cycle temps
│       │   └── currentThreshold: "+1.5" | "+2.0" | "+2.5" | "+3.0" | null
│       │
│       └── relations/
│           └── {pairKey}/                      # "usa_china", "eu_russia", etc.
│               ├── score: number               # -100 to +100
│               └── history: [{ cycle, delta, reason }]
```

### Security Rules (Simplified)

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        "meta": {
          ".write": "auth != null && data.child('hostUid').val() === auth.uid"
        },
        "joinRequests": {
          "$uid": {
            ".write": "auth.uid === $uid || data.parent().parent().child('meta/hostUid').val() === auth.uid"
          }
        },
        "players": {
          "$uid": {
            ".write": "auth.uid === $uid || data.parent().parent().child('meta/hostUid').val() === auth.uid"
          }
        },
        "cycles": {
          "$cycle": {
            "decisions": {
              "$countryId": {
                ".write": "PLAYER_OWNS_COUNTRY && CYCLE_NOT_LOCKED"
              }
            }
          }
        },
        "countries": {
          ".write": false
        },
        "global": {
          ".write": false
        }
      }
    }
  }
}
```

Key principle: **players can only write decisions and deals. Countries, global state, and resolution outcomes are write-protected — only Cloud Functions can update them.**

---

## 3. Hex Map: 6 Countries Scaled

Using equirectangular projection, ~60 wide x 30 tall hex grid.

| Country | Real Area (M km²) | Hex Count | Land Slots | Map Position |
|---|---|---|---|---|
| USA | 9.8 | ~80 | 12 | Left (Americas) |
| EU | 4.2 | ~35 | 6 | Center-left (W. Europe) |
| Russia | 17.1 | ~130 | 15 | Top-center to right (Eurasia) |
| China | 9.6 | ~75 | 11 | Center-right (E. Asia) |
| India | 3.3 | ~25 | 4 | Center (S. Asia) |
| OPEC+ | 7.5* | ~60 | 9 | Center (Middle East + Venezuela) |
| Ocean/Neutral | — | ~195 | — | Remainder |

*OPEC+ without Russia = Saudi + UAE + Iran + Iraq + Venezuela + others

**Total hexes: ~600** (still fine for SVG rendering)

### Terrain Types

```typescript
type TerrainType =
  | "land"           // generic buildable
  | "coastal"        // port-capable, sea-level-rise vulnerable
  | "desert"         // high solar, low agriculture
  | "mountain"       // minerals, wind, not buildable
  | "forest"         // carbon sink, deforestable
  | "agricultural"   // food production, drought-vulnerable
  | "ocean"          // trade routes
  | "arctic"         // opens at +2.5°C
```

### Hex Data Shape

```typescript
interface HexTile {
  q: number;              // cube coordinate
  r: number;              // cube coordinate
  s: number;              // cube coordinate (q + r + s = 0)
  terrain: TerrainType;
  countryId: string | null;  // null = ocean/neutral
  resource: ResourceDeposit | null;  // oil, coal, rareEarth, uranium, solar, wind, arable
  upgrade: UpgradeType | null;
}
```

The hex map is **static** — it doesn't change during the game (no hex-level building). It's a visual reference showing each country's territory, terrain, and resource distribution. Upgrades happen at the country level (slots), not per-hex.

---

## 4. TypeScript Types (Key Interfaces)

```typescript
// ---- Countries ----

type CountryId = "usa" | "eu" | "russia" | "china" | "india" | "opec";

interface CountryState {
  id: CountryId;
  resources: {
    money: number;
    energy: number;
    food: number;
    technology: number;       // 1-5
    co2: number;              // annual emissions
    rawResources: number;     // combined rare earth / uranium / gas
  };
  derived: {
    population: number;
    happiness: number;
    health: number;
    approval: number;
    gdpPerCapita: number;
    emissionsPerCapita: number;
    energyMix: { fossil: number; renewable: number };
  };
  policy: {
    carbonTax: number;
    budget: BudgetAllocation;
  };
  factions: Faction[];
  upgrades: (UpgradeType | null)[];  // length = maxSlots
  maxSlots: number;
  historicalEmissions: number;
  historicalEmissionsShare: number;
}

// ---- Budget ----

interface BudgetAllocation {
  economy: number;         // percentages, must sum to 100
  greenTransition: number;
  social: number;
  research: number;
  diplomacy: number;
}

// ---- Factions ----

interface Faction {
  id: string;
  name: string;
  weight: number;           // % of population
  satisfaction: number;     // 0-100
  prefCarbonTax: number;    // ideal carbon tax level
  prefBudget: keyof BudgetAllocation;  // preferred spending area
}

// ---- Decisions (what player submits each cycle) ----

interface PlayerDecision {
  countryId: CountryId;
  carbonTax: number;
  budget: BudgetAllocation;
  upgrade: UpgradeType | null;
  submittedAt: number;
}

// ---- Upgrades ----

type UpgradeType =
  | "fossil_power"        // energy++, co2++
  | "renewable_power"     // energy+, co2=0
  | "industry"            // money++, co2+
  | "farm"                // food++
  | "social_program"      // happiness+, approval+
  | "research_center"     // technology+1 after 2 cycles
  | "carbon_capture"      // co2-- (requires tech >= 3)
  | "green_industry"      // money+, co2=0 (requires tech >= 2)

// ---- Deals ----

interface Deal {
  id: string;
  fromCountry: CountryId;
  toCountry: CountryId;
  offer: { resource: keyof CountryState["resources"]; amount: number };
  request: { resource: keyof CountryState["resources"]; amount: number };
  status: "proposed" | "accepted" | "rejected" | "expired";
  cycle: number;
}

// ---- UN Resolutions ----

type ResolutionType = "carbonFloor" | "climateFinance" | "techSharing" | "coalPhaseout";

interface Resolution {
  id: string;
  type: ResolutionType;
  description: string;
  cycle: number;
  passed: boolean;
  votes: Record<CountryId, "support" | "oppose" | "abstain">;
  binding?: {
    targetValue?: number;
    affectedCountries?: CountryId[];
    penalty?: string;
  };
}

// ---- Sanctions ----

interface Sanction {
  id: string;
  imposedBy: CountryId[];
  target: CountryId;
  type: "trade" | "tech" | "finance";
  reason: string;
  cycle: number;
  active: boolean;
}

// ---- Game Room ----

interface RoomMeta {
  status: "lobby" | "playing" | "paused" | "finished";
  hostUid: string;
  currentCycle: number;
  maxCycles: number;
  cycleDurationMs: number;
  cycleStartedAt: number;
  cycleDeadline: number;
  activeResolutionId: string | null;
}

interface GlobalState {
  temperature: number;
  cumulativeEmissions: number;
  temperatureHistory: number[];
  currentThreshold: string | null;
}

// ---- Relations ----

interface Relation {
  pairKey: string;          // "usa_china"
  score: number;            // -100 to +100
  history: { cycle: number; delta: number; reason: string }[];
}
```

---

## 5. Cloud Functions

```
functions/src/
├── index.ts                    # Exports all functions
│
├── enqueueCycle.ts             # Called when host starts game or cycle ends
│   - Creates Cloud Task with scheduleDelaySeconds = cycleDurationMs / 1000
│   - Task payload: { roomId, cycleNum }
│
├── onCycleResolve.ts           # THE BIG ONE — triggered by Cloud Task
│   1. Read all decisions from /cycles/{n}/decisions/
│   2. Read current country states from /countries/
│   3. Validate each decision:
│      - Budget sums to 100?
│      - Player has money for chosen upgrade?
│      - Upgrade slot available?
│      - Carbon tax in valid range?
│   4. Apply accepted deals (move resources between countries)
│   5. Run formulas (shared/formulas.ts):
│      - Update money, energy, food, co2 per country
│      - Update derived indicators (happiness, health, population)
│      - Update faction satisfaction based on policy vs. preferences
│      - Update global temperature
│      - Check temperature thresholds → apply penalties
│   6. Check sanctions compliance
│   7. Check resolution compliance
│   8. Write updated state to /countries/*, /global/*
│   9. Write cycle summary to /cycles/{n}/summary/
│   10. If not last cycle → enqueueCycle for next cycle
│   11. If last cycle → set status = "finished", compute final scores
│
├── onRoomCreate.ts             # Callable function
│   - Host calls this to initialize game
│   - Writes starting stats for all 6 countries to /countries/
│   - Sets meta.status = "playing"
│   - Calls enqueueCycle for cycle 1
│
├── onJoinRequest.ts            # DB trigger on /joinRequests/{uid}
│   - Notifies host (optional push notification or just DB flag)
│   - When host writes status = "accepted", copies player to /players/
│
├── onDealSubmit.ts             # DB trigger on /deals/{dealId}
│   - Validates: does fromCountry have enough of offered resource?
│   - Validates: are countries under sanctions blocking this trade?
│   - If invalid, sets deal.status = "rejected" with reason
│
├── onDealAccept.ts             # DB trigger when deal status → "accepted"
│   - Executes resource transfer between countries
│   - Updates relations score
│
└── shared/                     # Symlinked from /shared/
    ├── formulas.ts
    ├── validation.ts
    ├── countries.ts
    └── constants.ts
```

---

## 6. Zustand Stores

```typescript
// authStore.ts
interface AuthStore {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// gameStore.ts — synced from Firebase via onValue listeners
interface GameStore {
  roomId: string | null;
  meta: RoomMeta | null;
  players: Record<string, PlayerInfo>;
  countries: Record<CountryId, CountryState>;
  global: GlobalState | null;
  deals: Deal[];
  sanctions: Sanction[];
  resolutions: Resolution[];
  relations: Relation[];
  cycleHistory: CycleSummary[];

  // Listener management
  subscribeToRoom: (roomId: string) => void;
  unsubscribeFromRoom: () => void;
}

// decisionStore.ts — local, not synced until submit
interface DecisionStore {
  carbonTax: number;
  budget: BudgetAllocation;
  selectedUpgrade: UpgradeType | null;
  isDirty: boolean;
  submitted: boolean;

  setCarbonTax: (v: number) => void;
  setBudget: (b: BudgetAllocation) => void;
  setUpgrade: (u: UpgradeType | null) => void;
  submit: (roomId: string, cycleNum: number, countryId: CountryId) => Promise<void>;
  reset: () => void;
}

// uiStore.ts
interface UIStore {
  activePanel: "dashboard" | "actions" | "diplomacy" | "summit" | "map";
  selectedCountry: CountryId | null;   // for comparison view
  dealModalOpen: boolean;
  // etc.
}
```

---

## 7. Route Structure

```
/                   → LoginPage (Google sign-in)
/lobby              → LobbyPage (create room / enter room code)
/room/:roomId       → LobbyPage with room (player list, country pick, ready up)
/game/:roomId       → GamePage (hex map + dashboard + actions + diplomacy)
/results/:roomId    → ResultsPage (final scores, comparison, temperature graph)
```

---

## 8. Game Flow Sequence

```
1. AUTH
   User opens app → LoginPage → Google sign-in → redirect to /lobby

2. LOBBY
   Host: clicks "Create Room" → Cloud Function creates room → gets room code
   Others: enter room code → write to /joinRequests/{uid}
   Host: sees join requests → accepts/rejects
   Accepted players: pick a country (or auto-assign)
   All players: toggle "ready"
   Host: sees all ready → clicks "Start Game"

3. START
   Host clicks start → calls onRoomCreate Cloud Function
   Function: writes starting country stats, sets status = "playing"
   Function: calls enqueueCycle(roomId, cycle=1)
   Cloud Task: scheduled to fire in 5 minutes
   All clients: onValue fires, UI switches to GamePage

4. CYCLE (repeats 7 times)
   ┌─ 5 MINUTE WINDOW ─────────────────────────────────┐
   │                                                     │
   │  Players see: hex map, dashboard, timer counting    │
   │                                                     │
   │  Players can:                                       │
   │    - Adjust carbon tax slider                       │
   │    - Set budget allocation                          │
   │    - Pick an upgrade                                │
   │    - Propose / accept / reject deals                │
   │    - Vote on UN resolution (if active)              │
   │    - Apply sanctions                                │
   │    - View comparison charts, trade history,          │
   │      game-theory suggestions                        │
   │                                                     │
   │  Player clicks "Submit" → writes to                 │
   │    /cycles/{n}/decisions/{countryId}                 │
   │  Can revise until timer expires                     │
   │                                                     │
   └─────────────────────────────────────────────────────┘
                         │
                    Timer expires
                         │
                    Cloud Task fires
                         │
              onCycleResolve function runs
                         │
              ┌──────────┴──────────┐
              │  Validate decisions  │
              │  Apply deals         │
              │  Run formulas        │
              │  Update state        │
              │  Check thresholds    │
              │  Write to DB         │
              └──────────┬──────────┘
                         │
              All clients receive update
              via onValue listeners
                         │
              If cycle < 7: enqueueCycle(next)
              If cycle = 7: status = "finished"

5. END GAME
   status = "finished" → clients redirect to /results/:roomId
   ResultsPage shows:
     - Final country comparison table
     - Temperature graph over all cycles
     - Score breakdown per country
     - Winner declaration
     - "Play again" button
```

---

## 9. Starting Country Stats (6 Countries)

```typescript
const STARTING_STATS: Record<CountryId, CountryStarting> = {
  usa: {
    money: 250, energy: 90, food: 85, technology: 4, co2: 50, rawResources: 70,
    population: 330, maxSlots: 12,
    historicalEmissionsShare: 0.25,
    factions: [
      { name: "Green/Tech", weight: 25, satisfaction: 55, prefCarbonTax: 70, prefBudget: "greenTransition" },
      { name: "Industry/Fossil", weight: 40, satisfaction: 70, prefCarbonTax: 15, prefBudget: "economy" },
      { name: "Populist Consumers", weight: 35, satisfaction: 60, prefCarbonTax: 20, prefBudget: "social" },
    ]
  },
  eu: {
    money: 180, energy: 60, food: 65, technology: 4, co2: 30, rawResources: 20,
    population: 450, maxSlots: 6,
    historicalEmissionsShare: 0.22,
    factions: [
      { name: "Green Parties", weight: 35, satisfaction: 65, prefCarbonTax: 80, prefBudget: "greenTransition" },
      { name: "Industrial Competitiveness", weight: 30, satisfaction: 60, prefCarbonTax: 40, prefBudget: "economy" },
      { name: "Social Welfare", weight: 35, satisfaction: 60, prefCarbonTax: 50, prefBudget: "social" },
    ]
  },
  russia: {
    money: 120, energy: 95, food: 55, technology: 3, co2: 45, rawResources: 90,
    population: 145, maxSlots: 15,
    historicalEmissionsShare: 0.07,
    factions: [
      { name: "Energy Oligarchs", weight: 40, satisfaction: 75, prefCarbonTax: 5, prefBudget: "economy" },
      { name: "Modernizers", weight: 25, satisfaction: 45, prefCarbonTax: 35, prefBudget: "research" },
      { name: "Security/Stability", weight: 35, satisfaction: 65, prefCarbonTax: 10, prefBudget: "diplomacy" },
    ]
  },
  china: {
    money: 180, energy: 85, food: 70, technology: 3, co2: 55, rawResources: 80,
    population: 1400, maxSlots: 11,
    historicalEmissionsShare: 0.13,
    factions: [
      { name: "Technocrats", weight: 30, satisfaction: 70, prefCarbonTax: 40, prefBudget: "research" },
      { name: "Growth/Industry", weight: 40, satisfaction: 75, prefCarbonTax: 15, prefBudget: "economy" },
      { name: "Stability/Security", weight: 30, satisfaction: 65, prefCarbonTax: 20, prefBudget: "social" },
    ]
  },
  india: {
    money: 35, energy: 40, food: 50, technology: 2, co2: 20, rawResources: 30,
    population: 1400, maxSlots: 4,
    historicalEmissionsShare: 0.03,
    factions: [
      { name: "Development Coalition", weight: 40, satisfaction: 55, prefCarbonTax: 10, prefBudget: "economy" },
      { name: "Climate Justice", weight: 20, satisfaction: 50, prefCarbonTax: 60, prefBudget: "greenTransition" },
      { name: "Agricultural/Rural", weight: 40, satisfaction: 50, prefCarbonTax: 15, prefBudget: "social" },
    ]
  },
  opec: {
    money: 100, energy: 99, food: 30, technology: 2, co2: 40, rawResources: 95,
    population: 250, maxSlots: 9,
    historicalEmissionsShare: 0.12,
    factions: [
      { name: "Fossil Establishment", weight: 45, satisfaction: 80, prefCarbonTax: 0, prefBudget: "economy" },
      { name: "Diversification Modernizers", weight: 20, satisfaction: 40, prefCarbonTax: 25, prefBudget: "research" },
      { name: "Stability/Security", weight: 35, satisfaction: 65, prefCarbonTax: 5, prefBudget: "social" },
    ]
  },
};
```

---

## 10. Game Screen Layout (Wireframe)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: [Cycle 3/7] [⏱ 3:42] [Room: ABC123] [🌡 +1.3°C]  [👤] │
├──────────────────────────────────┬──────────────────────────────┤
│                                  │                              │
│         HEX MAP                  │     RIGHT PANEL              │
│    (SVG, pan/zoom)               │     (tabbed)                 │
│                                  │                              │
│    Shows 6 countries             │  [Dashboard] [Actions]       │
│    terrain colors                │  [Diplomacy] [Summit]        │
│    country borders               │                              │
│    resource icons                │  Dashboard tab:              │
│                                  │    - Your 6 resources        │
│                                  │    - Derived indicators      │
│                                  │    - Faction satisfaction     │
│                                  │    - Comparison charts        │
│                                  │                              │
│                                  │  Actions tab:                │
│                                  │    - Carbon tax slider       │
│                                  │    - Budget allocator        │
│                                  │    - Upgrade selector        │
│                                  │    - [Submit] button         │
│                                  │                              │
│                                  │  Diplomacy tab:              │
│                                  │    - Propose deal            │
│                                  │    - Deal inbox              │
│                                  │    - Trade history           │
│                                  │    - Relations matrix        │
│                                  │    - Sanctions panel         │
│                                  │                              │
│                                  │  Summit tab:                 │
│                                  │    - Active resolution       │
│                                  │    - Vote buttons            │
│                                  │    - Past resolutions        │
│                                  │                              │
├──────────────────────────────────┴──────────────────────────────┤
│  BOTTOM BAR: [📊 Emissions Graph] [🌍 Temperature] [📜 History] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Key Dependencies (package.json)

### Client (`/package.json`)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.0.0",
    "firebase": "^11.0.0",
    "zustand": "^5.0.0",
    "immer": "^10.0.0",
    "honeycomb-grid": "^4.1.5",
    "recharts": "^2.12.0",
    "nanoid": "^5.0.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.400.0",
    "tailwind-merge": "^2.0.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
```

### Cloud Functions (`/functions/package.json`)

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.0.0",
    "@google-cloud/tasks": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "firebase-functions-test": "^3.0.0"
  }
}
```

---

## 12. What This Skeleton Does NOT Include (Intentionally)

- Actual hex map data (needs a map generator script — separate task)
- Formula implementations (needs balancing — separate task)
- Responsive mobile layout (desktop-first for classroom use)
- Sound effects, animations, polish
- Bot AI for empty country slots
- Event card system (post-MVP)
- Chat/messaging between players (use Discord/voice alongside)
