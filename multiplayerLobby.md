# Multiplayer Lobby & Game Flow

Firebase Realtime Database. 1–8 human players. Remaining countries filled by bots. Random country assignment. Host controls initial settings via presets + overrides.

---

## Landing Page

### Layout

Full-viewport page with a background image/gradient (dark world map or stylized hex grid, blurred). Centered card with game title and two primary actions.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌───────────────────────────┐              │
│              │                           │              │
│              │    🌍 CLIMATE DIPLOMACY   │              │
│              │    Environmental Politics  │              │
│              │    Simulation Game         │              │
│              │                           │              │
│              │   ┌─────────────────────┐ │              │
│              │   │  Display Name: ___  │ │              │
│              │   └─────────────────────┘ │              │
│              │                           │              │
│              │   ┌─────────┐ ┌────────┐ │              │
│              │   │  HOST   │ │  JOIN  │ │              │
│              │   │  GAME   │ │  GAME  │ │              │
│              │   └─────────┘ └────────┘ │              │
│              │                           │              │
│              │   ── Active Games ──      │              │
│              │   user123's game  (3/8)   │              │
│              │   rajgm's game    (5/8)   │              │
│              │   player7's game  (2/8)   │              │
│              │                           │              │
│              └───────────────────────────┘              │
│                                                         │
│                                          ┌────┐         │
│                                          │ 🔊 │         │
│                                          └────┘         │
└─────────────────────────────────────────────────────────┘
```

### Elements

1. **Game Title** — "CLIMATE DIPLOMACY" with subtitle "Environmental Politics Simulation Game". Large, centered.

2. **Display Name Input** — Text field. Required before host/join. Persisted in `localStorage`. This is the name shown in lobbies and in-game, NOT a login system.

3. **Host Game Button** — Opens host settings modal, then creates room.

4. **Join Game Button** — Opens join modal with room ID input field.

5. **Active Games List** — Live list from Firebase. Shows:
   - Host's display name (not room ID — user requested "by userID not roomID")
   - Player count (e.g., "3/8")
   - Game status: "Waiting" / "In Progress"
   - Click to join (if status = Waiting and not full)
   - Games "In Progress" are visible but greyed out / not joinable

6. **Audio Toggle** — Bottom-right corner. Speaker icon. Toggles background music on/off. Remembers preference in `localStorage`.

---

## Host Game Flow

### Step 1: Host Settings Modal

When "HOST GAME" is clicked, a modal opens with game configuration.

```
┌─────────────────────────────────────────┐
│           GAME SETTINGS                 │
│                                         │
│  Preset:  [Easy ▼]  [Normal]  [Hard]    │
│                                         │
│  ── Starting Resources ──               │
│  Money multiplier     [1.0x ────●── 2x] │
│  Energy multiplier    [1.0x ──●──── 2x] │
│  Food multiplier      [1.0x ────●── 2x] │
│  Tech multiplier      [1.0x ──●──── 2x] │
│                                         │
│  ── World Settings ──                   │
│  Starting temperature [0.8 ──●──── 1.5] │
│  Cycle timer (min)    [3  ──●────── 10] │
│  Max players          [2  ────●──── 8 ] │
│                                         │
│  ── Starting Infrastructure ──          │
│  [✓] Give each country 1 Fossil Plant   │
│  [✓] Give each country 1 Farm           │
│  [✓] Give each country 1 Extractor      │
│  [ ] Give each country 1 Transport Hub  │
│  [ ] Give each country 1 Manufacturing  │
│                                         │
│  ── Rules ──                            │
│  [✓] Enable carbon tax                  │
│  [✓] Enable summit resolutions          │
│  [✓] Enable factions                    │
│  [ ] Peaceful mode (no transit disrupt) │
│                                         │
│         [ Cancel ]  [ CREATE GAME ]     │
└─────────────────────────────────────────┘
```

### Presets

| Setting | Easy | Normal | Hard |
|---------|------|--------|------|
| Money multiplier | 1.5x | 1.0x | 0.75x |
| Energy multiplier | 1.5x | 1.0x | 0.75x |
| Food multiplier | 1.5x | 1.0x | 0.75x |
| Tech multiplier | 1.5x | 1.0x | 0.75x |
| Starting temperature | 0.8°C | 1.0°C | 1.2°C |
| Cycle timer | 7 min | 5 min | 3 min |
| Starting infra | Fossil + Farm + Extractor + Hub | Fossil + Farm + Extractor | Fossil + Farm |
| Carbon tax | ON | ON | ON |
| Summit resolutions | ON | ON | ON |
| Factions | OFF | ON | ON |
| Peaceful mode | ON | OFF | OFF |

Selecting a preset fills all values. Player can then override any individual slider/toggle. Once any value is manually changed, preset label shows "(Custom)".

### Step 2: Room Created

After "CREATE GAME":
1. Generate unique room ID (6 chars, uppercase alphanumeric, e.g., `K7X2MF`)
2. Write room to Firebase at `rooms/{roomId}`
3. Host auto-joins as first player
4. Navigate to **Lobby Screen**

---

## Join Game Flow

### Option A: Enter Room ID

Click "JOIN GAME" → modal with text input for 6-char room ID → validate exists + status = "waiting" + not full → join.

```
┌─────────────────────────────────┐
│         JOIN GAME               │
│                                 │
│  Room ID:  [______]             │
│                                 │
│  [ Cancel ]  [ JOIN ]           │
└─────────────────────────────────┘
```

### Option B: Click Active Game

Click any "Waiting" game in the active games list → join directly (no room ID needed).

### Join Validation

| Check | Fail message |
|-------|-------------|
| Room exists | "Room not found. Check the code and try again." |
| Status = waiting | "This game is already in progress." |
| Players < maxPlayers | "This game is full." |
| Display name set | "Please enter a display name first." |

---

## Lobby Screen

After host creates or player joins. All players see the same lobby in real time.

```
┌─────────────────────────────────────────────────────────┐
│  LOBBY — Room: K7X2MF                    [Copy ID] 📋  │
│                                                         │
│  Host: rajgm                                            │
│  Settings: Normal preset, 5 min cycles, 8 max           │
│                                                         │
│  ── Players (3/8) ──                                    │
│                                                         │
│  1. rajgm (Host)         ● Ready                        │
│  2. alice                ● Ready                        │
│  3. bob                  ○ Not Ready                    │
│  4. (waiting...)                                        │
│  5. (waiting...)                                        │
│  ...                                                    │
│                                                         │
│  Remaining countries filled by bots.                    │
│  Countries assigned randomly when game starts.          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ [Ready / Not Ready]     [Leave Lobby]            │   │
│  │                                                  │   │
│  │ (Host only:)  [ START GAME ]  (needs 1+ ready)   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│                                          ┌────┐         │
│                                          │ 🔊 │         │
│                                          └────┘         │
└─────────────────────────────────────────────────────────┘
```

### Lobby Mechanics

- **Copy ID button** — copies room ID to clipboard for sharing
- **Ready toggle** — each player toggles ready/not ready
- **Start Game** (host only) — enabled when at least 1 player (besides host) is ready, OR host is solo (1 player)
- **Leave Lobby** — removes player from room. If host leaves, oldest remaining player becomes host. If last player leaves, room is destroyed.
- **Player list** — live-updating via Firebase listener
- **Country assignment** — happens at game start, not in lobby. Random shuffle of 8 countries, dealt in join order. Remaining go to bots.

### Starting the Game

When host clicks "START GAME":

1. Randomly assign countries to human players (shuffle array, deal in order)
2. Generate initial game state using host settings (presets + overrides)
3. Apply starting infrastructure per settings
4. Set `rooms/{roomId}/status` to `"active"`
5. All clients listening on status → navigate to game screen
6. Begin cycle 1

---

## Firebase Data Model

### `rooms/{roomId}`

```typescript
interface Room {
  roomId: string;              // "K7X2MF"
  hostId: string;              // unique browser ID (generated on first visit, stored in localStorage)
  hostName: string;            // display name
  status: "waiting" | "active" | "ending" | "archived";
  createdAt: number;           // timestamp
  lastActivity: number;        // updated every cycle and on player actions
  
