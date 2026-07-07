# Climate Diplomacy — Playtest Bug Report

**Date:** 2026-07-06  
**Tester:** Automated (Claude via Chrome extension)  
**Version:** localhost:5173 dev build  
**Room tested:** JKRGEP (Normal preset, 5 min cycles, 8 max players)  
**Player:** TestPlayer1, assigned Africa  

---

## Critical Bugs

### 1. Firebase sync breaks after summit vote — `undefined` values in gameState

**Severity:** Critical (blocks multiplayer sync)  
**Steps to reproduce:**
1. Start a game, advance to cycle 2 (or whenever a summit triggers)
2. Vote on the summit resolution (inequality boundary in this case)
3. After vote resolves, observe console errors

**Error:**
```
Error: update failed: values argument contains undefined in property
'games.JKRGEP.gameState.pendingSummitVote.reductionPercent'
```
And after resolution passes:
```
Error: update failed: values argument contains undefined in property
'games.JKRGEP.gameState.activeSummitResolutions.0.reductionPercent'
```

**Root cause:** The summit resolution object for non-emission boundary types (e.g., inequality) doesn't populate `reductionPercent`, leaving it as `undefined`. Firebase Realtime Database rejects `undefined` values in `update()` calls. The sync function at `gameService.ts:63` (`syncGameState`) tries to write the full `gameState` including these `undefined` fields.

**Impact:** After any summit vote, the game state can never sync to Firebase again. In multiplayer, other players see stale state. The game continues locally but is effectively broken for synchronization.

**Fix:** Either:
- Strip `undefined` values before writing to Firebase (recursive clean function)
- Set default values for optional fields (`reductionPercent: null` or `reductionPercent: 0`)
- Use `JSON.parse(JSON.stringify(gameState))` before syncing (removes `undefined` keys)

---

### 2. End Game (Host) uses blocking `confirm()` dialog

**Severity:** High  
**Steps to reproduce:**
1. Click "End Game (Host)" button in the top-right header bar

**Expected:** A custom in-game modal asking for confirmation  
**Actual:** A native browser `confirm()` dialog that blocks the renderer thread. This froze the Chrome tab entirely, disconnecting the Chrome extension and making the page unresponsive for 30+ seconds.

**Fix:** Replace `window.confirm()` with a custom React modal component (consistent with the game's existing overlay/modal pattern).

---

## Medium Bugs

### 3. Build dialog allows clicking "Place Build" with insufficient funds (silent failure)

**Severity:** Medium  
**Steps to reproduce:**
1. Click on a hex in your territory
2. Select a building that costs more than your budget (e.g., Farm costs 40, Africa has 18 money)
3. Click "Place Build"

**Expected:** Button disabled or error message shown when player can't afford the building  
**Actual:** Nothing happens — no error, no feedback. The dialog stays open.

**Fix:** Either disable "Place Build" when budget < cost, or show a red error message like "Insufficient funds (need 40, have 18)."

---

### 4. Per-Region Breakdown panel doesn't show all 8 countries

**Severity:** Medium  
**Steps to reproduce:**
1. Click "▶ World Totals" to expand the Per-Region Breakdown
2. Observe the country cards

**Expected:** All 8 country cards visible (scrollable if needed)  
**Actual:** Only 6-7 countries visible. Latin America and Africa cards are cut off by the right-side hex info panel. No horizontal scroll available.

**Fix:** Either make the breakdown panel horizontally scrollable, wrap cards to a second row, or collapse the hex info panel when breakdown is open.

---

## Low Bugs / UX Issues

### 5. Stale active games never cleaned up

**Severity:** Low  
**Steps to reproduce:**
1. Open the landing page
2. Observe "Active Games" list

**Expected:** Only genuinely active games shown  
**Actual:** 3 stale games from previous sessions still show as "In Progress · 1/8" despite no players being in them. These rooms were never archived.

**Fix:** Implement a heartbeat/TTL mechanism — if no player has been present for N minutes, auto-archive and remove from `activeRooms/`. Alternatively, filter out games with 0 connected players on the client side.

---

### 6. Same-browser tabs share playerId (can't test multiplayer locally)

**Severity:** Low (testing limitation, not a user-facing bug)  
**Description:** Player identity is stored in localStorage (UUID v4). Opening multiple tabs in the same browser shares the same playerId, so you can't simulate multiple distinct players. This is by design per the spec, but worth noting that local multiplayer testing requires separate browsers or incognito mode.

---

### 7. Russia starts with workforce deficit at cycle 1 (balance concern)

**Severity:** Low (balance, not a bug)  
**Description:** On Normal preset, Russia starts with workforce demand of 20 but population of only 18, causing "buildings idling (LIFO)" warning immediately at game start. This may be intentional given Russia's profile, but could confuse new players.

---

## What Worked Well

- **Landing page:** Clean UI, display name input, host/join buttons, active games list, settings gear, music toggle all functional
- **Game Settings modal:** Presets (Easy/Normal/Hard), resource sliders, world settings, infrastructure checkboxes, rules toggles all work correctly
- **Lobby:** Room ID generation, player list, ready toggle, copy ID, start game — all functional
- **Game start:** Map loads correctly, country assignment works, all 8 countries visible with buildings
- **Hex map:** Pan/zoom works, clicking hexes shows build dialog with all 9 building types, tier selector, consequence preview
- **Actions Dashboard:** All 5 tabs (Technology, Diplomacy, Trade, Routes, Summit) render correctly with proper content
- **Diplomacy:** Relations matrix, region identity, domestic agenda all present and accurate
- **Trade:** Partner selection, trade form, transport capacity warnings work
- **Summit:** Resolution triggers correctly on boundary violations, voting UI with YES/NO/ABSTAIN for all 8 countries, timer, auto-vote bots button
- **Comparison Dashboard:** Liefferink pioneer/laggard rankings, gap radar chart, historical trend chart — excellently implemented
- **Cycle engine:** Resources update correctly, CO₂ and temperature increase, Fuel and Rare Earth begin generating, happiness recalculates
- **Bottom toolbar:** Actions, Build, Advance Cycle, Comparison Dashboard buttons all accessible

---

## Priority Fix Order

1. **Firebase undefined values** (#1) — blocks all multiplayer after first summit
2. **Blocking confirm() dialog** (#2) — freezes browser tab
3. **Build dialog silent failure** (#3) — confusing UX
4. **Per-Region Breakdown overflow** (#4) — missing information
5. **Stale games cleanup** (#5) — cosmetic but unprofessional
