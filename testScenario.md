# Test Scenario — Cycle 15 Mid-Game State

Load this state when `/test` is visited. Bypasses normal game start and drops all players into a messy, realistic mid-game.

---

## Global State

```typescript
const testState = {
  cycle: 15,
  globalTemperature: 1.72,  // just past +1.5 threshold — happiness penalty kicking in
  totalHistoricalCo2: 720,
  activeSummitResolutions: [
    {
      id: "res-1",
      cycle: 12,
      boundaryType: "temperature",
      threshold: 1.5,
      description: "Carbon tax floor ≥ 20 for all countries",
      targetCountries: "all",
      votes: { usa: "NO", eu: "YES", russia: "NO", china: "ABSTAIN", india: "YES", opec: "NO", latam: "YES", africa: "YES" },
      passed: true,  // 4 YES vs 3 NO (abstain excluded)
      active: true,
      complianceDeadline: 14  // already past — non-compliant countries taking penalties
    },
    {
      id: "res-2",
      cycle: 14,
      boundaryType: "inequality",
      threshold: null,
      description: "Countries with money > 300 must contribute 15 money/cycle to Climate Finance or transfer 10 tech",
      targetCountries: ["usa", "china"],
      votes: { usa: "NO", eu: "YES", russia: "ABSTAIN", china: "NO", india: "YES", opec: "ABSTAIN", latam: "YES", africa: "YES" },
      passed: true,  // 4 YES vs 2 NO
      active: true,
      complianceDeadline: 16
    }
  ]
};
```

---

## Country States

### USA

```typescript
usa: {
  population: 41,       // grew from 33 — built 2 cities
  money: 312,
  energy: 58,
  food: 22,             // tight — 2 cities drain 40 food/cycle
  happiness: 59,        // concerned range — temp penalty + brown faction anger from res-1
  co2ThisCycle: 114,
  technology: 18,
  
  // Materials stockpile
  fuel: 12,
  uranium: 3,
  rareEarth: 0,
  
  // Carbon tax
  carbonTaxRate: 10,          // below res-1 floor of 20 — NON-COMPLIANT
  carbonTaxRecycling: "dividend",
  greenSubsidyPool: 0,
  climateFinanceGiven: 0,     // also non-compliant with res-2
  
  // Factions (legacy 6B/4G + buildings)
  // Buildings: 2 fossil(B), 1 industrial(B), 1 extractor(B) = 4 brown
  //            1 green(G), 1 manufacturing(G), 2 farm(G) = 4 green
  //            2 city(N), 1 hub(N) = 1.5 each
  // brown% = (6+4) / (6+4+13) = 43%   green% = (4+4+1.5) / 23 = 57% -- shifted greener
  brownSatisfaction: 42,   // angry — green plant built, res-1 pressure
  greenSatisfaction: 55,   // meh — tax too low, still fossil heavy
  
  buildings: [
    { type: "fossil_plant", tier: 2, location: "hex_usa_12", active: true },
    { type: "fossil_plant", tier: 1, location: "hex_usa_08", active: true },
    { type: "green_plant", tier: 1, location: "hex_usa_15", active: true },
    { type: "industrial_complex", tier: 2, location: "hex_usa_03", active: true },
    { type: "manufacturing", tier: 1, location: "hex_usa_22", active: true },
    { type: "city", tier: 2, location: "hex_usa_05", active: true },
    { type: "city", tier: 1, location: "hex_usa_18", active: true },
    { type: "farm", tier: 2, location: "hex_usa_ag1", active: true },
    { type: "farm", tier: 1, location: "hex_usa_ag2", active: true },
    { type: "extractor", tier: 2, location: "hex_usa_fuel1", active: true },  // fuel
    { type: "transport_hub", tier: 2, location: "hex_usa_coast1", active: true }
  ],
  // Workforce: 10+10+8+20+15+10+10+5+5+5+6 = 104. Pop 41 (=410 units). OK.
  // Energy: 2 fossil (65+40=105) + 1 green (25) - industrial (-25) - manufacturing (-10) - percap (8) = +87 net → stockpile OK
  // Food: 2 farms (55+30=85) - 2 cities (-20-40=-60) - percap (12) = +13 net → tight but positive
  // Money: industrial (+65) + cities (15+30=45) - green upkeep (-5) - mfg (-5) - extractor (-5) - hub (-18) - percap (4) = +73/cycle
  // CO2: fossil (45+30) + industrial (12) + city (8+5) + mfg (5) + extractor (4) + green (0) = 109 + transport
}
```

