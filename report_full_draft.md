# Climate Diplomacy: A Multiplayer Simulation of Environmental Politics in International Comparison

**Module:** POL23200 — Environmental Politics in International Comparison  
**Instructor:** Prof. Dr. Miranda Schreurs  
**Institution:** Technical University of Munich, Department of Governance  
**Semester:** Summer 2026  

---

## 1. Introduction

Environmental politics is characterised by a fundamental tension: the atmosphere is a shared resource, yet the costs and benefits of climate action are distributed unevenly across nations. This paper presents *Climate Diplomacy*, a real-time multiplayer simulation game designed to make this tension interactive and experiential. The game places players in control of eight country blocs — USA, EU, Russia, China, India, OPEC, Latin America, and Africa — each with asymmetric starting conditions that mirror real-world economic structures, fossil fuel dependencies, and demographic pressures. Through gameplay, participants encounter the core dilemmas studied in comparative environmental politics: the tragedy of the commons, the free-rider problem, the gap between pioneers and laggards, and the domestic political constraints on international cooperation.

The game is not intended as a simplified model of climate negotiations. Rather, it operationalises academic frameworks from the module's curriculum — including Nordhaus's DICE model, Raworth's Doughnut Economics, Liefferink's pioneer/laggard gap approach, and Putnam's two-level games — as interactive mechanics that players must navigate simultaneously. The result is a learning tool where theoretical knowledge translates directly into strategic advantage: a player who understands the double dividend hypothesis will manage their carbon tax more effectively; a player who grasps Ostrom's polycentric governance will recognise the value of bilateral agreements alongside multilateral summits.

This report explains the design reasoning behind each major game system, identifies the academic models that ground them, and evaluates how the simulation aligns with the module's intended learning outcomes.

---

## 2. Game Overview

Climate Diplomacy is a browser-based multiplayer game built with React, TypeScript, and Firebase Realtime Database. One to eight human players each control a country bloc on a shared 60×30 hexagonal grid. Remaining countries are operated by bot AI. The game proceeds in cycles (configurable 3–10 minute turns), during which players build infrastructure, manage resources, negotiate trades, set carbon tax policy, and vote on summit resolutions. A shared global temperature rises with cumulative CO₂ emissions, creating collective consequences that no single player can escape.

The eight country blocs are initialised with asymmetric resource profiles drawn from real-world data (IEA World Energy Employment 2024; World Bank Development Indicators). The USA begins with high money and fossil infrastructure but elevated emissions. The EU has the highest technology but scarce natural resources. India and Africa have large populations but minimal capital. OPEC's economy is structurally dependent on fossil fuel extraction. These asymmetries are not arbitrary — they reproduce the structural conditions that make comparative environmental politics analytically interesting (Schreurs, 2002; Steinberg and VanDeveer, 2012).

Seven resources circulate through the economy: money, energy, food, population, happiness, CO₂, and technology. Three raw materials (fuel, uranium, rare earth) are extracted from deposit tiles and consumed by specific building types. Nine building types are available, ranging from fossil plants (cheap, high emissions) to green plants (expensive, zero emissions, requiring technology). Every building demands workers from the population pool, creating a direct link between demographic capacity and economic output.

---

## 3. Theoretical Framework and Mechanic Design

### 3.1 The Tragedy of the Commons and the Free-Rider Problem

Hardin's (1968) tragedy of the commons provides the foundational logic of the game's climate system. CO₂ emissions from each country's infrastructure accumulate into a shared global temperature variable. Temperature rises according to the formula `globalTemp += totalCycleCO₂ × 0.001`, affecting all countries equally through happiness penalties and farm yield reductions above +2.0°C. The atmosphere is the commons: each player benefits individually from cheap fossil energy but imposes costs collectively through warming.

Olson's (1965) analysis of collective action and free-riding is operationalised through the asymmetry between emission costs and climate benefits. A country that unilaterally reduces emissions bears the full economic cost (replacing fossil infrastructure with expensive green alternatives) but receives only one-eighth of the climate benefit (shared among all countries). This creates a rational incentive to free-ride — to let others bear the transition cost while continuing to benefit from a stabilised climate. The game makes this incentive visceral: players who invest heavily in green infrastructure often watch their happiness scores drop (due to economic strain) while fossil-heavy players coast on cheap energy.

