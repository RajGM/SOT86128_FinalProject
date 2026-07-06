import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  BuildType,
  CarbonTaxRecycling,
  RegionState,
  RelationAlert,
  RelationEvent,
} from "../types/game";
import { DEVELOPING_RECIPIENTS } from "./comparisonMetrics";
import { applyOneSidedRelation } from "./relationMechanics";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export const CITIZEN_DIVIDEND_HAPPINESS_CAP = 8;
export const CLIMATE_FINANCE_RELATIONS_CAP = 3;
export const GREEN_SUBSIDY_MAX_DISCOUNT_RATIO = 0.5;

const GREEN_SUBSIDY_BUILD_TYPES = new Set<BuildType>(["green_plant", "nuclear_plant"]);

export function snapCarbonTaxRate(rate: number, floor = 0, ceiling = 100): number {
  const clamped = Math.max(floor, Math.min(ceiling, Math.round(rate / 5) * 5));
  return Math.max(0, Math.min(100, clamped));
}

export function calculateTaxCollected(nationalCo2ThisCycle: number, carbonTaxRate: number): number {
  if (carbonTaxRate <= 0 || nationalCo2ThisCycle <= 0) return 0;
  return Math.floor(nationalCo2ThisCycle * (carbonTaxRate / 100));
}

export function citizenDividendHappinessBonus(taxCollected: number): number {
  return Math.min(Math.floor(taxCollected / 10), CITIZEN_DIVIDEND_HAPPINESS_CAP);
}

export function climateFinanceRelationsBonus(taxCollected: number): number {
  return Math.min(Math.floor(taxCollected / 15), CLIMATE_FINANCE_RELATIONS_CAP);
}

export function climateFinancePerRecipient(taxCollected: number): number {
  return Math.floor(taxCollected / DEVELOPING_RECIPIENTS.length);
}

export function isGreenSubsidyEligible(type: BuildType): boolean {
  return GREEN_SUBSIDY_BUILD_TYPES.has(type);
}

export function applyGreenSubsidyToCost(
  buildCost: number,
  pool: number
): { actualCost: number; subsidyUsed: number; remainingPool: number } {
  if (pool <= 0 || buildCost <= 0) {
    return { actualCost: buildCost, subsidyUsed: 0, remainingPool: pool };
  }
  const minCost = Math.ceil(buildCost * GREEN_SUBSIDY_MAX_DISCOUNT_RATIO);
  const maxSubsidy = Math.max(0, buildCost - minCost);
  const subsidyUsed = Math.min(pool, maxSubsidy);
  return {
    actualCost: buildCost - subsidyUsed,
    subsidyUsed,
    remainingPool: pool - subsidyUsed,
  };
}

export function resolveSubsidizedMoneyCost(
  region: RegionState,
  type: BuildType,
  baseCost: number
): { cost: number; greenSubsidyPool: number } {
  if (!isGreenSubsidyEligible(type) || region.greenSubsidyPool <= 0) {
    return { cost: baseCost, greenSubsidyPool: region.greenSubsidyPool };
  }
  const { actualCost, remainingPool } = applyGreenSubsidyToCost(baseCost, region.greenSubsidyPool);
  return { cost: actualCost, greenSubsidyPool: remainingPool };
}

export const CARBON_TAX_RECYCLING_OPTIONS: {
  id: CarbonTaxRecycling;
  label: string;
  description: string;
}[] = [
  {
    id: "dividend",
    label: "Citizen Dividend",
    description: "+1 happiness per 10 money recycled (max +8/cycle)",
  },
  {
    id: "subsidy",
    label: "Green Subsidy",
    description: "Pool funds up to 50% off next green/nuclear build",
  },
  {
    id: "finance",
    label: "Climate Finance",
    description: "Transfer to India, LatAm, Africa; +relations (max +3/cycle each)",
  },
];

export interface CarbonTaxCycleResult {
  regions: Record<CountryId, RegionState>;
  climateFinanceGiven: Partial<Record<CountryId, number>>;
  climateFinanceThisCycle: Partial<Record<CountryId, number>>;
  relationEvents: RelationEvent[];
  relationAlerts: RelationAlert[];
}

/** Step 8b: collect carbon tax on this cycle's emissions and recycle revenue. */
export function processCarbonTaxCollection(
  regions: Record<CountryId, RegionState>,
  cycleCo2ByCountry: Partial<Record<CountryId, number>>,
  climateFinanceGiven: Partial<Record<CountryId, number>>,
  climateFinanceThisCycle: Partial<Record<CountryId, number>>,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[],
  cycle: number
): CarbonTaxCycleResult {
  let nextRegions = { ...regions };
  let nextFinanceGiven = { ...climateFinanceGiven };
  let nextFinanceThisCycle = { ...climateFinanceThisCycle };
  let nextEvents = [...relationEvents];
  let nextAlerts = [...relationAlerts];

  for (const id of ALL_COUNTRIES) {
    const nationalCo2 = cycleCo2ByCountry[id] ?? 0;
    const region = nextRegions[id];
    if (region.carbonTax <= 0 || nationalCo2 <= 0) continue;

    const taxOwed = calculateTaxCollected(nationalCo2, region.carbonTax);
    if (taxOwed <= 0) continue;

    const taxPaid = Math.min(taxOwed, region.money);
    let updatedRegion: RegionState = {
      ...region,
      money: Math.max(0, region.money - taxPaid),
    };

    switch (region.carbonTaxRecycling) {
      case "dividend": {
        const bonus = citizenDividendHappinessBonus(taxPaid);
        if (bonus > 0) {
          updatedRegion = {
            ...updatedRegion,
            happiness: Math.min(100, updatedRegion.happiness + bonus),
          };
        }
        break;
      }
      case "subsidy": {
        updatedRegion = {
          ...updatedRegion,
          greenSubsidyPool: updatedRegion.greenSubsidyPool + taxPaid,
        };
        break;
      }
      case "finance": {
        const perCountry = climateFinancePerRecipient(taxPaid);
        const relationsBonus = climateFinanceRelationsBonus(taxPaid);
        const senderName = COUNTRY_CONFIGS[id].name;

        for (const recipient of DEVELOPING_RECIPIENTS) {
          if (perCountry > 0) {
            const recipientRegion = nextRegions[recipient];
            nextRegions[recipient] = {
              ...recipientRegion,
              money: recipientRegion.money + perCountry,
            };
          }
          if (relationsBonus > 0) {
            const relResult = applyOneSidedRelation(
              nextRegions,
              recipient,
              id,
              relationsBonus,
              "climate_finance_given",
              cycle,
              `Carbon tax climate finance from ${senderName}`,
              nextEvents,
              nextAlerts
            );
            nextRegions = relResult.regions;
            nextEvents = relResult.relationEvents;
            nextAlerts = relResult.relationAlerts;
          }
        }

        nextFinanceGiven = {
          ...nextFinanceGiven,
          [id]: (nextFinanceGiven[id] ?? 0) + taxPaid,
        };
        nextFinanceThisCycle = {
          ...nextFinanceThisCycle,
          [id]: (nextFinanceThisCycle[id] ?? 0) + taxPaid,
        };
        break;
      }
    }

    nextRegions[id] = updatedRegion;
  }

  return {
    regions: nextRegions,
    climateFinanceGiven: nextFinanceGiven,
    climateFinanceThisCycle: nextFinanceThisCycle,
    relationEvents: nextEvents,
    relationAlerts: nextAlerts,
  };
}