### EU

```typescript
eu: {
  population: 28,       // grew from 22
  money: 185,
  energy: 14,            // very tight — no fossil, relying on nuclear + green + imports
  food: 18,
  happiness: 65,         // decent — green faction happy, but temp penalty hurts
  co2ThisCycle: 28,
  technology: 42,        // tech leader — 2 manufacturing + rare earth imports
  
  fuel: 0,               // no fossil infrastructure
  uranium: 2,
  rareEarth: 1,          // imported from China
  
  carbonTaxRate: 45,     // compliant with res-1, green faction loves it
  carbonTaxRecycling: "subsidy",
  greenSubsidyPool: 38,
  climateFinanceGiven: 0,
  
  brownSatisfaction: 35,
  greenSatisfaction: 78,
  
  buildings: [
    { type: "nuclear_plant", tier: 2, location: "hex_eu_04", active: true },
    { type: "green_plant", tier: 2, location: "hex_eu_11", active: true },
    { type: "green_plant", tier: 1, location: "hex_eu_16", active: true },
    { type: "manufacturing", tier: 2, location: "hex_eu_02", active: true },
    { type: "manufacturing", tier: 1, location: "hex_eu_19", active: true },
    { type: "city", tier: 1, location: "hex_eu_07", active: true },
    { type: "farm", tier: 2, location: "hex_eu_ag1", active: true },
    { type: "farm", tier: 1, location: "hex_eu_ag2", active: true },
    { type: "extractor", tier: 1, location: "hex_eu_uran1", active: true },  // uranium
    { type: "transport_hub", tier: 3, location: "hex_eu_coast1", active: true }
  ],
  // Energy: nuclear (90) + green (45+25=70) - mfg (-10-18=-28) - percap (6) = ~+126 gross but hub/city drain
  // Food: farms (55+30=85) - city (-20) - percap (8) = +57 → comfortable
  // CO2: nuclear (0) + green (0) + mfg (8+5=13) + city (5) + extractor (3) = 21 + transport ~7
  // Tech: 2 mfg (8+5=13) + rare earth bonus on T2 (+4) = ~17/cycle → tech powerhouse
}
```

### Russia

```typescript
russia: {
  population: 20,        // slow growth from 18
  money: 142,
  energy: 88,             // energy surplus — fossil powerhouse
  food: 11,               // tight — no investment in farms
  happiness: 54,          // concerned — temp penalty, low food anxiety
  co2ThisCycle: 152,      // heavy emitter
  technology: 8,
  
  fuel: 24,               // massive stockpile
  uranium: 6,
  rareEarth: 2,
  
  carbonTaxRate: 0,       // NON-COMPLIANT with res-1. Refuses to tax fossil.
  carbonTaxRecycling: "dividend",
  greenSubsidyPool: 0,
  climateFinanceGiven: 0,
  
  brownSatisfaction: 72,  // brown faction thriving
  greenSatisfaction: 25,  // green faction miserable
  
  buildings: [
    { type: "fossil_plant", tier: 3, location: "hex_ru_01", active: true },
    { type: "fossil_plant", tier: 2, location: "hex_ru_09", active: true },
    { type: "fossil_plant", tier: 1, location: "hex_ru_14", active: true },
    { type: "industrial_complex", tier: 2, location: "hex_ru_03", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_ru_20", active: true },
    { type: "city", tier: 1, location: "hex_ru_06", active: true },
    { type: "farm", tier: 1, location: "hex_ru_ag1", active: true },
    { type: "extractor", tier: 2, location: "hex_ru_fuel1", active: true },   // fuel
    { type: "extractor", tier: 2, location: "hex_ru_fuel2", active: true },   // fuel
    { type: "extractor", tier: 1, location: "hex_ru_uran1", active: true },   // uranium
    { type: "transport_hub", tier: 2, location: "hex_ru_coast1", active: true }
  ],
  // Energy: 3 fossil (90+65+40=195) - 2 industrial (-15-25=-40) - percap (4) = +151 → huge surplus for export
  // Food: 1 farm (30) - city (-20) - percap (6) = +4 → barely surviving
  // CO2: 3 fossil (55+45+30=130) + 2 industrial (12+8=20) + city (5) + 3 extractors = ~162
  // Money: 2 industrial (65+35=100) + city (15) - extractors (-5-5-3=-13) - hub (-18) - percap (2) = +82
}
```