The design deliberately avoids resolving this dilemma mechanically. There is no global authority that can force emission reductions. The only instruments available are diplomatic: trade leverage, summit resolutions, and the reputational pressure of the comparison dashboard. Whether players overcome the collective action problem depends entirely on their negotiations — mirroring the structure of real international climate politics.

### 3.2 Carbon Tax and the Double Dividend Hypothesis

The carbon tax mechanic is grounded in Nordhaus's (2018) DICE model, which frames carbon pricing as an abatement cost that shifts investment incentives without directly reducing emissions. In the game, each country sets a carbon tax rate (0–100) that collects money proportional to national CO₂ output: `tax_collected = national_co2 × (rate / 100)`. Crucially, the tax never reduces emissions directly — the only way to cut CO₂ is to physically replace fossil buildings with green ones. The tax makes fossil infrastructure expensive enough to motivate that switch, exactly as Nordhaus's model predicts.

The revenue recycling question is drawn from Goulder's (1995) double dividend hypothesis, which asks whether carbon tax revenue can be recycled in ways that produce both environmental and economic benefits. The game offers three recycling options, each grounded in empirical literature:

**Citizen Dividend** distributes tax revenue as happiness bonuses, modelling the lump-sum transfer approach used in Canada's carbon rebate. Freire-González's (2018) meta-analysis of 69 CGE simulations and the Federal Reserve's (2021) welfare analysis both find this to be politically popular but economically least efficient — a finding the game reproduces, as the dividend offsets faction anger without accelerating green transition.

**Green Subsidy** pools revenue to reduce future green/nuclear build costs, modelling the investment-channel recycling that Freire-González identifies as most economically efficient. Players choosing this option invest in cheaper future transition at the cost of no immediate benefit.

**Climate Finance** transfers tax revenue to developing countries (India, Latin America, Africa), modelling the Cancún 2010 pledge of $100 billion per year from developed to developing nations. This creates genuine wealth transfer and improves diplomatic relations — but costs the donor domestically.

The strategic implications vary by country. OPEC (90% brown faction, economy dependent on fossil extraction) faces economic suicide from any meaningful carbon tax — reproducing the structural resistance of petrostate economies documented in the literature. The EU (70% green faction, low baseline emissions) can set high taxes at minimal cost, gaining pioneer status essentially for free. China, at 50/50 faction balance, faces the genuine political dilemma of a swing state. These dynamics emerge from the model, not from scripted outcomes.

### 3.3 Domestic Factions and Two-Level Games

Putnam's (1988) two-level game theory argues that international negotiation outcomes are constrained by domestic political feasibility. A head of state must simultaneously satisfy international partners (Level I) and domestic constituencies (Level II). An agreement that is optimal internationally may be unratifiable domestically, and vice versa.

The game operationalises this through a domestic faction system inspired by Mezzanotti and Starkman's empirical finding (CEPR DP20578) that the ratio of green to brown economic establishments in a district predicts legislative voting on climate policy. Each country has two factions — Brown (pro-fossil, pro-growth) and Green (pro-sustainability, pro-regulation) — whose proportional strength shifts dynamically based on the player's building choices. Every fossil plant built increases brown faction weight; every green plant increases green faction weight.

Faction satisfaction directly affects national happiness through a weighted formula: `faction_modifier = (brown% × brown_satisfaction + green% × green_satisfaction) / 100`. This means that OPEC, starting at 90% brown, experiences severe happiness penalties from climate-friendly policies — not because the game is scripted to punish OPEC, but because its domestic political structure (modelled on real IEA employment data) makes green transition domestically costly. Conversely, the EU at 70% green is politically rewarded for environmental leadership.

The two-level game emerges when players must negotiate at summits. A player controlling India may want to vote YES on an emissions resolution (satisfying the 60% green faction and gaining diplomatic goodwill), but the resulting carbon tax floor would strain India's limited economy. The player is simultaneously negotiating with other countries (Level I) and managing domestic faction satisfaction (Level II) — exactly the dual constraint Putnam describes.

