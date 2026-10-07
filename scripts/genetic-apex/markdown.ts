import { describeAttackEffect } from "../../src/lib/value-objects/attack-effect";
import type { FusedCard } from "./fuse";
import { MEMBERS } from "./members";
import { ENERGY_LABELS, originTypeLabel, type ApexCard } from "./types";

const RARITY_LABELS = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  double_rare: "Raro Duplo",
  art_rare: "Arte Rara",
  super_rare: "Super Raro",
  immersive: "Imersivo",
  crown: "Coroa",
} as const;

const STAGE_LABELS = {
  basic: "Básico",
  stage1: "Estágio 1",
  stage2: "Estágio 2",
} as const;

function sourceStageLabel(stage: string) {
  if (stage === "Basic") return "Básico";
  if (stage === "Stage1") return "Estágio 1";
  if (stage === "Stage2") return "Estágio 2";
  return stage;
}

function costLabel(card: FusedCard["attacks"][number]) {
  if (card.energyCost.length === 0) return "sem custo";
  return card.energyCost
    .map((cost) => `${ENERGY_LABELS[cost.type]} ×${cost.count}`)
    .join(", ");
}

function sourceAttacks(source: ApexCard) {
  return source.attacks
    .map((attack) => {
      const damage = attack.damage ?? "—";
      const effect = attack.effect ? ` — ${attack.effect}` : "";
      const cost =
        attack.cost.length > 0 ? attack.cost.join(", ") : "sem custo";
      return `- ${attack.name} (${damage}) [${cost}]${effect}`;
    })
    .join("\n");
}

function renderCard(card: FusedCard) {
  const source = card.source;
  const originType = source.types[0] ?? "—";
  const weakness = source.weaknesses[0]?.type;
  const boosters =
    source.boosters.map((booster) => booster.name).join(", ") || "—";
  const ability = source.abilities[0];
  const evolves = card.evolvesFromSlug ? `\`${card.evolvesFromSlug}\`` : "—";
  const attacks = card.attacks
    .map((attack) => {
      const mechanics =
        attack.effects.length > 0
          ? attack.effects
              .map((effect) => describeAttackEffect(effect))
              .join(" ")
          : "Sem efeito mecânico.";
      const text = attack.effectText
        ? attack.effectText
        : "Sem texto de efeito.";
      return `- **${attack.name}** — dano ${attack.damage ?? "—"} — custo ${costLabel(attack)}
  - Texto: ${text}
  - Batalha: ${mechanics}`;
    })
    .join("\n");

  return `## A1-${source.localId} ${card.name}

### Pokémon inspirado
- Carta: ${source.name} (${source.id})
- Tipo: ${originTypeLabel(originType)} (${originType}) → ${ENERGY_LABELS[card.energyType]}
- Estágio: ${sourceStageLabel(source.stage)}${source.evolveFrom ? `, evolui de ${source.evolveFrom}` : ""}
- HP: ${source.hp} | Recuo: ${source.retreat} | Fraqueza: ${weakness ? `${originTypeLabel(weakness)} +20` : "nenhuma"}
- Raridade: ${source.rarity}
- Boosters: ${boosters}
- Descrição: ${source.description ?? "—"}
- Arte oficial: ${source.imageUrl ?? "—"}
- Ataques:
${sourceAttacks(source)}
- Habilidade: ${ability ? `${ability.name} — ${ability.effect}` : "nenhuma"}

### Pokémon criado
- Nome: ${card.name}
- Slug: \`${card.slug}\`
- Membro: ${card.member.name} — ${card.member.trait}
- Tipo: ${ENERGY_LABELS[card.energyType]}
- Estágio: ${STAGE_LABELS[card.stage]} | Moldura: ${card.frame === "ex" ? "ex" : "normal"} | Raridade: ${RARITY_LABELS[card.rarity]}
- HP: ${card.hp} | Recuo: ${card.retreatCost} | Fraqueza: ${card.weaknessType ? `${ENERGY_LABELS[card.weaknessType]} +20` : "nenhuma"}
- Evolui de: ${evolves}
- Foto: nenhuma
- Flavor: ${card.flavorText}
${card.stageNote ? `- Ajuste de estágio: ${card.stageNote}\n` : ""}- Ataques:
${attacks}

### Notas para a imagem
Mantenha o corpo, as cores, a pose e o cenário de ${source.name}. Sem texto e sem moldura de carta.
Traços de ${card.member.name}: ${card.member.visual}
`;
}

function renderFusionsMarkdown(cards: FusedCard[]) {
  const ordered = [...cards].sort(
    (left, right) => Number(left.source.localId) - Number(right.source.localId),
  );
  const index = MEMBERS.map((member) => {
    const owned = ordered.filter((card) => card.member.id === member.id);
    const lines = owned
      .map(
        (card) =>
          `- ${card.name} — ${card.source.name} (A1-${card.source.localId})`,
      )
      .join("\n");
    return `### ${member.name}\n${member.trait}\n\n${lines}`;
  }).join("\n\n");

  return `# Fusões do Genetic Apex (A1)

${ordered.length} Pokémon oficiais do Genetic Apex, fundidos com o time. Nenhuma imagem foi gerada: as cartas ficam sem foto para a arte ser feita depois.

O tipo segue o Pokémon de origem (Planta vira Careca, Fogo vira DevOps, e assim por diante). Cada linha evolutiva inteira fica com a mesma pessoa.

## Índice por membro

${index}

## Cartas

${ordered.map(renderCard).join("\n")}
`;
}

export { renderFusionsMarkdown };