### China

```typescript
china: {
  population: 102,       // grew from 90
  money: 245,
  energy: 38,             // tight for this population
  food: 15,               // CRITICAL — huge pop drain
  happiness: 52,          // barely above concerned/unrest boundary
  co2ThisCycle: 168,
  technology: 35,
  
  fuel: 8,
  uranium: 0,
  rareEarth: 14,          // monopoly holder
  
  carbonTaxRate: 15,      // below res-1 floor — NON-COMPLIANT
  carbonTaxRecycling: "subsidy",
  greenSubsidyPool: 22,
  climateFinanceGiven: 0,  // non-compliant with res-2 (money > 300 target, currently 245 so borderline)
  
  brownSatisfaction: 48,
  greenSatisfaction: 47,   // 50/50 split — politically volatile
  
  buildings: [
    { type: "fossil_plant", tier: 2, location: "hex_cn_02", active: true },
    { type: "fossil_plant", tier: 1, location: "hex_cn_18", active: true },
    { type: "green_plant", tier: 1, location: "hex_cn_12", active: true },
    { type: "industrial_complex", tier: 2, location: "hex_cn_04", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_cn_21", active: true },
    { type: "manufacturing", tier: 2, location: "hex_cn_06", active: true },
    { type: "manufacturing", tier: 1, location: "hex_cn_15", active: true },
    { type: "city", tier: 2, location: "hex_cn_01", active: true },
    { type: "city", tier: 1, location: "hex_cn_10", active: true },
    { type: "farm", tier: 2, location: "hex_cn_ag1", active: true },
    { type: "farm", tier: 2, location: "hex_cn_ag2", active: true },
    { type: "farm", tier: 1, location: "hex_cn_ag3", active: true },
    { type: "extractor", tier: 2, location: "hex_cn_re1", active: true },    // rare earth
    { type: "extractor", tier: 1, location: "hex_cn_fuel1", active: true },  // fuel
    { type: "transport_hub", tier: 3, location: "hex_cn_coast1", active: true }
  ],
  // Pop drain: 102 pop → 31 food, 20 energy, 10 money per cycle
  // Food: 3 farms (55+55+30=140) - 2 cities (-40-20=-60) - percap (31) = +49 → OK with farms but one bad event away
  // Energy: fossil (65+40=105) + green (25) - 2 industrial (-25-15=-40) - 2 mfg (-18-10=-28) - percap (20) = +42
  // CO2: fossil (45+30=75) + industrial (12+8=20) + mfg (8+5=13) + cities (8+5=13) + extractors ~8 = ~129 + transport
  // Tech: 2 mfg (8+5=13) + rare earth on T2 (+4) = 17/cycle → good tech output
}
```

### India

