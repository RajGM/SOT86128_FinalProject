# Event-Driven Relations System

---

## Core Concept

Every country pair has a **relations score** (0–100, starts at 50). The score changes automatically based on in-game events — no manual "set relations" action. Players see consequences of their decisions reflected in how other countries feel about them.

Two visibility layers:
1. **Trade partners** — full history (every event logged with cycle number)
2. **Non-partners** — only the current score in a matrix view

---

## Relations Score

| Range | Label | Color |
|-------|-------|-------|
| 80–100 | Allied | Dark green |
| 60–79 | Friendly | Green |
| 40–59 | Neutral | Yellow |
| 20–39 | Strained | Orange |
| 0–19 | Hostile | Red |

Starting value: **50** (Neutral) for all pairs. Stored in `RegionState.relations` (already exists in code).

Clamped to 0–100. Changes are bilateral by default (both sides affected equally) unless noted.

---

## Events That Change Relations

### Trade Events

| Event | Effect | Who is affected |
|-------|--------|----------------|
| Trade completed (one-time) | +3 both sides | Sender ↔ Receiver |
| Continuous trade active (per cycle) | +1 both sides | Sender ↔ Receiver |
| Trade proposal rejected | −2 proposer feels toward rejecter | One-sided |
| Trade deal cancelled by sender | −5 receiver feels toward sender | One-sided |
| Population traded (immigration deal) | +5 both sides | Sender ↔ Receiver |
| Hub tier upgrade gifted | +8 both sides | Sender ↔ Receiver |
| Technology traded | +4 both sides | Sender ↔ Receiver |

### Transit Events

| Event | Effect | Who is affected |
|-------|--------|----------------|
| Transit approved | +3 transit country ↔ both traders | Three-way |
| Transit denied | −5 traders feel toward denier | One-sided from traders |
| Transit fee paid (per cycle) | +1 payer → transit country | One-sided |
| Transit cancelled by transit country | −6 traders feel toward canceller | One-sided |

### Summit Events

| Event | Effect | Who is affected |
|-------|--------|----------------|
| Voted same way (both YES or both NO) | +2 between those two | Bilateral |
| Voted opposite (one YES, one NO) | −3 between those two | Bilateral |
| Abstained | 0 (no change) | — |

### Emissions Events (per cycle, automatic)

| Event | Effect | Who is affected |
|-------|--------|----------------|
| Country is top-3 global emitter AND another country's happiness dropped from temperature | −1 victim feels toward emitter | One-sided |
| Country's CO₂ decreased this cycle | +1 from all countries with green faction > 50% | One-sided |

### Climate Finance Events

| Event | Effect | Who is affected |
|-------|--------|----------------|
| Money/tech sent to developing country (starting money < 40) | +5 receiver feels toward sender | One-sided |
| Climate finance resolution passed, country didn't pay | −4 all developing countries feel toward non-payer | One-sided |

---

## Threshold Effects (what relations scores DO)

| Threshold | Effect |
|-----------|--------|
| **Below 30** | Transit agreements auto-cancelled (already implemented). Route disrupted, trades on that route deactivated. |
| **Below 20** | Trade proposals auto-rejected. Cannot initiate new trades with that country. Existing continuous trades continue but no new ones. |
| **Above 70** | Transit commission reduced 50% (friendly discount). |
| **Above 80** | Trade capacity cost reduced — trades between allied countries cost 0.5 transport capacity per unit instead of 1. |

---

## Visibility Rules

### Your trade partners (full detail)

Any country you have an active or historical trade/transit agreement with = **trade partner**. You see:

