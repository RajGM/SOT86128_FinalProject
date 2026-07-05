# Domestic Factions — Green-Brown Establishment Balance

Based on: CEPR empirical finding that the ratio of green to brown establishments (jobs/factories) in a district predicts legislative voting on climate policy (Mezzanotti & Starkman, "Climate Politics in the United States", CEPR DP20578).

---

## Core Concept

Each country has two factions: **Brown** (pro-fossil, pro-growth, anti-regulation) and **Green** (pro-sustainability, pro-regulation, anti-fossil). Faction size is not fixed — it shifts dynamically based on what the player builds. Your infrastructure choices reshape your domestic politics.

---

## How Faction % Is Calculated

Each country starts with **legacy weights** representing pre-game economic structure. Every building constructed shifts the ratio.

```
brown% = (legacy_brown + brown_building_count) / (legacy_brown + legacy_green + total_building_count)
green% = (legacy_green + green_building_count) / (legacy_brown + legacy_green + total_building_count)
```

### Building Classification

| Classification | Buildings |
|---------------|-----------|
| **Brown** | Fossil Plant, Extractor, Industrial Complex |
| **Green** | Green Plant, Nuclear Plant, Manufacturing, Farm |
| **Neutral** (0.5 to each) | City, Transport Hub |

---

## Starting Legacy Weights

Justified by real-world data from IEA World Energy Employment 2024, IRENA/ILO Renewable Energy and Jobs 2024, and World Bank Oil Rents (% of GDP).

| Country | Legacy Brown | Legacy Green | Starting Brown% | Starting Green% | Real-World Justification |
|---------|-------------|-------------|----------------|----------------|--------------------------|
| USA | 6 | 4 | 60% | 40% | Large fossil industry (shale, coal, oil) but also tech/services economy. Oil rents ~1.5% GDP. Fossil jobs politically concentrated in key states. |
| EU | 3 | 7 | 30% | 70% | Lowest fossil dependence among major blocs. First to drop below 70% fossil energy mix. 1.8M renewable energy jobs. Strong green regulation tradition. |
| Russia | 8 | 2 | 80% | 20% | Oil rents 9.7% GDP (World Bank). Economy structurally dependent on fossil export revenue. Minimal renewable sector. |
| China | 5 | 5 | 50% | 50% | 60% of energy workforce in clean sectors (IEA 2024, up from 50% in 2019). But massive coal sector remains. Actively in transition — could go either way. |
| India | 4 | 6 | 40% | 60% | Low industrialization, high solar potential, agricultural economy. Coal-dependent for power but green jobs growing fast (1.3M renewable jobs). |
| OPEC | 9 | 1 | 90% | 10% | Oil rents 20-40% of GDP (World Bank). 80% of energy job growth still fossil (IEA 2024, Middle East). Economy IS fossil fuel. |
| LatAm | 3 | 7 | 30% | 70% | Hydro-dominant electricity, agricultural economy. Brazil alone has 1.4M renewable energy jobs. Low fossil dependence. |
| Africa | 5 | 5 | 50% | 50% | Mineral extraction pull (brown) vs agricultural/low-industrial base (green). At a crossroads — mirrors real development choice facing the continent. |

---

## Faction Satisfaction

Each faction has a satisfaction score (0–100, starts at 60).

### Brown faction satisfaction changes per cycle

| Event | Effect |
|-------|--------|
| Carbon tax raised | −(tax_increase / 5) |
| Carbon tax lowered | +(tax_decrease / 5) |
| Fossil Plant built | +5 |
| Green/Nuclear Plant built | −3 |
| Extractor built | +3 |
| Industrial Complex built | +4 |
| Voted YES on emission limits at summit | −5 |
| Voted NO on emission limits at summit | +3 |
| Money surplus (above 500) | +2 (economy is strong) |

### Green faction satisfaction changes per cycle

| Event | Effect |
|-------|--------|
| Carbon tax raised | +(tax_increase / 5) |
| Carbon tax lowered | −(tax_decrease / 5) |
| Green/Nuclear Plant built | +5 |
| Fossil Plant built | −5 |
| Extractor built | −2 |
| Manufacturing built | +3 |
| Farm built | +2 |
| National CO₂ decreased from last cycle | +3 |
| National CO₂ increased from last cycle | −3 |
| Voted YES on emission limits at summit | +5 |
| Voted NO on emission limits at summit | −4 |
| Global temperature crossed a threshold | −3 |

Satisfaction clamped to 0–100.

---

## Happiness Impact

Faction satisfaction feeds into national happiness:

```
faction_happiness_modifier = (brown% × brown_satisfaction + green% × green_satisfaction) / 100
```

This modifier is added during the happiness update step (step 11 of cycle processing).