  settings: {
    preset: "easy" | "normal" | "hard" | "custom";
    moneyMultiplier: number;   // 0.5–2.0
    energyMultiplier: number;
    foodMultiplier: number;
    techMultiplier: number;
    startingTemperature: number;
    cycleTimerMinutes: number;  // 3–10
    maxPlayers: number;         // 2–8
    startingInfra: {
      fossilPlant: boolean;
      farm: boolean;
      extractor: boolean;
      transportHub: boolean;
      manufacturing: boolean;
    };
    rules: {
      carbonTax: boolean;
      summitResolutions: boolean;
      factions: boolean;
      peacefulMode: boolean;
    };
  };
  
  players: {
    [odPlayerId: string]: {
      name: string;
      joinedAt: number;
      ready: boolean;
      connected: boolean;       // presence system
      assignedCountry?: string; // set at game start
    };
  };
}
```

### `games/{roomId}`

Created when game starts. Holds the full `GameState`. Only host writes cycle results. All clients read.

```typescript
interface GameData {
  roomId: string;
  cycle: number;
  gameState: GameState;         // full game state object (countries, resources, buildings, etc.)
  cycleTimer: {
    startedAt: number;          // server timestamp
    durationMs: number;         // from settings
  };
  pendingActions: {
    [playerId: string]: PlayerAction[];  // queued actions for current cycle
  };
  summit?: {
    active: boolean;
    resolution: SummitResolution;
    votes: Record<string, "YES" | "NO" | "ABSTAIN" | null>;
    timerStartedAt: number;
  };
  trades: {
    proposals: TradeProposal[];
    active: ActiveTrade[];
  };
}
```

### `archive/{roomId}`

Moved here when game ends. Same structure as `games/{roomId}` plus:

```typescript
interface ArchivedGame {
  ...GameData;
  archivedAt: number;
  endReason: "host_ended" | "vote_ended" | "all_left" | "timeout";
  finalCycle: number;
  playerResults: {
    [playerId: string]: {
      country: string;
      finalMoney: number;
      finalHappiness: number;
      finalPopulation: number;
      totalCo2: number;
    };
  };
}
```

### `activeRooms/` (index for landing page)

Lightweight index for the active games list. Avoids reading full room data.

```typescript
// activeRooms/{roomId}
interface ActiveRoomIndex {
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: "waiting" | "active";
  preset: string;
  createdAt: number;
}
```

Updated whenever players join/leave or status changes. Deleted when archived.

---

## Player Identity

No auth system. Each browser generates a unique `playerId` on first visit (UUID v4), stored in `localStorage`. Display name is separate — editable, not unique.

```typescript
// On app load:
let playerId = localStorage.getItem('climateDiplomacy_playerId');
if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem('climateDiplomacy_playerId', playerId);
}
```

This means:
- Same browser = same player (can rejoin if disconnected)
- Different browser/device = different player (no cross-device identity)
- No passwords, no accounts, no email — appropriate for academic demo

---

## Room ID Generation

6-character uppercase alphanumeric. Collision-checked against existing rooms.

```typescript
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 confusion
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Before creating: check Firebase that rooms/{id} doesn't exist
// If collision, regenerate (astronomically unlikely with 30^6 = 729M combinations)
```

---

## In-Game UI — Top Bar

Once inside the game, the top bar has end/exit controls:

```
┌─────────────────────────────────────────────────────────┐
│  Cycle 7 / 5:00 ▶  │  USA (rajgm)  │   [End Game] [Exit] │
└─────────────────────────────────────────────────────────┘
```

### Exit Button

Leaves the game immediately. Bot takes over the player's country. Player returns to landing page. Can rejoin the same room (same `playerId`) if game is still active — bot hands back control.

No confirmation needed — exiting is non-destructive (bot continues).

### End Game Button

Triggers the **End Game Vote** system (see below).

---

## End Game System

### Host Ending

The host has a special privilege: **"End Game (Host)"** button that immediately ends the game for everyone. No vote needed. This is a hard stop — useful for class demos with time limits.

On host end:
1. Set `rooms/{roomId}/status` to `"ending"`
2. All clients show "Host ended the game" modal with final stats
3. After 30 seconds viewing stats, redirect to landing page
4. Game moves to archive

### Player Vote to End

Any human player (including host) can call a vote to end the game.

#### Vote Flow

1. **Player clicks "End Game"** → confirmation: "Call a vote to end the game?"
2. **Vote popup appears for ALL human players** (not bots):

```
┌───────────────────────────────────┐
│     VOTE: END THE GAME?          │
│                                   │
│  Called by: alice (EU)            │
│                                   │
│  "Shall we end the game now?"     │
│                                   │
│     [ YES ]     [ NO ]           │
│                                   │
│  Votes: 1/3 YES, 0/3 NO          │
│  Time remaining: 45s              │
└───────────────────────────────────┘
```

3. **The caller automatically votes YES**
4. **Other human players have 60 seconds to vote**
5. **Result**: majority of human players = pass. Ties = fail.

| Players | Needed to pass |
|---------|---------------|
| 1 | 1 (auto-pass, same as host end) |
| 2 | 2 (both must agree) |
| 3 | 2 |
| 4 | 3 |
| 5 | 3 |
| 6 | 4 |
| 7 | 4 |
| 8 | 5 |

6. **If passed**: same flow as host end (ending state → stats → archive)
7. **If failed**: game continues. Caller sees "Vote failed."

#### Cooldown

- **The player who called the vote** has a **7-minute cooldown** before they can call another vote.
- They can still **vote on other players'** end-game calls during their cooldown.
- Other players have no cooldown from someone else's call.
- Cooldown is per-player, tracked in client state (not Firebase — no need to persist).

```typescript
interface VoteState {
  active: boolean;
  callerId: string;
  callerName: string;
  votes: Record<string, "yes" | "no">;
  startedAt: number;
  expiresAt: number;  // startedAt + 60000
}

