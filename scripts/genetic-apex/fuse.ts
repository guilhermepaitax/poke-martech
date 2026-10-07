import { slugify } from "../../src/lib/slug";
import type { AttackEffect } from "../../src/lib/value-objects/attack-effect";
import type {
  CardFrame,
  EnergyType,
  Rarity,
  Stage,
} from "../../src/lib/value-objects/card";
import { translateAttackName } from "./attack-names";
import { parseEffect, printedDamage } from "./effects";
import { MEMBERS, type Member } from "./members";
import {
  mapEnergyCost,
  mapPokemonType,
  mapRarity,
  originTypeLabel,
  playStage,
  type ApexCard,
  type EnergyCost,
} from "./types";

type NameOrder = "stamp-first" | "name-first";

type FusedAttack = {
  name: string;
  damage: number | null;
  effectText: string;
  effects: AttackEffect[];
  energyCost: EnergyCost[];
  sortOrder: number;
};

type FusedCard = {
  source: ApexCard;
  member: Member;
  name: string;
  slug: string;
  hp: number;
  energyType: EnergyType;
  stage: Stage;
  frame: CardFrame;
  rarity: Rarity;
  retreatCost: number;
  weaknessType: EnergyType | null;
  flavorText: string;
  attacks: FusedAttack[];
  evolvesFromSourceId: string | null;
  evolvesFromSlug: string | null;
  stageNote: string | null;
};

function clip(value: string, max: number) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd();
}

function lettersOf(name: string) {
  return name.replace(/[^A-Za-z]/g, "");
}

function portugueseTail(tail: string) {
  return tail.replace(/saur$/i, "ssauro").toLowerCase();
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickOption<T>(options: readonly T[], seed: string) {
  const choice = options[hashSeed(seed) % options.length];
  if (choice === undefined) throw new Error("Lista de opções vazia.");
  return choice;
}

function blendName(stamp: string, pokemonName: string, taken: Set<string>) {
  const letters = lettersOf(pokemonName);
  const candidates: string[] = [];
  if (/saur$/i.test(letters)) {
    const stem = letters.slice(0, -4);
    candidates.push(`${stamp}ssauro`);
    for (let keep = 1; keep <= stem.length; keep += 1) {
      candidates.push(`${stamp}${stem.slice(-keep).toLowerCase()}ssauro`);
    }
  }
  const start = Math.min(4, Math.max(1, letters.length - 3));
  for (let cut = start; cut >= 1; cut -= 1)
    candidates.push(stamp + portugueseTail(letters.slice(cut)));
  candidates.push(`${stamp}${letters}`);
  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (
      taken.has(key) ||
      key === pokemonName.toLowerCase() ||
      key === letters.toLowerCase()
    )
      continue;
    return candidate;
  }
  return null;
}

function composeName(
  stamp: string,
  pokemonName: string,
  order: NameOrder,
  taken: Set<string>,
) {
  if (order === "name-first") {
    const candidate = `${pokemonName} ${stamp}`;
    const key = candidate.toLowerCase();
    if (!taken.has(key) && key !== pokemonName.toLowerCase()) return candidate;
  }
  return blendName(stamp, pokemonName, taken);
}

function fuseAttackName(spice: string, attackName: string) {
  const translated = translateAttackName(attackName);
  const spiced = `${spice} ${translated}`;
  const chosen = spiced.length <= 40 ? spiced : translated;
  return clip(chosen, 40);
}

function isEx(name: string) {
  return name.endsWith(" ex");
}

function stripEx(name: string) {
  return isEx(name) ? name.slice(0, -3) : name;
}