### 3.4 Summit Resolutions and Doughnut Economics

The summit resolution system is grounded in Raworth's (2012; 2017) Doughnut Economics framework, which combines Rockström's (2009) planetary boundaries (the ecological ceiling) with a social foundation (minimum standards for human wellbeing). The "safe and just space for humanity" lies between these two boundaries — above the social floor, below the ecological ceiling.

Rather than rotating through arbitrary resolution types, summit resolutions are triggered by boundary violations detected each cycle. Five boundary conditions are monitored in priority order:

**Ecological ceiling triggers:**
1. **Temperature** — when global temperature crosses +1.5/+2.0/+2.5°C thresholds, a resolution demands minimum carbon tax floors
2. **CO₂ concentration** — when global emissions exceed threshold levels, top emitters face reduction targets

**Social floor triggers:**
3. **Human development** — when multiple countries face food/energy shortages or money deficits, surplus countries must offer trade
4. **Inequality** — when the money or technology gap between richest and poorest countries exceeds thresholds, wealthy countries must contribute finance or technology
5. **Political stability** — when average global happiness drops below critical levels, emergency aid mechanisms activate

These triggers are calibrated against Richardson et al.'s (2023) updated quantification of planetary boundaries, which found that six of nine Earth system boundaries have been crossed. The game's thresholds are set to trigger realistically during mid-game play, creating genuine decision points rather than edge cases.

Voting follows a YES/NO/ABSTAIN mechanism with simple majority (excluding abstentions). Non-compliance with passed resolutions incurs diplomatic penalties: −4 relations per cycle from YES-voters and −5 green faction satisfaction. Resolutions stack — multiple can be active simultaneously — and compliance is tracked per cycle. This creates cumulative diplomatic pressure on laggard countries, mirroring the "naming and shaming" dynamics observed in real international environmental regimes.

### 3.5 Pioneer/Laggard Comparative Analysis

The comparison dashboard implements the gap approach from Liefferink et al. (2009), a paper directly referenced in the module's reading list through Holzinger and Sommerer's (2012) work on upward spirals in environmental policy. The gap approach measures the distance between each country's current performance and the strictest policy standard available at that moment — the pioneer IS the benchmark, and it shifts dynamically as players act.

Six metrics are tracked: CO₂ per capita, green energy ratio, carbon tax level, CO₂ trend (direction of change), summit voting record, and climate finance given. Each metric is normalised to 0–1 where 0 = pioneer (best in class) and 1 = laggard (worst). The composite gap score averages all six equally, following Liefferink et al.'s approach of measuring distance from best on each dimension independently without imposing external weights.

The dashboard serves a dual purpose. During gameplay, it provides the analytical tool that environmental policy researchers use — players are literally doing comparative environmental policy analysis in real time. At game end, the composite gap score determines victory: the three countries with the lowest gap scores (closest to pioneer across all dimensions) win. This means that economic wealth alone cannot win the game. A country must demonstrate environmental leadership, policy ambition, international cooperation, and solidarity with developing nations — the same multi-dimensional performance that the EPI (Yale Environmental Performance Index) and the module's curriculum evaluate.

### 3.6 Polycentric Governance

Ostrom's (1990; 2010) theory of polycentric governance — that commons problems are best managed through multiple, overlapping layers of cooperation rather than a single global authority — is embedded in the game's architecture rather than any single mechanic. Players can cooperate through at least four distinct channels:

1. **Bilateral trade** — direct resource transfers between two countries
2. **Transit agreements** — three-party arrangements enabling land routes through intermediate countries
3. **Summit resolutions** — multilateral votes binding all countries
4. **Climate finance** — voluntary wealth transfers from developed to developing countries

No single channel is sufficient. Summit resolutions create diplomatic pressure but cannot enforce compliance. Bilateral trades solve immediate resource crises but don't address the global temperature problem. Climate finance builds goodwill but costs money. The game rewards players who engage across all layers simultaneously — the polycentric approach Ostrom advocates.

### 3.7 Distributive Conflict