// Per-player client state:
let lastVoteCallTime: number | null = null;
const VOTE_COOLDOWN_MS = 7 * 60 * 1000; // 7 minutes

function canCallVote(): boolean {
  if (!lastVoteCallTime) return true;
  return Date.now() - lastVoteCallTime > VOTE_COOLDOWN_MS;
}
```

#### Edge Cases

- **Vote in progress + player leaves**: their vote is removed from count. Majority recalculated against remaining humans.
- **Vote in progress + caller leaves**: vote is cancelled.
- **Vote in progress + new cycle starts**: vote continues (doesn't reset).
- **Multiple votes simultaneously**: only one vote can be active at a time. "End Game" button disabled while a vote is active.

---

## Disconnect & Reconnect

### Presence System

Firebase Realtime Database has built-in presence via `onDisconnect()`:

```typescript
// On join:
const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
set(child(playerRef, 'connected'), true);
onDisconnect(child(playerRef, 'connected')).set(false);
```

### Disconnect Handling

When a player disconnects (`connected` = false):
1. **Immediately**: bot takes over their country. No delay. Game continues.
2. **Their country shows "(Bot)" suffix** in player list: "alice (EU) — Bot"
3. **If they reconnect** (same `playerId`): bot hands back control instantly. "(Bot)" removed.

### Reconnect Flow

Player returns to landing page → sees their active game in the list (or enters room ID) → joins → recognized by `playerId` → restored to their country. No disruption to other players.

---

## Game Archive System

### When Does a Game Get Archived?

| Trigger | Delay | Reason |
|---------|-------|--------|
| Host clicks "End Game (Host)" | 30 seconds (stats screen) | Hard stop |
| End-game vote passes | 30 seconds (stats screen) | Democratic end |
| All human players disconnect | **3 minutes** | Grace period for reconnects |
| Room idle > 30 minutes | Immediate | Cleanup stale rooms |

### Archive Process

1. Set `rooms/{roomId}/status` = `"ending"`
2. Compute final stats for each player
3. Copy `games/{roomId}` + final stats → `archive/{roomId}`
4. Delete `games/{roomId}`
5. Delete `rooms/{roomId}`
6. Delete `activeRooms/{roomId}`
7. Room ID is now free for reuse

### 3-Minute Grace Period (All Players Left)

When the last human disconnects:
1. Start a 3-minute server timer (Firebase Cloud Function or client-side with `setTimeout` on the last connected client — prefer Cloud Function for reliability)
2. If ANY human reconnects within 3 minutes → cancel timer, game continues
3. If timer expires → archive

```typescript
// Firebase Cloud Function (pseudo):
exports.onPlayerDisconnect = functions.database
  .ref('rooms/{roomId}/players/{playerId}/connected')
  .onUpdate(async (change, context) => {
    if (change.after.val() === false) {
      const roomRef = admin.database().ref(`rooms/${context.params.roomId}`);
      const players = await roomRef.child('players').get();
      
      const anyConnected = Object.values(players.val() || {})
        .some((p: any) => p.connected === true);
      
      if (!anyConnected) {
        // Set archive timer
        await roomRef.child('archiveAt').set(Date.now() + 180000); // 3 min
        // Separate scheduled function checks archiveAt and processes
      }
    }
  });
