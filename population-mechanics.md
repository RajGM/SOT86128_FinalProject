# Population Mechanics — v2

## Current State (what exists)

- Population is a number that goes up when cities/villages produce it
- Population gates workforce (buildings idle if workers < demand)
- Population itself consumes nothing — 1400 people (China) cost zero food/energy/money
- Happiness only drops from food/energy shortage (−15) and low happiness causes 5% population loss
- CO₂ and temperature have zero direct effect on happiness
- No per-capita resource drain at all

**Result:** Population is free to grow infinitely. No reason NOT to build cities. No climate pressure on citizens. Completely disconnected from the environmental politics the game is about.

---

## New Mechanics

### 1. Per-Capita Consumption

Every unit of population consumes resources each cycle, independent of buildings.

| Resource | Per 100 population/cycle | Notes |
|----------|------------------------|-------|
| Food | 3 | People eat. More people = more food needed. |
| Energy | 2 | Heating, transport, daily life. |
| Money | 1 | Public services, infrastructure maintenance. |

**Example:** China with 1400 population consumes 42 food, 28 energy, 14 money per cycle JUST for existing people — before any building costs.

This means:
- Growing population is no longer free. Every new person is a mouth to feed.
- Large-population countries (China, India, Africa) start with a built-in resource drain
- You must build farms and energy plants just to sustain what you have, before you can grow
- Trading population (immigration) transfers this burden to the receiving country

### 2. CO₂ & Temperature → Happiness

High emissions and rising temperature directly reduce happiness. People don't like living in a polluted, warming world.

#### National CO₂ → Happiness

Your own country's emissions affect your own citizens' mood.

| Country CO₂ level | Happiness effect/cycle |
|-------------------|----------------------|
| < 100 | +2 (citizens proud of clean record) |
| 100–300 | 0 (normal) |
| 300–500 | −3 (pollution concerns) |
| > 500 | −6 (health problems, protests) |

This punishes heavy emitters domestically. USA starts at CO₂=520 → immediate −6 happiness/cycle unless they cut emissions.

#### Global Temperature → Happiness (everyone suffers)

| Global temp | Happiness effect/cycle (all countries) |
|-------------|--------------------------------------|
| < +1.5°C | 0 |
| +1.5°C to +2.0°C | −2 |
| +2.0°C to +2.5°C | −5 |
| +2.5°C to +3.0°C | −8 |
| > +3.0°C | −12 (catastrophic) |

This is the collective punishment. Even if YOUR country is clean, if the world's temperature rises, YOUR citizens suffer. Floods, heatwaves, climate anxiety — everyone pays.

**Combined effect example:**
- India: CO₂=120 (0 penalty) + global temp at +2.3°C (−5) = −5 happiness/cycle. India is clean but suffers from others' pollution. **Climate injustice as a game mechanic.**
- USA: CO₂=520 (−6 penalty) + global temp at +2.3°C (−5) = −11 happiness/cycle. Double hit — both polluter and victim.

### 3. Happiness Cascade

Happiness effects stack and cascade into real consequences:

| Happiness level | Effect |
|----------------|--------|
| 70+ | Stable. Population grows normally. |
| 50–70 | Concerned. No bonus, no penalty. |
| 30–50 | **Unrest.** Population growth halved (cities/villages yield 50%). |
| 15–30 | **Crisis.** Population shrinks −5%/cycle (people leave — gone, not transferred). Buildings go idle. |
| < 15 | **Collapse.** Population shrinks −10%/cycle. Random building destroyed each cycle (riots). |

### 4. Population Loss & Trade

When happiness is low, population shrinks — people simply leave (gone from the game, not transferred to anyone). This represents emigration to places outside the game world.

**Population only moves between countries via trade.** One country offers population, the other accepts. Both sides negotiate terms — "I'll send 100 workers if you give me 20 technology." This is a conscious diplomatic decision, never automatic.

Why trade-only:
- Automatic emigration would bypass the negotiation layer — the whole point of the game
- It would punish struggling countries further without giving them agency
- Real immigration requires bilateral agreements, visas, labor deals — not just people walking across borders
- The receiving country must WANT the workers (and accept their food/energy burden)

### 5. Population Segments (optional complexity — skip for v1)

If we want more depth later, population could split into:
- **Workers** — staff buildings, consume food+energy
- **Unemployed** — consume food only, reduce happiness (−1 per 50 unemployed)

For now, all population = workers. Keep it simple.

---

## Updated Cycle Processing Order