```typescript
india: {
  population: 96,        // grew from 88
  money: 62,              // still poor
  energy: 8,              // CRITICAL — barely any
  food: 9,                // CRITICAL — massive pop drain
  happiness: 44,          // UNREST — city yields halved
  co2ThisCycle: 38,
  technology: 12,
  
  fuel: 2,
  uranium: 0,
  rareEarth: 0,
  
  carbonTaxRate: 25,      // compliant with res-1
  carbonTaxRecycling: "dividend",
  greenSubsidyPool: 0,
  climateFinanceGiven: 0,  // recipient, not contributor
  
  brownSatisfaction: 38,
  greenSatisfaction: 58,
  
  buildings: [
    { type: "fossil_plant", tier: 1, location: "hex_in_03", active: true },
    { type: "green_plant", tier: 1, location: "hex_in_desert1", active: true },  // +30% on desert
    { type: "green_plant", tier: 1, location: "hex_in_11", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_in_05", active: true },
    { type: "manufacturing", tier: 1, location: "hex_in_14", active: true },
    { type: "city", tier: 1, location: "hex_in_01", active: true },
    { type: "farm", tier: 2, location: "hex_in_ag1", active: true },
    { type: "farm", tier: 1, location: "hex_in_ag2", active: true },
    { type: "farm", tier: 1, location: "hex_in_ag3", active: true },
    { type: "extractor", tier: 1, location: "hex_in_fuel1", active: true },
    { type: "transport_hub", tier: 1, location: "hex_in_07", active: true }
  ],
  // Pop drain: 96 → 29 food, 19 energy, 10 money
  // Food: 3 farms (55+30+30=115) - city (-20) - percap (29) = +66 → actually OK on food
  // Energy: fossil (40) + 2 green (32+25=57) - industrial (-15) - mfg (-10) - percap (19) = +53 → wait that's fine
  // Hmm, India should be tighter. Let me adjust — India's problem is money and tech, not raw resources.
  // Money: industrial (+35) + city (+15) - green upkeep (-5-5=-10) - mfg (-5) - extractor (-3) - hub (-10) - percap (10) = +12/cycle → very slow growth
  // CO2: fossil (30) + industrial (8) + city (5) + mfg (5) + extractor (3) = 51... adjusted down since green is dominant
  // In unrest: city yield halved → only +20 pop instead of +40. Growth stalled.
}
```

### OPEC

```typescript
opec: {
  population: 30,        // slow growth from 28
  money: 198,
  energy: 124,            // energy king
  food: 4,                // CRITICAL — almost no farms, desert terrain
  happiness: 61,          // concerned — brown faction propping up, but food anxiety
  co2ThisCycle: 195,      // worst emitter per capita
  technology: 3,          // almost none — no manufacturing
  
  fuel: 38,               // swimming in it
  uranium: 0,
  rareEarth: 0,
  
  carbonTaxRate: 0,       // NON-COMPLIANT with res-1. Will never tax fossil voluntarily.
  carbonTaxRecycling: "dividend",
  greenSubsidyPool: 0,
  climateFinanceGiven: 0,
  
  brownSatisfaction: 78,  // brown faction ecstatic
  greenSatisfaction: 15,  // green faction crushed
  
  buildings: [
    { type: "fossil_plant", tier: 3, location: "hex_op_01", active: true },
    { type: "fossil_plant", tier: 2, location: "hex_op_08", active: true },
    { type: "fossil_plant", tier: 2, location: "hex_op_13", active: true },
    { type: "industrial_complex", tier: 2, location: "hex_op_03", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_op_17", active: true },
    { type: "city", tier: 1, location: "hex_op_05", active: true },
    { type: "extractor", tier: 3, location: "hex_op_fuel1", active: true },   // fuel
    { type: "extractor", tier: 2, location: "hex_op_fuel2", active: true },   // fuel
    { type: "extractor", tier: 2, location: "hex_op_fuel3", active: true },   // fuel
    { type: "transport_hub", tier: 2, location: "hex_op_coast1", active: true }
  ],
  // Energy: 3 fossil (90+65+65=220) - 2 industrial (-25-15=-40) - percap (6) = +174 → massive surplus
  // Food: 0 farms - city (-20) - percap (9) = -29/cycle → IMPORTING ALL FOOD
  // CO2: 3 fossil (55+45+45=145) + 2 industrial (12+8=20) + city (5) + 3 extractors (5+4+4=13) = 183 + transport
  // Money: 2 industrial (65+35=100) + city (15) - 3 extractors (-8-5-5=-18) - hub (-18) - percap (3) = +76
  // OPEC's crisis: food. Must import from LatAm or starve. This gives LatAm enormous leverage.
}
```

### LatAm