function buildFlavor(
  name: string,
  member: Member,
  source: ApexCard,
  attackName: string,
) {
  const type = originTypeLabel(source.types[0] ?? "");
  const details = [
    source.stage === "Stage2"
      ? `${name} chegou no último estágio e esse merge não tem volta.`
      : source.stage === "Stage1"
        ? `${source.name} já evoluiu uma vez e o review ficou mais rígido.`
        : `${source.name} ainda está no básico, do jeito que saiu da primeira versão.`,
    source.hp >= 150
      ? `Com ${source.hp} de HP, segura a daily inteira sem cair.`
      : source.hp <= 70
        ? `Com só ${source.hp} de HP, qualquer bug já derruba ${name}.`
        : `Os ${source.hp} de HP de ${name} dão para o meio do turno.`,
    source.retreat === 0
      ? `${name} recua de graça, como quem fecha o laptop e sai.`
      : `Recuar ${name} custa ${source.retreat}, e ${member.name} reclama de cada energia.`,
    `O golpe ${attackName} saiu de ${source.name} e ficou com a cara de ${member.name}.`,
    `O tipo ${type} ficou. O resto virou coisa de ${member.trait}.`,
  ];
  const ability = source.abilities[0];
  if (ability)
    details.push(`${name} ainda solta ${ability.name} quando ninguém olha.`);

  const identity = pickOption(
    [
      `${name} é ${source.name} depois que ${member.name} mexeu no código.`,
      `${source.name} entrou no time com ${member.name} e saiu chamado ${name}.`,
      `No lugar de ${source.name}, ${member.name} deixou ${name} no repositório.`,
      `${name} carrega ${source.name} e o jeito de ${member.name}, ${member.trait}.`,
    ],
    `${source.id}:identity`,
  );
  const voice = pickOption(member.flavors, `${source.id}:voice`);
  const detail = pickOption(details, `${source.id}:detail`);
  return clip(`${identity} ${voice} ${detail}`, 280);
}

function resolvePrevo(card: ApexCard, byName: Map<string, ApexCard[]>) {
  if (!card.evolveFrom) return null;
  const candidates = byName.get(card.evolveFrom) ?? [];
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0] ?? null;
  const mine = new Set(card.boosters.map((booster) => booster.id));
  const shared = candidates
    .filter((candidate) =>
      candidate.boosters.some((booster) => mine.has(booster.id)),
    )
    .sort((left, right) => Number(left.localId) - Number(right.localId));
  return shared[0] ?? null;
}

function buildLines(cards: ApexCard[]) {
  const byName = new Map<string, ApexCard[]>();
  for (const card of cards) {
    const list = byName.get(card.name) ?? [];
    list.push(card);
    byName.set(card.name, list);
  }
  const prevoOf = new Map<string, string | null>();
  for (const card of cards)
    prevoOf.set(card.id, resolvePrevo(card, byName)?.id ?? null);

  const children = new Map<string, ApexCard[]>();
  const roots: ApexCard[] = [];
  const sorted = [...cards].sort(
    (left, right) => Number(left.localId) - Number(right.localId),
  );
  for (const card of sorted) {
    const prevo = prevoOf.get(card.id);
    if (!prevo) roots.push(card);
    else {
      const list = children.get(prevo) ?? [];
      list.push(card);
      children.set(prevo, list);
    }
  }

  function walk(card: ApexCard): ApexCard[] {
    return [card, ...(children.get(card.id) ?? []).flatMap(walk)];
  }

  return roots.map((root, index) => {
    const member = MEMBERS[index % MEMBERS.length];
    if (!member) throw new Error("Membro ausente na escala do time.");
    return { member, cards: walk(root), prevoOf };
  });
}

function claimName(name: string, localId: string, taken: Set<string>) {
  let claimed = clip(name, 60);
  if (taken.has(claimed.toLowerCase()))
    claimed = clip(`${claimed} ${Number(localId)}`, 60);
  taken.add(claimed.toLowerCase());
  return claimed;
}