```

### Stats Screen (shown before archive)

```
┌─────────────────────────────────────────────────────────┐
│                    GAME OVER                            │
│                                                         │
│  Cycles played: 22     Final temperature: +2.3°C       │
│                                                         │
│  ── Final Standings ──                                  │
│                                                         │
│  Country     Player   Money  Happy  Pop   CO₂  Score   │
│  EU          alice    285    72     31    428   ★★★★    │
│  LatAm       rajgm   178    68     64    215   ★★★★    │
│  USA         (bot)    342    45     38    1240  ★★☆☆    │
│  China       bob      198    41     95    1890  ★★☆☆    │
│  India       carol    88     52     92    380   ★★★☆    │
│  OPEC        (bot)    410    38     26    2100  ★☆☆☆    │
│  Russia      (bot)    220    42     19    1650  ★☆☆☆    │
│  Africa      (bot)    45     35     84    190   ★★☆☆    │
│                                                         │
│  Score = weighted: 30% happiness + 25% money +          │
│          20% inverse CO₂ + 15% pop + 10% dashboard     │
│                                                         │
│              [ Return to Menu ]                         │
│                                                         │
│  This game will be archived in 25 seconds...            │
└─────────────────────────────────────────────────────────┘
```

---

## Settings Panel

Bottom-right corner of all screens (landing, lobby, in-game). Small gear icon that expands.

```
┌─────────────────────┐
│  ⚙ Settings         │
│                     │
│  🔊 Music    [ON ●] │
│  🔈 SFX      [● ON] │
│  🔉 Volume   [──●─] │
│                     │
│  Display Name:      │
│  [rajgm________]   │
│                     │
│  [ Save ]           │
└─────────────────────┘
```

- **Music toggle** — on/off, controls `ambient-main.mp3` loop
- **SFX toggle** — on/off, controls all sound effects
- **Volume slider** — master volume (0–100%)
- **Display name** — editable, updates in real time across Firebase
- All settings persisted in `localStorage`

Position: **bottom-right corner**, collapsed to just a gear icon by default. Clicking expands the panel upward.

---

## Bot Takeover

When a human player disconnects or exits:

1. Bot immediately controls their country
2. Bot uses the **Pragmatic** profile (from summitResolutions.md) by default
3. Bot actions happen during cycle processing — no visible "bot is thinking" delay
4. Bot decisions: build cheapest needed building, accept reasonable trades, vote based on self-interest
5. If human reconnects → bot stops, human resumes with whatever state the bot left

Bot countries (never claimed by a human) use profiles based on their country:
- USA → Pragmatic
- EU → Green Pioneer
- Russia → Fossil Maximiser
- China → Pragmatic
- India → Development First
- OPEC → Fossil Maximiser
- LatAm → Green Pioneer
- Africa → Development First

---

## Navigation Flow

```
Landing Page
  ├── Host Game → Settings Modal → Lobby Screen → Game Screen
  ├── Join Game → Room ID Modal → Lobby Screen → Game Screen
  └── Click Active Game → Lobby Screen → Game Screen