```typescript
latam: {
  population: 58,        // grew from 52
  money: 78,
  energy: 20,             // modest
  food: 82,               // FOOD SURPLUS — geopolitical leverage
  happiness: 63,          // decent
  co2ThisCycle: 22,
  technology: 15,
  
  fuel: 3,
  uranium: 4,
  rareEarth: 2,
  
  carbonTaxRate: 20,      // exactly at res-1 floor — compliant
  carbonTaxRecycling: "finance",
  greenSubsidyPool: 0,
  climateFinanceGiven: 18,  // has been contributing
  
  brownSatisfaction: 45,
  greenSatisfaction: 65,
  
  buildings: [
    { type: "fossil_plant", tier: 1, location: "hex_la_09", active: true },
    { type: "green_plant", tier: 1, location: "hex_la_04", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_la_02", active: true },
    { type: "manufacturing", tier: 1, location: "hex_la_12", active: true },
    { type: "city", tier: 1, location: "hex_la_01", active: true },
    { type: "farm", tier: 2, location: "hex_la_ag1", active: true },
    { type: "farm", tier: 2, location: "hex_la_ag2", active: true },
    { type: "farm", tier: 1, location: "hex_la_ag3", active: true },
    { type: "farm", tier: 1, location: "hex_la_ag4", active: true },
    { type: "extractor", tier: 1, location: "hex_la_uran1", active: true },  // uranium
    { type: "extractor", tier: 1, location: "hex_la_re1", active: true },    // rare earth
    { type: "transport_hub", tier: 2, location: "hex_la_coast1", active: true }
  ],
  // Food: 4 farms (55+55+30+30=170) - city (-20) - percap (17) = +133 → massive surplus for export
  // Energy: fossil (40) + green (25) - industrial (-15) - mfg (-10) - percap (12) = +28
  // CO2: fossil (30) + industrial (8) + city (5) + mfg (5) + 2 extractors (3+3=6) = 57... too high for their profile
  // Adjusted: most buildings are green/farm. Real CO2 ~22
}
```

### Africa

```typescript
africa: {
  population: 88,        // grew from 82
  money: 34,              // still very poor
  energy: 6,              // CRITICAL
  food: 5,                // CRITICAL — huge pop, not enough farms
  happiness: 38,          // UNREST — city yields halved, approaching crisis
  co2ThisCycle: 18,
  technology: 8,
  
  fuel: 5,
  uranium: 3,
  rareEarth: 8,           // mineral rich — second to China
  
  carbonTaxRate: 10,      // below res-1 floor but too poor to comply
  carbonTaxRecycling: "dividend",
  greenSubsidyPool: 0,
  climateFinanceGiven: 0,  // recipient
  
  brownSatisfaction: 40,
  greenSatisfaction: 42,  // both factions unhappy — everything is scarce
  
  buildings: [
    { type: "fossil_plant", tier: 1, location: "hex_af_03", active: true },
    { type: "green_plant", tier: 1, location: "hex_af_desert1", active: true },
    { type: "industrial_complex", tier: 1, location: "hex_af_05", active: true },
    { type: "city", tier: 1, location: "hex_af_01", active: true },
    { type: "farm", tier: 1, location: "hex_af_ag1", active: true },
    { type: "farm", tier: 1, location: "hex_af_ag2", active: true },
    { type: "extractor", tier: 2, location: "hex_af_re1", active: true },    // rare earth
    { type: "extractor", tier: 1, location: "hex_af_re2", active: true },    // rare earth
    { type: "extractor", tier: 1, location: "hex_af_fuel1", active: true },  // fuel
    { type: "transport_hub", tier: 1, location: "hex_af_07", active: true }
  ],
  // Pop drain: 88 → 26 food, 18 energy, 9 money
  // Food: 2 farms (30+30=60) - city (-20) - percap (26) = +14 → barely surviving
  // Energy: fossil (40) + green (25) - industrial (-15) - percap (18) = +32... too high
  // Adjusted: Africa's real problem is everything is T1, pop is huge. Energy after all drains ~6 stockpile
  // In unrest: city yields halved. Growth slowing. Needs aid urgently.
  // Africa's leverage: rare earth exports. China and EU both want them.
}
```

---

## Relations Matrix (cycle 15)

Values diverged from starting 50 due to trades, votes, transit, and summit events.

|          | USA | EU  | Russia | China | India | OPEC | LatAm | Africa |
|----------|-----|-----|--------|-------|-------|------|-------|--------|
| **USA**  | —   | 62  | 38     | 42    | 35    | 55   | 58    | 40     |
| **EU**   | 62  | —   | 34     | 56    | 68    | 28   | 65    | 72     |
| **Russia** | 38 | 34 | —      | 64    | 44    | 68   | 42    | 45     |
| **China** | 42 | 56 | 64     | —     | 52    | 58   | 48    | 60     |
| **India** | 35 | 68 | 44     | 52    | —     | 40   | 62    | 65     |
| **OPEC** | 55 | 28 | 68     | 58    | 40    | —    | 52    | 48     |
| **LatAm** | 58 | 65 | 42     | 48    | 62    | 52   | —     | 58     |
| **Africa** | 40 | 72 | 45    | 60    | 65    | 48   | 58    | —      |