Aklin and Mildenberger (2020) argue that climate politics is better characterised as distributive conflict than collective action. The challenge is not simply that countries fail to cooperate, but that climate policy creates identifiable winners and losers within and across nations. The game captures this through multiple distributional axes:

**North-South divide:** Developing countries (India, Africa) contribute least to emissions but suffer most from temperature-related happiness penalties and food insecurity — reproducing the climate justice argument that has dominated COP negotiations since Rio 1992 and the principle of Common But Differentiated Responsibilities (CBDR).

**Fossil exporters vs. importers:** OPEC and Russia face existential economic threats from green transition. Their fossil infrastructure generates the revenue that sustains their populations. A carbon tax that benefits the EU is economic suicide for OPEC. This is not a coordination failure — it is a genuine conflict of interest.

**Domestic winners and losers:** Within each country, the faction system creates groups that benefit from and are harmed by climate policy. Raising the carbon tax satisfies the green faction but angers the brown faction. The player must choose which constituency to disappoint — and live with the happiness consequences.

---

## 4. Multiplayer Design and Bot AI

The multiplayer system uses Firebase Realtime Database for state synchronisation, enabling 1–8 human players with remaining countries operated by bot AI. The design follows several principles derived from game theory:

**Information symmetry:** All game data is public. Every player can see every other country's resources, buildings, emissions, and dashboard ranking at all times. This eliminates information asymmetry as a strategic variable and focuses gameplay on negotiation and policy choice — consistent with the module's emphasis on institutional and policy analysis rather than intelligence games.

**Credible commitments:** Trade agreements are binding once accepted. A continuous trade transfers resources every cycle until explicitly cancelled — and cancellation carries a diplomatic penalty (−5 relations). This creates credible commitment mechanisms that mirror the function of international treaties in real environmental politics.

**Bot AI profiles** are calibrated to country archetypes and operate unassigned or disconnected countries each cycle:
- **Fossil Maximiser** (Russia, OPEC) — votes NO on climate resolutions; builds extractors and fossil plants
- **Green Pioneer** (EU, LatAm) — votes YES; prioritises green plants, farms, and manufacturing
- **Pragmatic** (USA, China) — cost-benefit summit votes; balanced farm and industry builds
- **Development First** (India, Africa) — votes YES when aid is included; prioritises farms and energy for food security

Bots place one archetype-appropriate building per cycle when affordable, and may initiate food trades from surplus exporters when food runs low. Summit votes use the same `computeBotVote()` profiles as human-facing diplomacy.

---

## 5. Population and Resource Dynamics

Per-capita consumption mechanics ensure that population is not free to grow infinitely. Every 100 population units consume 5 food, 2 energy, and 1 money per cycle (`drain = round(population / 100 × rate)`). This creates a fundamental asymmetry between large-population countries (China at 90, India at 88, Africa at 82) and small-population countries (Russia at 18, EU at 22). China drains 5 food per cycle just from existing citizens before any building costs. Without farms, China runs out of food in approximately 8 cycles. Africa (4 food/cycle drain, 26 starting food) runs out in approximately 6 cycles.

This population burden reproduces the development dilemma: large-population developing countries must invest in basic sustenance (farms, energy) before they can afford the expensive green transition. Meanwhile, small rich countries (USA, EU) can coast on starting reserves for 30+ cycles. The asymmetry IS the rich-poor divide in environmental politics — and it emerges from the numbers, not from narrative scripting.

Food as geopolitical leverage is a deliberate design choice. Latin America starts with massive food surplus (48 starting food, low population drain) and can demand technology, money, or political concessions from food-dependent countries. This mirrors real commodity diplomacy and creates trade dependencies that constrain climate negotiation positions.

---

## 6. Victory and Evaluation

Victory is determined by the composite gap score from the Liefferink pioneer/laggard framework. The three countries with the lowest gap scores (closest to pioneer across all six metrics) win. This scoring method was chosen over alternatives (raw GDP, population size, military-style domination) for three reasons:

First, it aligns with the module's learning outcomes, which explicitly require students to "evaluate environmental policy outcomes from a comparative perspective" and understand "factors contributing to the successes and failures of pioneer and laggard states."

