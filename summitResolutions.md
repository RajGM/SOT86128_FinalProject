# Summit Resolutions — Doughnut Boundaries Model

Based on: Raworth, K. (2017) *Doughnut Economics: Seven Ways to Think Like a 21st-Century Economist*. Random House. Building on: Rockström, J. et al. (2009) 'Planetary boundaries: Exploring the safe operating space for humanity', *Nature*, 461, pp. 472–475. Updated: Richardson, K. et al. (2023) 'Earth beyond six of nine planetary boundaries', *Science Advances*, 9(37).

---

## Core Concept

Raworth's Doughnut defines a safe and just space for humanity between two boundaries:

- **Ecological ceiling** (Rockström) — planetary limits that must not be overshot (climate change, CO₂ concentration)
- **Social foundation** (Raworth) — minimum standards that must not be fallen short of (food, energy, income, political voice, equity)

The game's summit system uses this framework: **5 boundary conditions are checked every cycle.** When a boundary is breached, a resolution is automatically generated and put to a vote. When no boundary is breached, no summit occurs — players are in the safe space.

This replaces arbitrary rotation or random resolution generation. The **world state itself** determines what comes to a vote. Resolutions get stricter as conditions worsen, creating escalating pressure that mirrors real COP negotiation history (Kyoto 1997 → Paris 2015 → Glasgow 2021 ratchet mechanism).

---

## The 5 Boundaries

### Check Order

Each cycle, the engine checks boundaries in priority order: 1 → 2 → 3 → 4 → 5. **First breach found = that cycle's resolution.** Only one vote per cycle (keeps it fast — popup, vote, done in seconds).

Previously passed resolutions **remain active** regardless of new votes. By mid-game, multiple resolutions can be active simultaneously, each with its own compliance tracking.

---

### Boundary 1: Temperature (Ecological Ceiling)

*Rockström boundary #1: Climate change. Paris Agreement targets of +1.5°C and +2.0°C.*

#### Trigger Conditions

| Zone | Condition | Resolution Generated |
|------|-----------|---------------------|
| Safe | Global temp < +1.5°C | No trigger |
| Warning | ≥ +1.5°C | "All countries must set carbon tax ≥ 20" |
| Danger | ≥ +2.0°C | "All countries must set carbon tax ≥ 40" |
| Critical | ≥ +2.5°C | "All countries must set carbon tax ≥ 60" |

#### Compliance Check

Immediate, every cycle: `country.carbonTaxRate >= resolution.threshold`

Cleanest resolution type — maps to a single checkable variable (the carbon tax slider). Players choose what to do with the tax revenue (dividend, subsidy, finance). The resolution mandates the policy, not the implementation.

#### Escalation

When temperature crosses a higher threshold, the new resolution **replaces** the previous one of the same type. "Tax ≥ 20" is replaced by "Tax ≥ 40" — the ratchet tightens.

#### Why Carbon Tax Floor

Temperature is caused by cumulative CO₂. Carbon tax makes fossil infrastructure expensive, incentivising green transition. The resolution doesn't force players to demolish fossil plants — it forces a policy stance that makes fossil economically painful. How they respond (build green, absorb the cost, transition slowly) is their strategic choice.

---

### Boundary 2: CO₂ Concentration (Ecological Ceiling)

*Rockström boundary #1 (second control variable): atmospheric CO₂ concentration. Mapped to per-cycle global emissions as a flow variable.*

#### Trigger Conditions

| Zone | Condition | Resolution Generated |
|------|-----------|---------------------|
| Safe | Total global CO₂/cycle < 200 | No trigger |
| Warning | ≥ 200 | "Top 3 emitters must reduce national CO₂ by 10% within 3 cycles" |
| Danger | ≥ 400 | "Top 3 emitters must reduce by 20% within 3 cycles" |
| Critical | ≥ 600 | "All countries above global per-capita CO₂ average must reduce by 15% within 3 cycles" |

#### Compliance Check

On passage: snapshot each target country's current CO₂ as `baselineCo2`. Each subsequent cycle: `country.co2 <= baselineCo2 × (1 - reductionPercent)`. Compliance window = 3 cycles from passage. After 3 cycles, non-compliance is locked in permanently for that resolution.