**Relations Detail Panel** (click on a country you've traded with):

```
Relations with EU: 72 (Friendly) ↑ +5 from last cycle

History:
  Cycle 8: Trade completed (30 food → EU)         +3
  Cycle 8: Voted same way on carbon floor          +2
  Cycle 7: Transit approved (through Russia)       +3
  Cycle 6: Technology traded (15 tech → EU)        +4
  Cycle 5: Trade proposal rejected by EU           −2
  Cycle 4: EU is top-3 emitter, your happiness dropped  −1
  Cycle 3: First trade established                 +3
  Cycle 1: Starting relations                      50
```

Full event log. Scrollable. Shows exactly WHY relations are where they are. Both sides see the same history.

### Non-partners (matrix only)

Countries you've never traded with: you only see the **current score** in the relations matrix. No history, no event log. You know Russia feels "Strained" (35) toward you but not why — maybe they're upset about your summit votes, maybe about emissions. You'd have to engage diplomatically (trade, transit) to find out and build the relationship.

### Relations Matrix (always visible)

8x8 grid showing every bilateral score. Color-coded by range. Your own row is highlighted.

```
        USA   EU   RUS  CHN  IND  OPEC LAT  AFR
USA      —    62   45   38   55   42   58   50
EU      62     —   35   48   65   30   70   68
RUS     45    35    —   55   40   60   42   38
CHN     38    48   55    —   45   50   35   42
IND     55    65   40   45    —   48   58   62
OPEC    42    30   60   50   48    —   45   40
LAT     58    70   42   35   58   45    —   55
AFR     50    68   38   42   62   40   55    —
```

Diagonal is blank (self). Scores are NOT symmetric — USA→EU can be 62 while EU→USA is 58 (one-sided events cause asymmetry).

Clicking any cell in the matrix:
- If trade partner → opens full detail panel with history
- If non-partner → shows just the score and label, plus "No diplomatic history — establish trade to learn more"

---

## Data Model

### In RegionState (already exists, extend)

```typescript
relations: Partial<Record<CountryId, number>>  // already exists, score 0-100
```

### New: RelationEvent type

```typescript
interface RelationEvent {
  id: string;
  cycle: number;
  fromCountry: CountryId;
  toCountry: CountryId;
  event: RelationEventType;
  delta: number;            // +3, -5, etc.
  description: string;      // human-readable
}

type RelationEventType =
  | "trade_completed"
  | "continuous_trade"
  | "trade_rejected"
  | "trade_cancelled"
  | "population_traded"
  | "hub_upgrade_gifted"
  | "technology_traded"
  | "transit_approved"
  | "transit_denied"
  | "transit_fee_paid"
  | "transit_cancelled"
  | "summit_same_vote"
  | "summit_opposite_vote"
  | "top_emitter_damage"
  | "co2_decreased"
  | "climate_finance_given"
  | "climate_finance_defaulted";
```

### New: in GameState

```typescript
relationEvents: RelationEvent[];        // full history log
tradePartners: Record<CountryId, Set<CountryId>>;  // who has traded with whom (ever)
```

### Trade partner tracking

A country becomes your "trade partner" permanently once any of these happen:
- A trade agreement is created (even if rejected)
- A transit agreement involves both countries
- A hub upgrade is traded between you

Once a trade partner, always a trade partner — you can't unsee history.

---

## Cycle Integration

Add to cycle processing after step 12 (population effects):

**Step 12b. Relations update**

1. For each active continuous trade: +1 both sides
2. For each top-3 emitter: −1 from countries whose happiness dropped from temperature this cycle
3. For each country whose CO₂ decreased: +1 from countries with green faction > 50%
4. Check all transit agreements: if relations < 30, auto-cancel (already implemented)
5. Check all trade proposals: if relations < 20, auto-reject

Other events (trade completed, transit approved, summit votes, etc.) are applied immediately when the action happens, not during cycle processing.

---

## Asymmetric Relations

Relations are **not symmetric**. Each country stores its own feeling toward every other country independently.

USA→Russia = 45 (Neutral)
Russia→USA = 38 (Strained)

This happens because:
- One-sided events (trade rejection, transit denial) only affect one direction
- Emissions damage is one-sided (victim→emitter)
- Climate finance is one-sided (receiver→sender)

Symmetric events (trade completed, same summit vote) affect both equally.

This asymmetry is realistic and creates interesting diplomacy: USA thinks relations with Russia are fine (45), but Russia is actually strained (38) and might deny transit soon. USA doesn't know unless they check the matrix.

---

## UI Summary

| View | What you see | When |
|------|-------------|------|
| Relations Matrix (8x8) | All scores, color-coded | Always available via button |
| Detail Panel | Full event history + score | Click on a trade partner in matrix |
| Score Only | Current number + label | Click on non-partner in matrix |
| Alerts | "Relations with X dropped below 30!" | Auto-popup when threshold crossed |

### Alert Notifications

When a threshold is crossed, show a notification:
- **Below 30**: "⚠️ Relations with [Country] critically low. Transit routes at risk."
- **Below 20**: "🚫 Relations with [Country] hostile. New trade proposals will be auto-rejected."
- **Above 70**: "🤝 Relations with [Country] friendly. Transit commissions reduced 50%."
- **Above 80**: "⭐ Alliance with [Country]. Trade capacity costs halved."

---

## Design Rationale

### Why event-driven (not manual)?

Players don't "set" relations. Relations emerge from actions. This means:
- Every decision has diplomatic consequences players can trace
- No arbitrary "I dislike you" buttons — relations are earned
- The history log creates accountability — "you denied my transit in cycle 4, that's why we're at 35"

### Why asymmetric?

Real diplomacy is asymmetric. The US may think relations with Saudi Arabia are fine because trade is flowing. Saudi Arabia may be upset because the US voted for emission limits at the summit. Neither side fully knows how the other feels unless they communicate.

### Why limited visibility for non-partners?

Information asymmetry drives engagement. If you could see everyone's full history, there's less reason to interact diplomatically. The "fog of diplomacy" — knowing someone is strained with you but not knowing exactly why — motivates trade and communication.

### Sources

- Putnam, "Diplomacy and Domestic Politics: The Logic of Two-Level Games" (1988)
- Liefferink et al., leader/laggard dynamics and policy convergence
- Game design: Diplomacy (Avalon Hill) — hidden negotiation and trust mechanics