Second, the geometric structure of the gap score prevents one-dimensional strategies. A country cannot win by maximising money while ignoring emissions, or by cutting emissions while letting its population starve. Balance across all dimensions is required — reflecting Raworth's argument that sustainable development means operating within the doughnut's safe and just space.

Third, using the dashboard as both analytical tool and victory condition reinforces the pedagogical purpose. The instrument students use to understand comparative environmental performance during the game is the same instrument that determines the outcome. Playing well requires doing comparative analysis well.

---

## 7. Alignment with Module Learning Outcomes

The module's intended learning outcomes state that after participation, students will be able to:

1. **Identify key concepts and theories of environmental policy** — The game operationalises Hardin's tragedy of the commons, Olson's free-rider problem, Nordhaus's carbon pricing, Goulder's double dividend, Raworth's doughnut, Rockström's planetary boundaries, Putnam's two-level games, Ostrom's polycentric governance, Aklin and Mildenberger's distributive conflict, and the CBDR principle. Players encounter each concept as a mechanic they must navigate.

2. **Distinguish among different theoretical approaches** — The carbon tax system (economic approach), the faction system (domestic politics approach), the summit system (international institutions approach), and the trade system (political economy approach) each represent distinct theoretical lenses applied to the same environmental problem.

3. **Apply methods of comparative analysis** — The comparison dashboard directly implements Liefferink et al.'s gap approach, giving students a quantitative tool for comparing environmental policy performance across eight country blocs in real time.

