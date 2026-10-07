import type { EnergyType } from "@/lib/value-objects/card";
import type { EnergyCost } from "@/types/catalog";

const COLORLESS: EnergyType = "ia";

function missingEnergy(energies: EnergyType[], cost: EnergyCost[]): number {
  const pool = [...energies];
  let missing = 0;
  let colorless = 0;
  for (const item of cost) {
    if (item.type === COLORLESS) {
      colorless += item.count;
      continue;
    }
    for (let paid = 0; paid < item.count; paid += 1) {
      const index = pool.indexOf(item.type);
      if (index === -1) missing += 1;
      else pool.splice(index, 1);
    }
  }
  return missing + Math.max(0, colorless - pool.length);
}

function canPay(energies: EnergyType[], cost: EnergyCost[]): boolean {
  return missingEnergy(energies, cost) === 0;
}

function totalCost(cost: EnergyCost[]): number {
  return cost.reduce((sum, item) => sum + item.count, 0);
}

export { canPay, COLORLESS, missingEnergy, totalCost };
