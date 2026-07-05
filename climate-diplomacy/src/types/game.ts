import type { CountryId, HexData, ResourceDeposit, TerrainType } from "./hex";
import { RESOURCE_LABELS } from "./hex";

export type BuildCategory =
  | "energy"
  | "production"
  | "population"
  | "food"
  | "transport"
  | "extraction";

export type BuildType =
  | "fossil_plant"
  | "green_plant"
  | "nuclear_plant"
  | "industrial_complex"
  | "manufacturing"
  | "village"
  | "city"
  | "farm"
  | "airport"
  | "dock"
  | "transport_center"
  | "extractor";

export type InfraType = "airport" | "dock" | "transport_center";

export type TradeItem =
  | "money"
  | "energy"
  | "food"
  | "population"
  | "fuel"
  | "rare_earth"
  | "uranium"
  | "technology"
  | "goods"
  | "transit_permission"
  | "airspace_permission";

export type PriorityStatus = "green" | "yellow" | "orange" | "red";

export type PriorityCategory =
  | "money"
  | "energy"
  | "food"
  | "population"
  | "happiness"
  | "emissions"
  | "trade_access"
  | "technology";

export interface BuildEffects {
  money?: number;
  energy?: number;
  food?: number;
  population?: number;
  happiness?: number;
  co2?: number;
  technology?: number;
  goods?: number;
}

export interface BuildTierCost {
  money: number;
  tech?: number;
}

export interface BuildDefinition {
  id: BuildType;
  name: string;
  category: BuildCategory;
  description: string;
  tierRequirements?: Partial<Record<1 | 2 | 3, string>>;
  /** Cumulative placement cost per tier (money + optional tech). */
  costByTier: Record<1 | 2 | 3, BuildTierCost>;
  /** Fixed workers required per building (same at all tiers). */
  workforce: number;
  /** Fraction of placed cost charged to demolish (default 0.25). */
  demolishCostRatio?: number;
  /** Fraction of placed cost refunded on demolish (default 0.35). */
  demolishRefundRatio?: number;
  /** Fraction of tier-delta cost charged to upgrade (default 0.75). */
  upgradeCostRatio?: number;
  /** Per-cycle yields and recurring costs (applied each cycle when staffed). */
  effectsByTier: Record<1 | 2 | 3, BuildEffects>;
  consequenceLines: string[];
}

export interface PlacedBuilding {
  id: string;
  type: BuildType;
  tier: 1 | 2 | 3;
  /** Post-tier-3 infinite upgrade level (transport only). */
  extraLevel?: number;
  /** Construction order for workforce LIFO idle priority. */
  builtAt: number;
  q: number;
  r: number;
  countryId: CountryId | null;
}

export type RouteType = "land" | "air" | "sea";

export type RouteStatus = "active" | "pending" | "disrupted";

export type TradeMode = "one_time" | "continuous";

export type TransitFeeModel = "flat" | "commission";

export type TransitStatus = "pending" | "active" | "denied" | "cancelled";

export interface TransportRoute {
  id: string;
  from: CountryId;
  to: CountryId;
  routeType: RouteType;
  /** Full path: [from, ...transitRegions, to] */
  path: CountryId[];
  status: RouteStatus;
  emissionsPerCycle: number;
  /** Building ID of infrastructure used at origin */
  fromFacilityId?: string;
  /** Building ID of infrastructure used at destination */
  toFacilityId?: string;
}

/** Tier-based infrastructure capacity: max routes per facility */
export const INFRA_CAPACITY: Record<1 | 2 | 3, number> = { 1: 2, 2: 4, 3: 6 };
/** Tier-based infrastructure upkeep per cycle by facility type */
export const INFRA_UPKEEP: Record<InfraType, Record<1 | 2 | 3, number>> = {
  airport: { 1: 20, 2: 35, 3: 50 },
  dock: { 1: 15, 2: 25, 3: 40 },
  transport_center: { 1: 10, 2: 18, 3: 28 },
};
/** Tier-based emissions per cycle for each infra type */
export const INFRA_EMISSIONS: Record<InfraType, Record<1 | 2 | 3, number>> = {
  airport: { 1: 8, 2: 5, 3: 3 },
  dock: { 1: 5, 2: 3, 3: 2 },
  transport_center: { 1: 3, 2: 2, 3: 1 },
};

