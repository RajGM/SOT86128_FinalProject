# Climate Diplomacy: A Multiplayer Simulation of Environmental Politics in International Comparison

**Module:** POL23200 — Environmental Politics in International Comparison  
**Instructor:** Prof. Dr. Miranda Schreurs  
**Institution:** Technical University of Munich, Department of Governance  

---

## 1. Introduction

This paper presents *Climate Diplomacy*, a real-time multiplayer simulation game that operationalises core theories from comparative environmental politics as interactive mechanics. Eight country blocs — USA, EU, Russia, China, India, OPEC, Latin America, and Africa — compete and cooperate on a shared hexagonal map where CO₂ emissions from individual infrastructure decisions accumulate into a global temperature that affects everyone. The game is built with React, TypeScript, and Firebase, supporting 1–8 human players with bot AI controlling unoccupied countries.

The design philosophy is grounded in the module's curriculum: every mechanic maps to a published academic model, and strategic success requires understanding the theory behind it. This report traces those mappings and evaluates the simulation's alignment with the module's intended learning outcomes.

---

## 2. Academic Models as Game Mechanics

### 2.1 Commons Tragedy and Collective Action

The game's climate system implements Hardin's (1968) tragedy of the commons. Each country's fossil infrastructure produces CO₂ that feeds a shared global temperature variable. Above +2.0°C, temperature penalises all countries equally through happiness reductions (−2/cycle at +2.0–2.5°C) and farm yield losses (−20% above +2.0°C). Olson's (1965) free-rider problem emerges naturally: unilateral emission cuts cost the acting country fully but benefit all eight equally. No global authority enforces cooperation — players must negotiate solutions through trade, summits, and diplomatic pressure, mirroring real international climate politics.

### 2.2 Carbon Pricing and the Double Dividend

The carbon tax mechanic draws on Nordhaus's (2018) DICE model. Each country sets a tax rate (0–100) that collects money proportional to national emissions. The tax never reduces CO₂ directly — players must physically replace fossil buildings with green alternatives. This reproduces Nordhaus's insight that carbon pricing shifts investment incentives rather than magically cleaning emissions.

Revenue recycling operationalises Goulder's (1995) double dividend hypothesis through three options: Citizen Dividend (lump-sum happiness bonus; politically popular but least efficient per Federal Reserve 2021), Green Subsidy (reduced future green build costs; most efficient per Freire-González's 2018 meta-analysis of 69 CGE simulations), and Climate Finance (direct wealth transfer to developing countries; modelling the Cancún 2010 $100B/year pledge). Each option creates distinct strategic trade-offs that vary by country: OPEC at 90% brown faction faces economic suicide from any meaningful tax, while the EU at 70% green can set high taxes at minimal cost.

### 2.3 Domestic Politics and Two-Level Games

Putnam's (1988) two-level game theory is operationalised through a domestic faction system. Each country has Brown (pro-fossil) and Green (pro-sustainability) factions whose proportional strength shifts dynamically based on infrastructure decisions, following Mezzanotti and Starkman's (CEPR DP20578) empirical finding that green/brown establishment ratios predict climate voting. Faction satisfaction feeds directly into national happiness: `faction_modifier = (brown% × brown_satisfaction + green% × green_satisfaction) / 100`.

This creates Putnam's dual constraint. A player controlling India may want to vote YES on an emissions resolution (satisfying the 60% green faction), but the resulting carbon tax floor would strain India's economy. The player simultaneously manages international negotiation (Level I) and domestic political feasibility (Level II).

### 2.4 Doughnut Economics and Summit Resolutions

Summit resolutions are triggered by boundary violations drawn from Raworth's (2017) Doughnut Economics framework, which combines Rockström's (2009) planetary boundaries (ecological ceiling) with social foundation thresholds. Five boundary conditions are monitored each cycle: temperature thresholds and CO₂ concentration (ceiling triggers) and human development deficits, inequality gaps, and political instability (floor triggers), calibrated against Richardson et al.'s (2023) updated quantification showing six of nine boundaries crossed.

Voting is YES/NO/ABSTAIN with simple majority. Non-compliance incurs −4 relations per cycle from YES-voters. Resolutions stack and compliance is tracked, creating cumulative diplomatic pressure that mirrors "naming and shaming" dynamics in real environmental regimes.

### 2.5 Pioneer/Laggard Gap Analysis

The comparison dashboard implements Liefferink et al.'s (2009) gap approach — directly referenced in the module's reading list through Holzinger and Sommerer (2012). Six metrics (CO₂ per capita, green energy ratio, carbon tax level, emission trend, summit voting record, climate finance given) are each normalised to 0–1 where 0 = pioneer and 1 = laggard. The pioneer IS the benchmark, shifting dynamically as players act. This composite gap score also determines victory: the three countries closest to pioneer across all dimensions win — ensuring that economic wealth alone cannot win the game and that balanced, multi-dimensional environmental performance is rewarded.

### 2.6 Polycentric Governance and Distributive Conflict

Ostrom's (1990; 2010) polycentric governance is embedded in the game's architecture: players cooperate through bilateral trade, transit agreements, multilateral summits, and climate finance simultaneously. No single channel suffices — the game rewards engagement across all layers.