4. **Compare internationally the institutions, actor constellations, processes and outcomes** — The eight country blocs reproduce real-world institutional differences (OPEC's fossil dependence, EU's regulatory tradition, India's development priorities), actor constellations (domestic factions, international coalitions), processes (summit voting, trade negotiation), and outcomes (pioneer/laggard rankings).

5. **Evaluate environmental policy outcomes from a comparative perspective** — The victory condition IS comparative evaluation. Winning requires outperforming other countries across multiple environmental policy dimensions — the same analytical task the module trains students to perform.

---

## 8. Technical Implementation

The game is implemented as a single-page React application using TypeScript and Vite, deployed on Vercel. Firebase Realtime Database handles multiplayer state synchronisation — chosen for its built-in presence detection (tracking player connect/disconnect) and real-time listeners (no polling). The hex grid renders as SVG. Game audio uses bundled procedural WAV assets generated at build time (`scripts/generate-audio.mjs`) and played through the Web Audio API; the first user gesture unlocks audio playback per browser autoplay policy.

The architecture separates game logic (pure TypeScript functions in `/lib/`) from UI components (React in `/components/`) and multiplayer services (Firebase in `/services/`). Game state is processed through a 14-step cycle engine that sequentially handles per-capita consumption, workforce allocation, extraction, building yields, trade processing, CO₂ aggregation, temperature update, climate effects, carbon tax collection, faction satisfaction, happiness cascade, summit resolution checks, population effects, and cycle advancement. This deterministic processing order ensures that all players observe identical game state regardless of network latency.

---

## 9. Conclusion

Climate Diplomacy demonstrates that the core tensions of international environmental politics — collective action failure, distributive conflict, domestic political constraints, and the pioneer/laggard gap — can be operationalised as interactive game mechanics grounded in established academic models. The simulation does not simplify these tensions away; it reproduces the structural conditions that make environmental politics difficult and lets players experience the consequences of their policy choices in real time.

The game's value as a pedagogical tool lies not in providing answers but in making the right questions unavoidable. A player controlling OPEC cannot avoid confronting the fossil trap. A player controlling India cannot avoid the climate justice argument. A player controlling the EU cannot avoid the cost of leadership. These are not scripted narratives — they emerge from the asymmetric starting conditions and the mechanics that connect domestic politics to international outcomes.

By grounding every mechanic in published academic work from the module's curriculum and broader environmental politics literature, the game serves as both a learning tool and an assessment vehicle: playing well requires understanding the theories, and understanding the theories improves gameplay.

---

## References

Aklin, M. and Mildenberger, M. (2020) 'Prisoners of the Wrong Dilemma: Why Distributive Conflict, Not Collective Action, Characterizes the Politics of Climate Change', *Global Environmental Politics*, 20(4), pp. 4–27.

Cancún Agreements (2010) *Report of the Conference of the Parties on its sixteenth session, held in Cancún from 29 November to 10 December 2010*. UNFCCC.

Federal Reserve (2021) 'Recycling Carbon Tax Revenue to Maximize Welfare', *FEDS Working Paper No. 2021-023*. Board of Governors of the Federal Reserve System.

Freire-González, J. (2018) 'Environmental taxation and the double dividend hypothesis in CGE modelling literature: A critical review', *Journal of Policy Modeling*, 40(1), pp. 194–210.

Goulder, L. (1995) 'Environmental Taxation and the Double Dividend: A Reader's Guide', *National Tax Journal*, 48(2), pp. 157–183.

Hardin, G. (1968) 'The Tragedy of the Commons', *Science*, 162(3859), pp. 1243–1248.

Holzinger, K. and Sommerer, T. (2012) 'Was verursacht die Aufwärtsspirale in der Umweltpolitik? Der Einfluss internationaler Harmonisierung auf nationale Umweltstandards', *Österreichische Zeitschrift für Politikwissenschaft*, 41(1), pp. 53–72.

IEA (2024) *World Energy Employment 2024*. Paris: International Energy Agency.

IRENA and ILO (2024) *Renewable Energy and Jobs: Annual Review 2024*. Abu Dhabi: International Renewable Energy Agency.

Jänicke, M. and Weidner, H. (eds.) (1995) *Successful Environmental Policy: A Critical Evaluation of 24 Cases*. Berlin: Edition Sigma.

Liefferink, D., Arts, B., Kamstra, J. and Ooijevaar, J. (2009) 'Leaders and Laggards in Environmental Policy: A Quantitative Analysis of Domestic Policy Outputs', *Journal of European Public Policy*, 16(5), pp. 677–700.

Mezzanotti, F. and Starkman, M. (n.d.) 'Climate Politics in the United States', *CEPR Discussion Paper No. DP20578*.

Nordhaus, W. (2018) 'Climate Change: The Ultimate Challenge for Economics', Nobel Prize Lecture, 8 December 2018. Stockholm: Nobel Foundation.

Olson, M. (1965) *The Logic of Collective Action: Public Goods and the Theory of Groups*. Cambridge, MA: Harvard University Press.

Ostrom, E. (1990) *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge: Cambridge University Press.

Ostrom, E. (2010) 'Polycentric Systems for Coping with Collective Action and Global Environmental Change', *Global Environmental Change*, 20(4), pp. 550–557.

Putnam, R. (1988) 'Diplomacy and Domestic Politics: The Logic of Two-Level Games', *International Organization*, 42(3), pp. 427–460.

Raworth, K. (2012) *A Safe and Just Space for Humanity: Can We Live Within the Doughnut?* Oxfam Discussion Paper. Oxford: Oxfam International.

Raworth, K. (2017) *Doughnut Economics: Seven Ways to Think Like a 21st-Century Economist*. London: Random House.

Richardson, K. et al. (2023) 'Earth beyond six of nine planetary boundaries', *Science Advances*, 9(37), eadh2458.

Rockström, J. et al. (2009) 'A Safe Operating Space for Humanity', *Nature*, 461(7263), pp. 472–475.

Schreurs, M.A. (2002) *Environmental Politics in Japan, Germany, and the United States*. Cambridge: Cambridge University Press.

Steinberg, P. and VanDeveer, S. (eds.) (2012) *Comparative Environmental Politics: Theory, Practice, and Prospects*. Cambridge, MA: MIT Press.

United Nations (1992) *Rio Declaration on Environment and Development*. United Nations Conference on Environment and Development, Rio de Janeiro.

World Bank (2024) *World Development Indicators: Oil Rents (% of GDP)*. Washington, DC: World Bank Group.

Yale Center for Environmental Law & Policy (2024) *Environmental Performance Index 2024*. New Haven, CT: Yale University.