Game Screen
  ├── Exit → Landing Page (bot takes over)
  ├── End Game (Host) → Stats Screen → Landing Page
  └── End Game Vote → (pass) Stats Screen → Landing Page
                     → (fail) Game continues

Stats Screen → Landing Page (auto after 30s or click)
```

---

## Firebase Security Rules (sketch)

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "auth == null",  // no auth — open write (academic project)
        "players": {
          "$playerId": {
            ".write": "true"
          }
        }
      }
    },
    "games": {
      "$roomId": {
        ".read": true,
        ".write": true  // host writes cycle state, players write actions
      }
    },
    "activeRooms": {
      ".read": true,
      "$roomId": {
        ".write": true
      }
    },
    "archive": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For academic project: open rules are fine. No sensitive data. If needed later, restrict writes to host for `games/` path.

---

## URL Routing

```
/              → Landing Page
/lobby/{roomId} → Lobby Screen
/game/{roomId}  → Game Screen
/test           → Test Scenario (from testScenario.md)
```

Use React Router. Room ID in URL allows sharing links and browser refresh without losing context.

---

## Implementation Priority

1. **Landing page** — display name, host/join buttons, active games list
2. **Room creation** — Firebase write, room ID generation
3. **Lobby** — player list, ready toggle, start game
4. **Join flow** — room ID input, validation, join
5. **Game start** — random country assignment, initial state generation
6. **Presence** — connect/disconnect detection, bot takeover
7. **End game** — host end, vote system, cooldown
8. **Archive** — stats screen, data migration, cleanup
9. **Settings panel** — audio controls, display name edit