Aklin and Mildenberger's (2020) distributive conflict framework is reproduced through multiple axes: the North-South divide (India and Africa contribute least to emissions but suffer most from warming, operationalising the CBDR principle from Rio 1992), the fossil exporter dilemma (OPEC and Russia face existential threats from green transition), and domestic winners and losers (faction satisfaction creates identifiable groups harmed by climate policy within each country).

---

## 3. Country Design and Asymmetry

The eight country blocs are initialised with asymmetric profiles drawn from real-world data (IEA 2024; World Bank 2024; IRENA/ILO 2024). Starting faction weights are calibrated to actual green/brown employment ratios: OPEC at 90% brown (oil rents 20–40% of GDP), EU at 70% green (1.8M renewable energy jobs), China at 50/50 (actively in transition).

Per-capita consumption (5 food, 2 energy, 1 money per 100 population per cycle) creates a structural divide. China (pop 90) drains 5 food per cycle; without farms, it runs out in ~8 cycles. Africa (pop 82, 4 food/cycle drain) runs out in ~6 cycles. The USA (pop 33, 2 food/cycle) can coast for 15+ cycles. This asymmetry IS the rich-poor divide — large-population developing countries must invest in basic sustenance before they can afford green transition, while small rich countries have the luxury of long-term planning.

Food as geopolitical leverage (Latin America's massive surplus vs. OPEC's total dependence on imports) and technology as development currency (only Manufacturing buildings produce technology; EU's tech monopoly enables diplomatic conditionality) create trade dependencies that constrain climate negotiation positions — reproducing the political economy dynamics that make environmental politics internationally complex.

---

## 4. Multiplayer and Bot AI

Firebase Realtime Database synchronises game state across players with built-in presence detection. The 14-step deterministic cycle engine ensures identical state regardless of network latency. Bot AI uses four profiles mapped to country archetypes: Fossil Maximiser (Russia, OPEC), Green Pioneer (EU, LatAm), Pragmatic (USA, China), and Development First (India, Africa). Unassigned and disconnected countries are bot-operated: each cycle bots place archetype-appropriate buildings and may propose food trades when reserves run low, in addition to summit voting.

---

## 5. Module Alignment and Conclusion

The module's intended learning outcomes require students to identify key theories, distinguish theoretical approaches, apply comparative analysis methods, compare institutions and actor constellations internationally, and evaluate environmental policy outcomes comparatively. Climate Diplomacy addresses each: the game operationalises theories from Hardin to Raworth as mechanics (ILO 1–2), implements Liefferink's gap approach as a real-time analytical tool (ILO 3), reproduces institutional and political asymmetries across eight country blocs drawn from real data (ILO 4), and uses the pioneer/laggard composite score as both analytical instrument and victory condition (ILO 5).

The game does not simplify environmental politics — it reproduces the structural conditions that make it difficult and lets players experience the consequences. A player controlling OPEC cannot avoid the fossil trap. A player controlling India cannot avoid the climate justice argument. These are not scripted narratives; they emerge from asymmetric starting conditions and the mechanics connecting domestic politics to international outcomes. Playing well requires understanding the theories, and understanding the theories improves gameplay.

---

## References

Aklin, M. and Mildenberger, M. (2020) 'Prisoners of the Wrong Dilemma', *Global Environmental Politics*, 20(4), pp. 4–27.

Federal Reserve (2021) 'Recycling Carbon Tax Revenue to Maximize Welfare', *FEDS Working Paper No. 2021-023*.

Freire-González, J. (2018) 'Environmental taxation and the double dividend hypothesis in CGE modelling literature', *Journal of Policy Modeling*, 40(1), pp. 194–210.

Goulder, L. (1995) 'Environmental Taxation and the Double Dividend', *National Tax Journal*, 48(2), pp. 157–183.

Hardin, G. (1968) 'The Tragedy of the Commons', *Science*, 162(3859), pp. 1243–1248.

Holzinger, K. and Sommerer, T. (2012) 'Was verursacht die Aufwärtsspirale in der Umweltpolitik?', *ÖZP*, 41(1), pp. 53–72.

Liefferink, D. et al. (2009) 'Leaders and Laggards in Environmental Policy', *JEPP*, 16(5), pp. 677–700.

Nordhaus, W. (2018) 'Climate Change: The Ultimate Challenge for Economics', Nobel Prize Lecture.

Olson, M. (1965) *The Logic of Collective Action*. Cambridge, MA: Harvard University Press.

Ostrom, E. (1990) *Governing the Commons*. Cambridge: Cambridge University Press.

Putnam, R. (1988) 'Diplomacy and Domestic Politics', *International Organization*, 42(3), pp. 427–460.

Raworth, K. (2017) *Doughnut Economics*. London: Random House.

Richardson, K. et al. (2023) 'Earth beyond six of nine planetary boundaries', *Science Advances*, 9(37).

Rockström, J. et al. (2009) 'A Safe Operating Space for Humanity', *Nature*, 461, pp. 472–475.

Schreurs, M.A. (2002) *Environmental Politics in Japan, Germany, and the United States*. Cambridge: CUP.