### Key Relationships

- **EU ↔ Africa (72):** EU sends tech + climate finance → Africa exports rare earth. Strong partnership.
- **Russia ↔ OPEC (68):** fossil bloc alliance. Both voted NO on res-1. Energy exporters stick together.
- **Russia ↔ China (64):** fuel trade. Russia exports fuel, China pays money.
- **EU ↔ India (68):** EU sends tech, India provides political support at summits (both voted YES on res-1).
- **EU ↔ OPEC (28):** near hostile. Opposite on every summit vote. EU pushing green transition threatens OPEC's economy.
- **USA ↔ India (35):** strained. USA voted NO on climate measures India championed. Trade proposal rejections.
- **EU ↔ Russia (34):** strained. Opposite summit votes. EU tried to pressure Russia on emissions. Transit disputes.

---

## Active Trades

```typescript
const activeTrades = [
  // Russia → EU: fuel for money (EU's nuclear needs uranium but also buys fuel as buffer)
  {
    id: "trade-1",
    sender: "russia",
    receiver: "eu",
    senderGives: { fuel: 3 },
    receiverGives: { money: 25 },
    type: "continuous",
    startedCycle: 6,
    route: "land",
    transitCountry: null  // direct border
  },
  
  // LatAm → OPEC: food for money (OPEC's lifeline)
  {
    id: "trade-2",
    sender: "latam",
    receiver: "opec",
    senderGives: { food: 20 },
    receiverGives: { money: 18 },
    type: "continuous",
    startedCycle: 4,
    route: "sea",
    transitCountry: null
  },
  
  // China → EU: rare earth for technology
  {
    id: "trade-3",
    sender: "china",
    receiver: "eu",
    senderGives: { rareEarth: 2 },
    receiverGives: { technology: 8 },
    type: "continuous",
    startedCycle: 8,
    route: "air",
    transitCountry: null
  },
  
  // Russia → China: fuel for money
  {
    id: "trade-4",
    sender: "russia",
    receiver: "china",
    senderGives: { fuel: 4 },
    receiverGives: { money: 30 },
    type: "continuous",
    startedCycle: 3,
    route: "land",
    transitCountry: null  // direct border
  },
  
  // LatAm → India: food for population (immigration deal)
  {
    id: "trade-5",
    sender: "latam",
    receiver: "india",
    senderGives: { food: 15 },
    receiverGives: { population: 5 },
    type: "continuous",
    startedCycle: 10,
    route: "sea",  // no land route LatAm→India
    transitCountry: null
  },
  
  // Africa → China: rare earth for money
  {
    id: "trade-6",
    sender: "africa",
    receiver: "china",
    senderGives: { rareEarth: 3 },
    receiverGives: { money: 20 },
    type: "continuous",
    startedCycle: 7,
    route: "land",
    transitCountry: "opec"  // Africa→OPEC→China
  },
  
  // EU → Africa: technology for rare earth
  {
    id: "trade-7",
    sender: "eu",
    receiver: "africa",
    senderGives: { technology: 5 },
    receiverGives: { rareEarth: 2 },
    type: "continuous",
    startedCycle: 9,
    route: "land",
    transitCountry: null  // direct border
  },
  
  // USA → LatAm: money for food
  {
    id: "trade-8",
    sender: "usa",
    receiver: "latam",
    senderGives: { money: 12 },
    receiverGives: { food: 10 },
    type: "continuous",
    startedCycle: 11,
    route: "land",
    transitCountry: null  // direct border
  },
  
  // OPEC → India: energy for money (India's energy lifeline)
  {
    id: "trade-9",
    sender: "opec",
    receiver: "india",
    senderGives: { energy: 15 },
    receiverGives: { money: 12 },
    type: "continuous",
    startedCycle: 5,
    route: "land",
    transitCountry: null  // direct border
  }
];
```

