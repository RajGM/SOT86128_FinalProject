# Carbon Tax — Double Dividend Model

Based on: Nordhaus DICE model (abatement cost framework) and Goulder's Double Dividend Hypothesis (1995). Revenue recycling options drawn from CGE modeling literature (Freire-González 2018, Fed Reserve 2021).

---

## Core Concept

Each country has a **carbon tax slider** (0–100). The tax collects money proportional to national CO₂ emissions. The revenue is then **recycled** into one of three destinations the player chooses. The tax never reduces CO₂ directly — the only way to cut emissions is to replace fossil buildings with green ones. The tax makes fossil infrastructure expensive enough to motivate that switch.

This is the Nordhaus abatement cost logic: carbon pricing internalizes the externality. The "cost" is real (money leaves your treasury), the "benefit" depends on how you recycle the revenue (double dividend question).

---

## Mechanics

### Tax Collection (per cycle)

```
tax_collected = national_co2_this_cycle × (carbon_tax_rate / 100)
```

CO₂ sources (same ones that feed the temperature model):

| Building | T1 CO₂ | T2 CO₂ | T3 CO₂ |
|----------|--------|--------|--------|
| Fossil Plant | 30 | 45 | 55 |
| Industrial Complex | 8 | 12 | 15 |
| City | 5 | 8 | 10 |
| Manufacturing | 5 | 8 | 8 |
| Extractor | 3 | 4 | 5 |

Transport emissions (land 3/unit, sea 5/unit, air 8/unit) are also taxed.

**Examples at different tax rates:**

| Scenario | National CO₂ | Tax Rate | Money Collected |
|----------|-------------|----------|-----------------|
| USA early game (2 fossil, 1 industrial, 1 city) | 73 | 10% | 7 money/cycle |
| USA early game | 73 | 40% | 29 money/cycle |
| OPEC heavy fossil (4 fossil, 2 extractor) | 126 | 40% | 50 money/cycle |
| EU green (2 green, 1 nuclear, 1 city) | 5 | 40% | 2 money/cycle |

A country running mostly green pays almost nothing regardless of tax rate. That's the point.

### Carbon Tax Slider