export interface TransitAgreement {
  id: string;
  routeId: string;
  traderFrom: CountryId;
  traderTo: CountryId;
  transitRegion: CountryId;
  feeModel: TransitFeeModel;
  /** Flat money per cycle, or commission percentage (0–100). */
  feeAmount: number;
  status: TransitStatus;
  /** Region that pays the transit fee (defaults to traderFrom). */
  payer: CountryId;
}

export interface TransitRequest {
  id: string;
  routeId: string;
  traderFrom: CountryId;
  traderTo: CountryId;
  transitRegion: CountryId;
  routeType: RouteType;
  path: CountryId[];
  status: "pending" | "responded";
}

export interface RegionProfile {
  id: CountryId;
  mainRichness: string;
  secondaryStrength: string;
  mainWeakness: string;
  agenda: string[];
  startingResources: {
    money: number;
    energy: number;
    food: number;
    population: number;
    happiness: number;
    co2: number;
    technology: number;
    goods: number;
  };
}

export interface RegionState {
  money: number;
  energy: number;
  food: number;
  population: number;
  happiness: number;
  co2: number;
  technology: number;
  goods: number;
  /** Tradeable map deposit stocks (initialized from tile counts). */
  deposits: Record<ResourceDeposit, number>;
  researchLevels: Partial<Record<BuildCategory, number>>;
  /** Research unlocks for extractor deposit types. */
  extractionUnlocks: Partial<Record<ResourceDeposit, boolean>>;
  breakthroughs: string[];
  relations: Partial<Record<CountryId, number>>;
}

export interface TradeAgreement {
  id: string;
  from: CountryId;
  to: CountryId;
  item: TradeItem;
  amount: number;
  routeId: string;
  active: boolean;
  tradeMode: TradeMode;
}

export interface BreakthroughProposal {
  id: string;
  name: string;
  requiredParticipants: CountryId[];
  optionalParticipants: CountryId[];
  agreed: CountryId[];
  refused: CountryId[];
  cost: number;
}

export interface CombinedResearchProject {
  id: string;
  name: string;
  goal: string;
  participants: CountryId[];
  contributions: Partial<Record<CountryId, number>>;
  progress: number;
  target: number;
  complete: boolean;
}

export interface ResearchLicense {
  id: string;
  breakthrough: string;
  seller: CountryId;
  buyer?: CountryId;
  model: "one_time" | "royalty";
  price: number;
  status: "offered" | "accepted" | "rejected";
}

export interface GameSuggestion {
  id: string;
  text: string;
  priority: number;
}

export interface ConsequenceNode {
  action: string;
  effects: string[];
}

export interface PriorityEntry {
  category: PriorityCategory;
  status: PriorityStatus;
  label: string;
}

export interface GameState {
  regions: Record<CountryId, RegionState>;
  tileBuildings: Record<string, PlacedBuilding>;
  tradeAgreements: TradeAgreement[];
  transportRoutes: TransportRoute[];
  transitAgreements: TransitAgreement[];
  transitRequests: TransitRequest[];
  highlightedRoutes: string[];
  breakthroughProposal: BreakthroughProposal | null;
  combinedProjects: CombinedResearchProject[];
  researchLicenses: ResearchLicense[];
  worldHappiness: number;
  globalTemperature: number;
  cycle: number;
  testingMode: boolean;
}

export interface ResourceTotals {
  money: number;
  energy: number;
  food: number;
  population: number;
  happiness: number;
  co2: number;
  technology: number;
  goods: number;
}

export function tileKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function hexToTileTags(hex: HexData): string[] {
  const tags: string[] = [];
  if (hex.resource) {
    tags.push(RESOURCE_LABELS[hex.resource]);
  }
  if (hex.terrain === "coastal") tags.push("Coastal");
  if (hex.terrain === "agricultural" || hex.terrain === "land") tags.push("Urban/Workforce");
  return tags;
}
