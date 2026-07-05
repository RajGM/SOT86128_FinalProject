import { BUILD_BY_ID } from "../../config/builds";
import {
  getEffectDelta,
  reverseEffects,
} from "../../lib/buildRules";
import type { BuildEffects, BuildType } from "../../types/game";

type ConsequenceMode = "place" | "upgrade" | "demolish";

interface ConsequenceTreeProps {
  buildType: BuildType;
  tier: 1 | 2 | 3;
  mode?: ConsequenceMode;
  nextTier?: 2 | 3;
}

const EFFECT_KEYS: (keyof BuildEffects)[] = [
  "money", "energy", "food", "population", "happiness", "co2", "technology", "goods",
];

function formatEffectLines(effects: BuildEffects, prefix: string): string[] {
  return EFFECT_KEYS
    .filter((k) => {
      const v = effects[k];
      return v !== undefined && v !== 0;
    })
    .map((k) => {
      const v = effects[k]!;
      const sign = v > 0 ? "+" : "";
      const label = k === "co2" ? "CO2" : k.charAt(0).toUpperCase() + k.slice(1);
      const magnitude = Math.abs(v) >= 50 ? "+++" : Math.abs(v) >= 25 ? "++" : "+";
      return `${prefix}${label} ${sign}${v} (${v > 0 ? magnitude : "-" + magnitude})`;
    });
}

export function ConsequenceTree({ buildType, tier, mode = "place", nextTier }: ConsequenceTreeProps) {
  const build = BUILD_BY_ID[buildType];

  let header: string;
  let effectLines: string[];

  if (mode === "demolish") {
    header = `Demolish ${build.name} (Tier ${tier})`;
    effectLines = formatEffectLines(reverseEffects(build.effectsByTier[tier]), "  -> ");
  } else if (mode === "upgrade" && nextTier) {
    header = `Upgrade ${build.name}: Tier ${tier} -> Tier ${nextTier}`;
    effectLines = formatEffectLines(getEffectDelta(build, tier, nextTier), "  -> ");
  } else {
    header = `${build.name} (Tier ${tier})`;
    effectLines = formatEffectLines(build.effectsByTier[tier], "  -> ");
  }

  const lines = [
    header,
    ...build.consequenceLines.map((l) => `  -> ${l}`),
  ];

  return (
    <>
      <div className="section-title">Consequence Tree (per cycle)</div>
      <div className="card">
        <div className="consequence-tree">
          {lines.join("\n")}
          {effectLines.length > 0 && "\n" + effectLines.join("\n")}
        </div>
      </div>
    </>
  );
}