#### Target Selection

- Warning/Danger: top 3 emitters by absolute CO₂ this cycle (not per capita — total national output).
- Critical: all countries whose per-capita CO₂ exceeds the global average. This shifts burden to heavy emitters while protecting low-emission developing countries.

#### Why Emission Reduction (Not Tax Floor)

Boundary 1 already handles carbon tax. Boundary 2 targets the **outcome** — actual emissions, not just policy. A country might set tax at 40 (compliant with Boundary 1) but still emit heavily because they have many fossil plants. Boundary 2 forces actual cuts.

---

### Boundary 3: Human Development (Social Floor)

*Raworth's social foundation dimensions: food (SDG 2), energy (SDG 7), income & work (SDG 8). Adapted as a composite basic-needs boundary.*

#### Trigger Conditions (ANY one triggers)

| Condition | What It Detects |
|-----------|----------------|
| Any country has < 5 cycles of food supply remaining | Approaching famine. Calculated: `food / (population × 3 / 100)` |
| Any country has < 5 cycles of energy supply remaining | Approaching energy crisis. Calculated: `energy / (population × 2 / 100)` |
| 3+ countries simultaneously have negative resource balance (consuming more than producing per cycle) | Systemic resource stress, not just one country |
| Any country's money drops below 10 | Cannot afford to build anything — development trapped |

#### Resolution Generated

"Countries with food > 100 OR energy > 100 must create at least one trade offer of surplus resource to a deficit country at 1:1 money ratio this cycle."

At higher severity (2+ conditions triggered simultaneously):

"Countries with food > 150 OR energy > 150 must create at least one trade offer at 0.5:1 money ratio (subsidised)."

#### Compliance Check

Per cycle: did the surplus country create an **outgoing trade offer** of the relevant resource to any deficit country? The resolution demands availability, not that a deal closes — the deficit country might reject terms or not have transport capacity. Compliance = you made the offer.