- Range: **0–100** (integer, increments of 5)
- Default: **0** (no carbon tax)
- Can be changed once per cycle (during the player's action phase, before cycle processes)
- UI: slider in the country dashboard, next to a dropdown for recycling destination

### Revenue Recycling (player chooses one)

The player selects where collected tax money goes. Can change the destination once per cycle alongside the tax rate.

| Option | What Happens | Game Effect | Academic Basis |
|--------|-------------|-------------|----------------|
| **Citizen Dividend** | Money distributed to population | +1 happiness per 10 money recycled (capped at +8) | Lump-sum transfer — politically popular but least efficient (Goulder 1995) |
| **Green Subsidy** | Money funds clean energy discount | Next green/nuclear build cost reduced by recycled amount (capped at 50% of build cost) | Technology/investment fund — most economically efficient (Freire-González 2018) |
| **Climate Finance** | Money sent to developing countries | Improves relations with all developing countries (+1 per 15 money, capped at +3/cycle). Adds to climate finance ledger for dashboard. | International climate fund — Cancún 2010 $100B/yr pledge |

Only one option active at a time. The full tax_collected amount goes to the chosen destination.

---

## Revenue Recycling Details

### Option 1: Citizen Dividend

```
happiness_bonus = min(floor(tax_collected / 10), 8)
```

Money is removed from treasury. Citizens get a rebate — represented as happiness. This is the carbon fee-and-dividend model (Citizens' Climate Lobby, Canada's carbon rebate).

**Tradeoff:** You lose money but keep population happy. Good for countries with large brown factions where high carbon tax causes faction anger — the dividend offsets some of the happiness loss from brown dissatisfaction.

### Option 2: Green Subsidy

```
green_subsidy_pool += tax_collected
// On next green or nuclear build:
actual_cost = max(build_cost - green_subsidy_pool, build_cost × 0.5)
green_subsidy_pool -= (build_cost - actual_cost)
```

Money is removed from treasury and pooled. When you build a green plant or nuclear plant, the pool subsidizes up to 50% of the build cost. Pool carries over between cycles until spent.

**Tradeoff:** No immediate benefit — you're investing in cheaper future green transition. Best for countries actively building green infrastructure. Useless if you're not building anything.

### Option 3: Climate Finance

```
// Money removed from treasury, distributed to developing countries
developing_countries = countries where starting_money < 40  // India, LatAm, Africa
per_country = floor(tax_collected / 3)
// Each developing country receives per_country money
// Relations improvement:
relations_bonus = min(floor(tax_collected / 15), 3)
// Applied: each developing country → sender gains relations_bonus
```

Money actually transfers to other players' treasuries (split equally among India, LatAm, Africa). This is real money movement — developing countries receive funds they can spend.

**Tradeoff:** You lose money domestically but gain diplomatic capital and improve your pioneer/laggard dashboard score. Developing countries benefit economically. Creates genuine wealth transfer dynamic mirroring real climate finance debates.

---

## Faction Interaction

Carbon tax directly affects faction satisfaction (already specified in factionsInCountry.md):

| Event | Brown Satisfaction | Green Satisfaction |
|-------|-------------------|-------------------|
| Tax raised by N points | −(N / 5) | +(N / 5) |
| Tax lowered by N points | +(N / 5) | −(N / 5) |

**Example:** OPEC (90% brown) raises tax from 0 to 40.

- Brown satisfaction: −8 (40/5). At 90% faction weight, this hits happiness hard.
- Green satisfaction: +8. But at 10% weight, barely registers.
- Net faction effect: heavily negative.
- If recycling via citizen dividend: +happiness from rebate partially offsets.
- If recycling via green subsidy: no offset — OPEC suffers politically AND economically.

This is why OPEC resists carbon taxes in real life. The game reproduces the structural incentive.

---

## Dashboard Integration

Carbon tax level is **metric #3** in the comparison dashboard (comparisonDashboard.md):

```
value = country.carbonTax (0–100)
best = max(all countries' carbon tax)
gap = (best - value) / max(best, 1)
```

Setting a higher tax improves your pioneer score. Setting zero makes you a laggard on this metric.

---

## Summit Interaction

Summit resolutions (see summitResolutions.md) can set a **minimum carbon tax floor**:

- Resolution: "All countries must set carbon tax ≥ 30"
- Majority vote to pass
- Non-compliant countries after passage: relations penalty from YES-voters, laggard flag on dashboard

The carbon tax slider remains the player's choice — summit resolutions create diplomatic pressure, not mechanical enforcement. You can ignore the floor, but you pay in relations and reputation.

---

## Cycle Integration

Add as **step 8b** in the 14-step cycle, after CO₂ sum (step 8) and before temperature update (step 9):

**Step 8b. Carbon tax collection and recycling**

1. Calculate `tax_collected = national_co2 × (carbon_tax_rate / 100)`
2. Deduct `tax_collected` from country's money
3. Apply recycling based on selected option:
   - Citizen dividend → add happiness bonus
   - Green subsidy → add to `greenSubsidyPool`
   - Climate finance → transfer money to developing countries, update relations, update `climateFinanceGiven` ledger
4. If money goes negative from tax, clamp to 0 (country is broke — tax collects what it can)

---

## Data Model

### In RegionState (extend)

```typescript
carbonTaxRate: number;           // 0–100, default 0
carbonTaxRecycling: 'dividend' | 'subsidy' | 'finance';  // default 'dividend'
greenSubsidyPool: number;       // accumulated subsidy, default 0
climateFinanceGiven: number;    // cumulative, for dashboard tracking
```

### In GameState (extend)

```typescript
// Already tracked: relations, co2 per country
// Needed: previousCycleCo2 per country (for dashboard trend metric)
previousCycleCo2: Record<CountryId, number>;
```

---

## Strategic Analysis by Country

| Country | Natural Tax Level | Why | Best Recycling |
|---------|------------------|-----|----------------|
| USA | Low–Medium | High CO₂ (72 base), 60% brown faction. Tax is expensive and politically costly. | Citizen dividend (offset brown anger) |
| EU | High | Low CO₂ (20 base), 70% green faction. Tax costs little and green faction loves it. | Green subsidy (accelerate transition) |
| Russia | Low | High fossil dependence, 80% brown. Tax on extractors/fossil hurts core economy. | Any — but tax itself is politically toxic |
| China | Medium | 50/50 factions, high CO₂. Swing state. Tax is a real political choice. | Green subsidy (manufacturing + tech focus) |
| India | Medium–High | 60% green, low CO₂ (13 base). Tax costs almost nothing. Free pioneer points. | Climate finance (receive, not give) |
| OPEC | Near zero | 90% brown, economy IS fossil. Tax is economic suicide. | N/A — OPEC resists tax structurally |
| LatAm | Medium–High | 70% green, low CO₂ (10 base). Cheap pioneer status. | Climate finance (receive) |
| Africa | Low–Medium | Low CO₂ but also low money. Can't afford the drain. | Climate finance (receive) |

Note: India, LatAm, and Africa are climate finance **recipients** — when other countries recycle via climate finance, these three get the money. This creates an incentive for developing countries to push for high carbon taxes at summits (they benefit from others' revenue recycling).

---

## Why No Direct CO₂ Reduction

The carbon tax does NOT reduce emissions. This is deliberate:

1. **Fossil plants don't get cleaner** — if tax auto-reduced CO₂, there's no reason to build green plants. The whole point of the game's building system is that you must physically replace infrastructure.

2. **Nordhaus model** — in DICE, the carbon tax is a price signal that shifts investment decisions. It doesn't magically reduce emissions; it makes clean alternatives relatively cheaper. Our green subsidy recycling option does exactly this.

3. **Game design** — if tax = less CO₂, optimal play is just "set tax to 100" and never build green. The tax must cost something real without solving the problem for free. The problem is solved by building green plants. The tax makes that economically easier (via subsidy) or politically necessary (via faction pressure and summit diplomacy).

---

## Academic Sources

- Nordhaus, W. (2018). "Climate Change: The Ultimate Challenge for Economics." Nobel Prize Lecture. DICE model: carbon tax as abatement cost that shifts investment, not a direct emission reducer.
- Goulder, L. (1995). "Environmental Taxation and the Double Dividend: A Reader's Guide." National Tax Journal. Established the strong vs weak double dividend distinction.
- Freire-González, J. (2018). "Environmental taxation and the double dividend hypothesis in CGE modelling literature: A critical review." Journal of Policy Modeling. Meta-analysis of 69 simulations: revenue recycling via investment/corporate tax cuts most efficient.
- Federal Reserve (2021). "Recycling Carbon Tax Revenue to Maximize Welfare." FEDS Working Paper. Lump-sum least efficient (0.56% GDP loss), corporate tax cut most efficient (0.24%).
- Citizens' Climate Lobby — carbon fee-and-dividend model (real-world basis for citizen dividend option).
- Cancún Agreements (2010) — $100B/yr climate finance pledge from developed to developing countries (basis for climate finance option).