function fuseCatalog(cards: ApexCard[]): FusedCard[] {
  const lines = buildLines(cards);
  const assigned = lines.flatMap((line) =>
    line.cards.map((card) => ({
      card,
      member: line.member,
      prevoId: line.prevoOf.get(card.id) ?? null,
    })),
  );
  const nonEx = assigned
    .filter((item) => !isEx(item.card.name))
    .sort(
      (left, right) => Number(left.card.localId) - Number(right.card.localId),
    );
  const ex = assigned
    .filter((item) => isEx(item.card.name))
    .sort(
      (left, right) => Number(left.card.localId) - Number(right.card.localId),
    );

  const taken = new Set<string>();
  const baseName = new Map<string, string>();
  const named = new Map<
    string,
    { name: string; member: Member; prevoId: string | null }
  >();

  for (const item of [...nonEx, ...ex]) {
    const baseKey = `${item.member.id}:${stripEx(item.card.name)}`;
    const reused = isEx(item.card.name) ? baseName.get(baseKey) : undefined;
    const blended = reused
      ? `${reused} ex`
      : composeName(
          pickOption(item.member.stamps, `${item.card.id}:stamp`),
          stripEx(item.card.name),
          pickOption(["stamp-first"] as const, `${item.card.id}:order`),
          taken,
        );
    if (!blended) throw new Error(`Não foi possível nomear ${item.card.name}.`);
    const name = claimName(blended, item.card.localId, taken);
    if (!isEx(item.card.name)) baseName.set(baseKey, name);
    named.set(item.card.id, {
      name,
      member: item.member,
      prevoId: item.prevoId,
    });
  }

  const fused: FusedCard[] = assigned.map((item) => {
    const naming = named.get(item.card.id);
    if (!naming) throw new Error(`Carta sem nome: ${item.card.id}`);
    const prevo = naming.prevoId;
    const type = item.card.types[0];
    if (!type) throw new Error(`Carta sem tipo: ${item.card.id}`);
    if (item.card.hp < 10 || item.card.hp > 400)
      throw new Error(`HP inválido em ${item.card.id}`);
    if (item.card.retreat > 5)
      throw new Error(`Recuo inválido em ${item.card.id}`);
    if (item.card.attacks.length < 1 || item.card.attacks.length > 4) {
      throw new Error(`Quantidade de ataques inválida em ${item.card.id}`);
    }
    const weakness = item.card.weaknesses[0]?.type ?? null;
    const spice = pickOption(naming.member.spices, `${item.card.id}:spice`);
    const attacks = item.card.attacks.map((attack, sortOrder) => {
      const parsed = parseEffect(attack.effect);
      const energyCost = mapEnergyCost(attack.cost);
      if (energyCost.length > 6)
        throw new Error(`Custo de energia inválido em ${item.card.id}`);
      return {
        name: fuseAttackName(spice, attack.name),
        damage: printedDamage(attack.damage, parsed.effects),
        effectText: clip(parsed.effectText, 280),
        effects: parsed.effects,
        energyCost,
        sortOrder,
      };
    });
    const stageNote =
      item.card.evolveFrom && !prevo
        ? `Na origem evolui de ${item.card.evolveFrom}, que não entra nesta lista. A carta fica Básica para poder ser jogada.`
        : null;
    return {
      source: item.card,
      member: naming.member,
      name: naming.name,
      slug: "",
      hp: item.card.hp,
      energyType: mapPokemonType(type),
      stage: playStage(item.card.stage, Boolean(prevo)),
      frame: isEx(item.card.name) ? "ex" : "basic",
      rarity: mapRarity(item.card.rarity),
      retreatCost: item.card.retreat,
      weaknessType: weakness ? mapPokemonType(weakness) : null,
      flavorText: buildFlavor(
        naming.name,
        naming.member,
        item.card,
        attacks[0]?.name ?? "Investida",
      ),
      attacks,
      evolvesFromSourceId: prevo,
      evolvesFromSlug: null,
      stageNote,
    };
  });

  const slugs = new Set<string>();
  for (const card of [...fused].sort(
    (left, right) => Number(left.source.localId) - Number(right.source.localId),
  )) {
    const base = slugify(card.name) || `carta-${Number(card.source.localId)}`;
    const prefixed = `a1-${card.source.localId.padStart(3, "0")}-${base}`;
    const slug = slugs.has(prefixed)
      ? `${prefixed}-${Number(card.source.localId)}`
      : prefixed;
    slugs.add(slug);
    card.slug = slug;
  }

  const bySourceId = new Map(fused.map((card) => [card.source.id, card]));
  for (const card of fused) {
    card.evolvesFromSlug = card.evolvesFromSourceId
      ? (bySourceId.get(card.evolvesFromSourceId)?.slug ?? null)
      : null;
  }

  return fused;
}

export { blendName, composeName, fuseAttackName, fuseCatalog, pickOption };
export type { FusedAttack, FusedCard };