1. **Per-capita consumption** — deduct food/energy/money based on population size
2. **Workforce check** — idle newest buildings if population < demand (LIFO)
3. **Extraction** — active extractors produce materials
4. **Material consumption** — fossil consumes fuel, nuclear consumes uranium
5. **Building yields** — active buildings produce outputs
6. **Building recurring costs** — active buildings consume inputs
7. **Trade processing** — continuous trades, transit fees, transport emissions
8. **CO₂ sum** — total all country CO₂
9. **Temperature update** — global temp rises based on total CO₂
10. **Climate effects** — farm yield penalty above +2.0°C
11. **Happiness update:**
    - National CO₂ penalty (your emissions)
    - Global temperature penalty (everyone's emissions)
    - Food/energy shortage penalty (−15 if either < 0)
    - Clean record bonus (+2 if CO₂ < 100)
12. **Population effects:**
    - If happiness < 30: −5% population (gone, not transferred)
    - If happiness < 15: −10% population + random building destroyed (riots)
    - If happiness 30–50: city/village yields halved
13. **Clamp negatives** — food/energy floor at 0
14. **Advance cycle**

---

## Balance Numbers

### Starting consumption burden

| Country | Pop | Food drain/cycle | Energy drain/cycle | Money drain/cycle |
|---------|-----|-----------------|-------------------|------------------|
| USA | 330 | 10 | 7 | 3 |
| EU | 220 | 7 | 4 | 2 |
| Russia | 180 | 5 | 4 | 2 |
| China | 1400 | 42 | 28 | 14 |
| India | 1380 | 41 | 28 | 14 |
| OPEC | 280 | 8 | 6 | 3 |
| LatAm | 420 | 13 | 8 | 4 |
| Africa | 1300 | 39 | 26 | 13 |

China, India, and Africa start with massive consumption burdens. They NEED farms and energy just to survive. Rich countries (USA, EU) have small populations — easier to sustain.

### Can they sustain themselves at start?

| Country | Starting food | Pop food drain | Surplus/deficit | Cycles before famine (no farms) |
|---------|-------------|---------------|----------------|-------------------------------|
| USA | 380 | 10/cycle | +370 | 38 cycles (comfortable) |
| EU | 240 | 7/cycle | +233 | 34 cycles |
| Russia | 200 | 5/cycle | +195 | 39 cycles |
| China | 420 | 42/cycle | +378 | 9 cycles (urgent) |
| India | 320 | 41/cycle | +279 | 7 cycles (critical) |
| OPEC | 140 | 8/cycle | +132 | 17 cycles |
| LatAm | 480 | 13/cycle | +467 | 37 cycles |
| Africa | 260 | 39/cycle | +221 | 6 cycles (emergency) |

**China, India, and Africa run out of food in 6–9 cycles without building farms.** This is the pressure that makes the game work — big-population countries can't just sit there. They must act immediately.

Meanwhile USA and EU can coast for 30+ cycles. That asymmetry IS the rich-poor divide in environmental politics.

---

## Why This Matters for Gameplay

### The population trap
More people = more workers = more buildings = more output. But more people = more food/energy/money drain. Growth is a double-edged sword. You can't just spam cities.

### Climate pressure is personal
Temperature rise doesn't just hurt farms abstractly — it makes YOUR citizens unhappy. Every player feels the collective CO₂ problem in their own happiness score. The free-rider who pumps fossil gets hit twice: their own emissions penalty + the global temperature penalty.

### Immigration is always a deal
Population only moves via trade. India offers 100 workers to EU for 20 technology. EU gains workforce but also gains the food/energy burden. India loses workers (buildings may go idle) but gets tech to build green. Both sides must agree — no forced migration.

### Food exporters gain leverage
LatAm starts with 480 food and only 13/cycle drain. They have massive surplus. China needs 42/cycle and runs out in 9 cycles. LatAm can demand technology, money, or political concessions for food exports. **Food as geopolitical leverage.**

---

## What Changed

| Before | After |
|--------|-------|
| Population consumes nothing | Per-capita drain: 3 food, 2 energy, 1 money per 100 pop |
| CO₂/temp don't affect happiness | National CO₂ penalty + global temp penalty on happiness |
| Happiness only drops from shortage | Happiness affected by emissions, temperature, AND shortage |
| Low happiness → 5% pop loss | Graduated: unrest (halved growth) → crisis (−5% lost) → collapse (−10%, riots) |
| No population trade | Population tradeable — immigration deals only via negotiation |
| No urgency for big-pop countries | China/India/Africa run out of food in 6-9 cycles without farms |