### What this means in practice

**OPEC** at 90% brown: brown satisfaction dominates. Building green tanks their happiness because the huge brown faction is furious. They're locked into fossil unless they gradually shift the ratio by building green infrastructure (each green building shrinks brown% slightly).

**EU** at 30% brown: green satisfaction dominates. Building fossil causes backlash from the 70% green majority. EU is politically rewarded for going clean.

**China** at 50/50: every decision matters equally from both sides. Most politically volatile. Building fossil satisfies half, angers half. Building green does the reverse. Must balance or accept one faction's anger. Mirrors China's real political tension between growth and sustainability.

---

## Dynamic Shift Examples

### OPEC tries to go green

Start: 9 brown / 1 green = **90% / 10%**

| Action | New brown | New green | Brown% | Green% |
|--------|-----------|-----------|--------|--------|
| Build 1 Green Plant | 9 | 2 | 82% | 18% |
| Build 2 Green Plants | 9 | 3 | 75% | 25% |
| Build 3 Green Plants | 9 | 4 | 69% | 31% |
| Build 3 Green + 1 Manufacturing | 9 | 5 | 64% | 36% |

Even after 4 green buildings, OPEC is still 64% brown. The legacy economy is heavy. But brown satisfaction is dropping each time they build green (−3 per green plant = −12 total). If brown satisfaction hits 30, that 64% brown faction drags happiness down hard.

**This is OPEC's real dilemma**: transition slowly and keep brown faction happy, or transition fast and face domestic unrest from the majority faction.

### EU doubles down on green

Start: 3 brown / 7 green = **30% / 70%**

| Action | New brown | New green | Brown% | Green% |
|--------|-----------|-----------|--------|--------|
| Build 2 Green Plants | 3 | 9 | 25% | 75% |
| Build 2 Green + 1 Mfg | 3 | 10 | 23% | 77% |

EU barely changes. Already green-dominant. Brown faction is small and shrinking. Political freedom to go full green.

But if EU builds fossil under economic pressure:

| Action | New brown | New green | Brown% | Green% |
|--------|-----------|-----------|--------|--------|
| Build 2 Fossil Plants | 5 | 7 | 42% | 58% |

Brown faction jumps from 30% to 42%. Green faction still majority but much weaker. Green satisfaction drops (−5 per fossil = −10). This is the real-world EU tension: economic crisis pushes fossil investment, green base pushes back.

### China — the swing state

Start: 5 brown / 5 green = **50% / 50%**

Every single building tips the balance. Build one fossil plant → 55% brown. Build one green plant → 55% green. China has the most agency but also the most political risk. Neither faction can be ignored.

---

## Integration with Cycle Processing

Add after step 11 (happiness update) in the 14-step cycle:

**Step 11b. Faction happiness modifier**
1. Recalculate brown% and green% from legacy weights + current buildings
2. Update brown_satisfaction and green_satisfaction based on this cycle's events
3. Compute `modifier = (brown% × brown_satisfaction + green% × green_satisfaction) / 100`
4. Apply: `happiness += (modifier - 60)` (60 is neutral baseline — above 60 is bonus, below is penalty)

The `- 60` centers it: if both factions are at default satisfaction (60), modifier = 60, net effect = 0. If factions are unhappy (average below 60), happiness drops. If satisfied (above 60), happiness rises.

---

## Why This Model (Academic Grounding)

The CEPR finding (Mezzanotti & Starkman, DP20578) shows empirically that **local economic structure predicts climate policy support**. Districts with more green establishments vote for climate legislation; districts with more brown establishments vote against it. This isn't about ideology — it's about jobs and economic self-interest.

Our game operationalizes this: your buildings ARE your economic structure. Build fossil infrastructure → your domestic politics shifts brown → harder to pass carbon taxes or support summit resolutions. Build green infrastructure → politics shifts green → easier to go clean but harder to justify fossil expansion.

This creates a **path dependency** that mirrors real-world energy transition politics:
- Countries locked into fossil infrastructure face domestic political resistance to change (OPEC, Russia)
- Countries that invested early in green have political momentum to continue (EU, LatAm)
- Countries at the crossroads face the hardest political choices (China, India, Africa)

### Sources

- IEA World Energy Employment 2024 — clean vs fossil workforce share by region
- IRENA/ILO Renewable Energy and Jobs 2024 — 16.2M global renewable jobs, country breakdown
- World Bank Oil Rents (% of GDP) — Saudi Arabia 23.7%, Russia 9.7%
- CEPR DP20578 — green/brown establishment ratio predicts climate policy voting
- CEPR VoxEU — "Political economy of climate policy: Evidence from the American Clean Energy and Security Act"