---

## Transit Agreements

```typescript
const transitAgreements = [
  // OPEC allows Africa→China land route (trade-6)
  {
    transitCountry: "opec",
    traders: ["africa", "china"],
    feeType: "commission",
    feeValue: 10,  // 10% of trade value
    approvedCycle: 7
  }
];
```

---

## Cycle-by-Cycle Summary (how we got here)

| Cycle | Key Events |
|-------|-----------|
| 1–3 | Everyone builds basic infrastructure. Russia/OPEC go heavy fossil. EU starts manufacturing. |
| 4 | OPEC runs out of starting food, begins importing from LatAm (trade-2). LatAm gains leverage. |
| 5 | OPEC→India energy trade begins. India stabilizes energy. |
| 6 | Russia→EU fuel trade. EU uses it as buffer while building nuclear. |
| 7 | Africa→China rare earth trade via OPEC transit. China's tech output jumps. |
| 8 | China→EU rare earth for tech. EU becomes tech leader. Temperature hits +1.4°C. |
| 9 | EU→Africa tech trade. Africa starts getting development aid. |
| 10 | India enters unrest (happiness 48). LatAm sends food for workers. Temperature hits +1.5°C. |
| 11 | USA→LatAm food trade. USA food getting tight from 2 cities. |
| 12 | **Summit: Temperature boundary triggered.** Carbon tax floor ≥ 20 passes (4-3). USA, Russia, OPEC vote NO. Relations shift. |
| 13 | EU raises tax to 45. Russia and OPEC refuse. Non-compliance penalties start hitting. |
| 14 | **Summit: Inequality boundary triggered.** USA/China money gap vs Africa. Resolution passes. Africa's happiness drops to 38 (unrest). |
| 15 | **Current state.** Temperature at 1.72°C. India in unrest. Africa approaching crisis. OPEC fully food-dependent on LatAm. EU leading green transition. Russia/OPEC forming fossil resistance bloc. |

---

## Pressure Points (what makes this state interesting)

1. **OPEC food dependency:** If LatAm cancels trade-2, OPEC starves within 1 cycle. LatAm has enormous leverage. OPEC must keep LatAm happy or find another food source.

2. **India in unrest:** Happiness at 44 means city yields halved. Population growth stalled. Needs tech for green transition but can't afford it. Depends on OPEC energy and LatAm food.

3. **Africa near crisis:** Happiness at 38, approaching 30 (crisis = all buildings idle). Mineral-rich but capital-poor. EU and China competing for rare earth access. If Africa hits crisis, rare earth supply disrupts both.

4. **USA non-compliance:** Tax at 10 vs floor of 20. Every YES-voter (EU, India, LatAm, Africa) loses −4 relations with USA per cycle. USA becoming diplomatically isolated. Also targeted by inequality resolution.

5. **Russia fossil trap:** 3 fossil plants, zero green infrastructure, zero tech. Highest energy surplus but CO₂ at 152 and rising. When temperature hits +2.0°C, the −5 happiness penalty hits everyone and Russia gets blamed. No manufacturing means can't build green without importing tech.

6. **EU tech monopoly:** Only country with surplus technology. Everyone needs tech to go green. EU can demand political concessions — vote YES on resolutions or no tech exports.

7. **Temperature trajectory:** At 1.72°C and ~720 total CO₂/cycle globally, temperature rises ~0.72°C per cycle. Will hit +2.0°C around cycle 19. Farm yields drop 20% at +2.0°C. China/India/Africa food crisis incoming.

8. **Fossil bloc vs green bloc:** Russia+OPEC (+ sometimes USA) vote NO on everything. EU+India+LatAm+Africa vote YES. China is the swing vote. Whoever convinces China wins summits.

---

## Loading Instructions

In `App.tsx` or router config:

```tsx
// Route: /test
import testScenario from './data/testScenario';

if (window.location.pathname === '/test') {
  // Load testScenario as initial GameState instead of regionProfiles defaults
  // Skip cycle 1–14 processing
  // Set cycle counter to 15
  // Begin normal cycle processing from cycle 15
}
```

The JSON version of this state should live in `src/data/testScenario.ts` as a typed `GameState` export. Convert the values above into the actual TypeScript interfaces used in the codebase.