Surplus threshold: food > 100 or energy > 100 (enough that sharing doesn't threaten your own stability).

#### Why Trade Offers (Not Forced Transfer)

Forced transfer removes player agency. The resolution creates an **obligation to offer help**, not to solve the problem. This mirrors real international aid: donor countries pledge at COP, but delivery depends on bilateral negotiation. The game preserves the negotiation layer while punishing countries that refuse to even offer.

---

### Boundary 4: Inequality / Justice Gap (Social Floor)

*Raworth's social foundation dimensions: social equity (SDG 10), political voice (SDG 16). Also grounded in CBDR principle — Common But Differentiated Responsibilities (Rio Declaration, 1992, Principle 7).*

#### Trigger Conditions (ANY one triggers)

| Condition | What It Detects |
|-----------|----------------|
| Richest country's money > 4× poorest country's money | Extreme wealth gap |
| Highest-tech country's tech > 3× lowest-tech country's tech | Technology apartheid — developing countries locked out of green transition |
| Pioneer/laggard composite gap between rank #1 and rank #8 exceeds 0.7 | One country far ahead, one far behind on environmental performance |
| Any developing country (starting money < 40: India, LatAm, Africa) has received zero climate finance after cycle 10 | Rich countries failing to support transition |

#### Resolution Generated

"Countries with money > 60 must contribute 10 money OR 5 technology to countries with money < 30 or tech < 20."

At higher severity (2+ conditions triggered simultaneously):

"Countries with money > 60 must contribute 15 money OR 8 technology. Contributions count toward climate finance dashboard metric."

#### Compliance Check

Per cycle: did the wealthy country send money or tech to a qualifying poorer country via trade? The resolution specifies a minimum contribution amount. Tracked via trade history — any completed transfer of money or tech from a qualifying rich country to a qualifying poor country counts.

Qualifying "rich": current money > 60. Qualifying "poor": current money < 30 or tech < 20.

#### Why Money OR Tech

Some rich countries are cash-rich but tech-poor (OPEC). Others are tech-rich but cash-moderate (EU). Offering a choice ensures the resolution is feasible for different country profiles. Tech transfers are arguably more valuable long-term (enables green plant construction), but money is more immediately useful for survival.

---

### Boundary 5: Political Stability (Social Floor)

*Raworth's social foundation dimension: political voice (SDG 16). Also: Putnam (1988) — domestic instability constrains international negotiation capacity.*

#### Trigger Conditions (ANY one triggers)

| Condition | What It Detects |
|-----------|----------------|
| Average global happiness drops below 55 | World is collectively deteriorating |
| 3+ countries simultaneously have happiness below 50 (concerned level) | Widespread discontent, not just one failing state |
| Any country enters crisis: happiness < 30 | Active humanitarian crisis — buildings idle, population fleeing |
| Global population has declined by 10%+ from peak | Mass population loss across countries |

#### Resolution Generated

Standard: "All active trade restrictions (relations < 20 blocks) are suspended for 3 cycles. All countries must set carbon tax no higher than current level (freeze, not raise)."

If any country is in crisis (happiness < 30): "Countries with happiness > 60 must contribute 10 money to each crisis country. Trade restrictions suspended for 3 cycles."

#### Compliance Check

Trade restriction suspension is **mechanical** — the engine temporarily ignores the < 20 trade block for 3 cycles. This is the only resolution with direct mechanical effect, justified because political collapse threatens the entire game system.

Carbon tax freeze: `country.carbonTaxRate <= rate_at_time_of_passage`. Cannot raise tax during a stability crisis (protects brown factions in struggling countries).

Money contribution: did wealthy countries (happiness > 60) send 10 money to crisis countries via trade?

#### Why Diplomatic Reset

When multiple countries are in crisis, the game risks a death spiral: low happiness → buildings idle → less production → less trade → worse happiness → collapse. The diplomatic reset (trade restrictions suspended) gives struggling countries a lifeline by reopening trade channels. This mirrors real-world emergency humanitarian corridors that bypass political disputes.

The carbon tax freeze is counterintuitive — it temporarily protects fossil interests. But it's grounded in real policy: during economic crises, even green-leaning governments pause carbon tax increases (EU during 2022 energy crisis, for example). The game acknowledges that survival takes priority over transition when the social floor is breached.

---

## Voting Mechanics

### Flow (Same for All 5 Boundaries)

1. **Engine detects boundary breach** → generates resolution text with specific numbers
2. **UI shows resolution popup** to all 8 players with 30-second vote timer
3. **Each country votes:** YES / NO / ABSTAIN
4. **Majority rule:** 5+ YES votes (excluding abstentions from denominator) = passes
   - 8 players, 2 abstain → 6 voting → need 4 YES to pass
   - 8 players, 0 abstain → 8 voting → need 5 YES to pass
5. **Resolution activates** or fails

### Vote Timer

30 seconds to vote. If a player doesn't vote within 30 seconds, they are marked ABSTAIN. Bot-controlled countries vote instantly based on their strategy profile (see Bot AI section below).

### Relations Effects from Voting

| Event | Effect |
|-------|--------|
| Two countries vote the same way (both YES or both NO) | +2 relations between them |
| Two countries vote opposite (one YES, one NO) | −3 relations between them |
| Abstain | No relations change |

These apply **regardless of whether the resolution passes.** A failed vote still creates diplomatic friction between opposing voters.

---

## Compliance Tracking

### Data Model

```typescript
interface SummitResolution {
  id: string;
  cycle: number;                    // when passed
  boundaryType: 'temperature' | 'co2_concentration' | 'human_development' | 'inequality' | 'political_stability';
  resolutionText: string;           // human-readable
  threshold: number;                // the specific number (tax ≥ 20, reduce 10%, contribute 10 money)
  targetCountries: CountryId[];     // who must comply ('all' or specific list)
  votes: Record<CountryId, 'yes' | 'no' | 'abstain'>;
  baselineCo2?: Record<CountryId, number>;  // snapshot for emission reduction (Boundary 2)
  complianceDeadline?: number;      // cycle by which compliance must be achieved (Boundary 2)
  expiresOnSafe?: boolean;          // does this resolution expire when boundary returns to safe?
  active: boolean;
}

// In GameState
activeSummitResolutions: SummitResolution[];
summitHistory: SummitResolution[];  // all past resolutions (for dashboard voting record)
```

### Per-Country Per-Cycle Compliance Check

```typescript
interface ComplianceResult {
  countryId: CountryId;
  resolutionId: string;
  compliant: boolean;
  reason: string;  // "Tax rate 15 < required 20" or "Sent 10 money to Africa"
}
```

After cycle processing step 12b (relations update), add:

**Step 12c. Summit compliance check**

For each active resolution:
1. Identify target countries
2. Check compliance condition for each
3. Apply non-compliance penalties to violators
4. Log compliance result for dashboard

### Resolution Lifecycle

- **Boundary 1 (temperature):** Active until replaced by a stricter version at a higher threshold. Never expires — temperature doesn't go down in the game.
- **Boundary 2 (CO₂):** Active for `complianceDeadline` cycles (3 cycles from passage). After deadline, compliance is locked (you either met the target or you didn't). Resolution remains in history for voting record.
- **Boundary 3 (human development):** Active as long as any country meets the trigger condition. Expires when all countries are above the food/energy/money thresholds.
- **Boundary 4 (inequality):** Active as long as the gap condition persists. Expires when gaps narrow below triggers.
- **Boundary 5 (political stability):** Active for 3 cycles (the diplomatic reset window). Then expires. Can re-trigger if conditions persist.

---

## Non-Compliance Consequences

Applied per cycle for each active resolution a country is non-compliant with:

| Consequence | Effect | Stacks? |
|-------------|--------|---------|
| Relations penalty | −4 from every country that voted YES on this resolution | Yes, per cycle |
| Green faction anger | −5 green satisfaction | Yes, per cycle |
| Dashboard hit | Summit voting record metric worsens (counts as NO vote equivalent) | Cumulative |
| Alert notification | "⚠️ [Country] is non-compliant with [Resolution]. Relations deteriorating." | Every cycle |

### Stacking Example

OPEC is non-compliant with both a tax floor resolution (Boundary 1) AND an inequality resolution (Boundary 4). Per cycle:

- Relations: −4 from YES-voters on resolution 1 + −4 from YES-voters on resolution 2 = potentially −8 from countries that voted YES on both
- Green faction: −5 + −5 = −10 satisfaction per cycle
- Within 3 cycles of dual non-compliance, OPEC's relations with most countries drop below 30 (transit cancelled) or 20 (trade blocked)

Non-compliance is survivable short-term but catastrophic long-term. This is deliberate — it mirrors how real international non-compliance (US leaving Paris Agreement) has delayed consequences rather than immediate punishment.

---

## Bot AI Voting

Bot-controlled countries vote based on their strategy profile:

| Profile | Countries | Ceiling Resolutions (tax/emissions) | Floor Resolutions (aid/transfer) |
|---------|-----------|-------------------------------------|----------------------------------|
| Fossil Maximiser | OPEC, Russia | Vote NO (carbon tax hurts core economy) | Vote NO on giving aid, YES on receiving |
| Green Pioneer | EU, LatAm | Vote YES (green faction demands it) | Vote YES (aligns with pioneer identity) |
| Pragmatic Balancer | USA, China | Vote YES if own compliance cost < 20 money/cycle, otherwise NO | Vote YES if they have surplus, NO if tight |
| Development First | India, Africa | Vote YES if resolution includes aid to developing countries | Vote YES (usually recipients, not contributors) |

Bot voting is deterministic from the strategy profile — students can predict and analyse bot behaviour.

---

## Cycle Integration

Add to the 14-step cycle after step 12b (relations update):

**Step 12c. Summit boundary check and vote**

1. Check boundaries 1–5 in priority order
2. If any boundary is breached and no vote has occurred this cycle:
   a. Generate resolution based on boundary type and severity
   b. Present vote to all players (30-second timer)
   c. Collect votes, determine pass/fail
   d. If passed: add to `activeSummitResolutions`, apply relations effects from voting
   e. If failed: apply relations effects from voting only, no resolution activated
3. For all active resolutions: check compliance for each target country
4. Apply non-compliance penalties (relations, factions, dashboard)

---

## Connection to Other Systems

### Factions (factionsInCountry.md)

Summit votes directly affect faction satisfaction:
- Voting YES on ceiling resolutions: green +5, brown −5
- Voting NO on ceiling resolutions: green −4, brown +3
- Non-compliance with any resolution: green −5 per cycle

### Carbon Tax (carbonTax.md)

Boundary 1 resolutions set a **minimum floor** for the carbon tax slider. Players can set tax higher than the floor but not lower while the resolution is active. The slider UI shows the floor as a locked minimum.

### Dashboard (comparisonDashboard.md)

Summit voting record is metric #5 in the pioneer/laggard gap calculation:
- YES votes improve your score
- NO votes worsen it
- Non-compliance worsens it further
- Abstain counts as 0.5 (neutral)

### Relations (event-driven-relations.md)

Summit events are 2 of the 17 event types:
- `summit_same_vote`: +2 bilateral
- `summit_opposite_vote`: −3 bilateral

Non-compliance adds a new ongoing event:
- `summit_non_compliance`: −4 from each YES-voter per cycle

---

## Design Rationale

### Why State-Triggered (Not Rotating)

Rotating resolutions (one type per cycle, predetermined) would produce votes on topics that don't matter yet. A carbon tax floor vote when temperature is 1.1°C is meaningless. State-triggered resolutions ensure every vote is about a **real, present problem** — exactly how COP conferences respond to the latest IPCC assessment.

### Why Escalating

Rockström's framework has zones: safe → zone of uncertainty → high risk. Each zone triggers a progressively stricter response. This mirrors the COP ratchet mechanism where nationally determined contributions are supposed to increase ambition over time (Paris Agreement Article 4.3).

### Why Diplomatic (Not Mechanical) Enforcement

Mechanical enforcement (auto-deducting money, forcing building demolition) removes player agency and defeats the simulation purpose. Real climate agreements have no enforcement mechanism — the Paris Agreement relies on transparency, peer pressure, and graduated diplomatic consequences. Our game reproduces this: compliance is tracked, non-compliance is punished through relations and domestic politics, but no one can force you to act. The question is whether the diplomatic cost exceeds the economic benefit of defiance.

Exception: Boundary 5 (political stability) has one mechanical effect — temporarily suspending trade blocks. This is justified as emergency humanitarian response, analogous to how real wars and disasters trigger temporary ceasefires and aid corridors that bypass normal political relations.

### Why the Doughnut Framework

The module asks students to evaluate "factors contributing to the successes and failures of pioneer and laggard states" (ILO). The doughnut framework provides the definition of success: staying in the safe space. A country that develops economically (stays above the social floor) while keeping emissions low (stays below the ecological ceiling) is a pioneer. A country that overshoots or falls short is a laggard. The summit system operationalises this evaluation — every resolution vote is a moment where the group collectively assesses whether they are inside or outside the doughnut.

---

## Academic Sources

- Raworth, K. (2012) *A Safe and Just Space for Humanity: Can We Live Within the Doughnut?* Oxfam Discussion Paper. Oxford: Oxfam International.
- Raworth, K. (2017) *Doughnut Economics: Seven Ways to Think Like a 21st-Century Economist*. London: Random House Business.
- Rockström, J. et al. (2009) 'A safe operating space for humanity', *Nature*, 461(7263), pp. 472–475.
- Richardson, K. et al. (2023) 'Earth beyond six of nine planetary boundaries', *Science Advances*, 9(37), eadh2458.
- UNFCCC (2015) *Paris Agreement*. Article 4.3: ratchet mechanism for nationally determined contributions.
- UNFCCC (1992) *Rio Declaration on Environment and Development*. Principle 7: Common But Differentiated Responsibilities (CBDR).
- Putnam, R.D. (1988) 'Diplomacy and Domestic Politics: The Logic of Two-Level Games', *International Organization*, 42(3), pp. 427–460.
