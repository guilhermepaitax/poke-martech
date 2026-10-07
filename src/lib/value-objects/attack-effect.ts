const STATUS_CONDITIONS = ["poisoned", "burned", "asleep", "paralyzed", "confused"] as const;

const ATTACK_EFFECT_KINDS = [
  "heal_self",
  "status",
  "coin_bonus",
  "coin_or_nothing",
  "bench_damage",
  "self_damage",
  "discard_energy",
  "draw_cards",
  "attach_energy_self",
  "prevent_damage_next_turn",
  "bonus_if_damaged",
] as const;

const MAX_ATTACK_EFFECTS = 3;

type StatusCondition = (typeof STATUS_CONDITIONS)[number];
type AttackEffectKind = (typeof ATTACK_EFFECT_KINDS)[number];
type EffectTarget = "self" | "opponent";

type AttackEffect =
  | { kind: "heal_self"; amount: number }
  | { kind: "status"; condition: StatusCondition; target: EffectTarget; coinFlip: boolean }
  | { kind: "coin_bonus"; coins: number; amountPerHeads: number }
  | { kind: "coin_or_nothing" }
  | { kind: "bench_damage"; amount: number; scope: "all" | "one" }
  | { kind: "self_damage"; amount: number }
  | { kind: "discard_energy"; count: number; target: EffectTarget }
  | { kind: "draw_cards"; count: number }
  | { kind: "attach_energy_self"; count: number }
  | { kind: "prevent_damage_next_turn"; coinFlip: boolean }
  | { kind: "bonus_if_damaged"; amount: number };

const STATUS_LABELS: Record<StatusCondition, string> = {
  poisoned: "Envenenado",
  burned: "Queimado",
  asleep: "Adormecido",
  paralyzed: "Paralisado",
  confused: "Confuso",
};

const ATTACK_EFFECT_LABELS: Record<AttackEffectKind, string> = {
  heal_self: "Curar a si mesmo",
  status: "Condição especial",
  coin_bonus: "Moedas para dano extra",
  coin_or_nothing: "Moeda ou nada",
  bench_damage: "Dano no banco",
  self_damage: "Dano em si mesmo",
  discard_energy: "Descartar energia",
  draw_cards: "Comprar cartas",
  attach_energy_self: "Anexar energia em si",
  prevent_damage_next_turn: "Prevenir dano",
  bonus_if_damaged: "Dano extra se ferido",
};

function defaultAttackEffect(kind: AttackEffectKind): AttackEffect {
  switch (kind) {
    case "heal_self":
      return { kind, amount: 20 };
    case "status":
      return { kind, condition: "poisoned", target: "opponent", coinFlip: false };
    case "coin_bonus":
      return { kind, coins: 1, amountPerHeads: 30 };
    case "coin_or_nothing":
      return { kind };
    case "bench_damage":
      return { kind, amount: 10, scope: "all" };
    case "self_damage":
      return { kind, amount: 10 };
    case "discard_energy":
      return { kind, count: 1, target: "self" };
    case "draw_cards":
      return { kind, count: 1 };
    case "attach_energy_self":
      return { kind, count: 1 };
    case "prevent_damage_next_turn":
      return { kind, coinFlip: true };
    case "bonus_if_damaged":
      return { kind, amount: 30 };
  }
}

function describeAttackEffect(effect: AttackEffect): string {
  switch (effect.kind) {
    case "heal_self":
      return `Cure ${effect.amount} de dano deste Pokémon.`;
    case "status": {
      const who = effect.target === "opponent" ? "o Pokémon Ativo do oponente" : "este Pokémon";
      const sentence = `${who} agora está ${STATUS_LABELS[effect.condition]}.`;
      if (effect.coinFlip) return `Jogue uma moeda. Se sair cara, ${sentence}`;
      return sentence.charAt(0).toUpperCase() + sentence.slice(1);
    }
    case "coin_bonus":
      return effect.coins === 1
        ? `Jogue uma moeda. Se sair cara, este ataque causa ${effect.amountPerHeads} de dano a mais.`
        : `Jogue ${effect.coins} moedas. Este ataque causa ${effect.amountPerHeads} de dano a mais para cada cara.`;
    case "coin_or_nothing":
      return "Jogue uma moeda. Se sair coroa, este ataque não faz nada.";
    case "bench_damage":
      return effect.scope === "all"
        ? `Causa ${effect.amount} de dano a cada Pokémon no Banco do oponente.`
        : `Causa ${effect.amount} de dano a 1 Pokémon aleatório no Banco do oponente.`;
    case "self_damage":
      return `Este Pokémon também sofre ${effect.amount} de dano.`;
    case "discard_energy":
      return effect.target === "self"
        ? `Descarte ${effect.count} Energia${effect.count > 1 ? "s" : ""} deste Pokémon.`
        : `Descarte ${effect.count} Energia${effect.count > 1 ? "s" : ""} aleatória${effect.count > 1 ? "s" : ""} do Pokémon Ativo do oponente.`;
    case "draw_cards":
      return `Compre ${effect.count} carta${effect.count > 1 ? "s" : ""}.`;
    case "attach_energy_self":
      return `Pegue ${effect.count} Energia${effect.count > 1 ? "s" : ""} da sua Zona de Energia e anexe a este Pokémon.`;
    case "prevent_damage_next_turn":
      return effect.coinFlip
        ? "Jogue uma moeda. Se sair cara, previna todo o dano causado a este Pokémon durante o próximo turno do oponente."
        : "Previna todo o dano causado a este Pokémon durante o próximo turno do oponente.";
    case "bonus_if_damaged":
      return `Se este Pokémon tiver dano, este ataque causa ${effect.amount} de dano a mais.`;
  }
}

function attackDescription(effectText: string, effects: AttackEffect[] = []): string {
  if (effectText) return effectText;
  return effects.map(describeAttackEffect).join(" ");
}

function isStatusCondition(value: unknown): value is StatusCondition {
  return STATUS_CONDITIONS.some((condition) => condition === value);
}

function isAttackEffectKind(value: unknown): value is AttackEffectKind {
  return ATTACK_EFFECT_KINDS.some((kind) => kind === value);
}

function parseAttackEffects(value: unknown): AttackEffect[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item: unknown): AttackEffect[] => {
    if (typeof item !== "object" || item === null || !("kind" in item)) return [];
    if (!isAttackEffectKind(item.kind)) return [];
    return [{ ...defaultAttackEffect(item.kind), ...item } as AttackEffect];
  });
}

export {
  ATTACK_EFFECT_KINDS,
  ATTACK_EFFECT_LABELS,
  attackDescription,
  defaultAttackEffect,
  describeAttackEffect,
  isAttackEffectKind,
  isStatusCondition,
  MAX_ATTACK_EFFECTS,
  parseAttackEffects,
  STATUS_CONDITIONS,
  STATUS_LABELS,
};
export type { AttackEffect, AttackEffectKind, EffectTarget, StatusCondition };
