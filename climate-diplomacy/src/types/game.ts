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
  | "city"
  | "farm"
  | "transport_hub"
  | "extractor";

export type TradeItem =
  | "money"
  | "energy"
  | "food"
  | "population"
  | "fuel"
  | "rare_earth"
  | "uranium"
  | "technology"
  | "transit_permission"
  | "airspace_permission"
  | "hub_upgrade";

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
  /** CO₂ per unit of resource moved on this route. */
  emissionsPerUnit: number;
  /** Hub used at origin (if any). */
  fromHubId?: string;
}

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
  /** Hub upgrade: building to upgrade on receiver's territory. */
  hubUpgradeBuildingId?: string;
  /** Hub upgrade: target tier (2 or 3) or omitted for post-T3 level bump. */
  hubUpgradeToTier?: 2 | 3;
  /** Hub upgrade: number of post-T3 levels to add. */
  hubUpgradeExtraLevels?: number;
  /** Hub upgrade: who pays the upgrade money cost. */
  hubUpgradePayer?: CountryId;
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
  /** Transport units consumed this cycle per country (resets each cycle). */
  transportCapacityUsed: Partial<Record<CountryId, number>>;
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
