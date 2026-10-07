import OpenAI from "openai";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { z } from "zod";
import { FRAMES, RARITIES, type EnergyType } from "@/lib/value-objects/card";
import type {
  CardIdea,
  CardIdeaGenerator,
  CardIdeaRequest,
} from "@/server/application/contracts/services/card-idea-generator";
import type { SourcePokemon } from "@/server/application/entities/source-pokemon";
import { fetchImageAsDataUri } from "@/server/infrastructure/services/remote-image";

const DEFAULT_MODEL = "gpt-5-mini";

const SYSTEM_PROMPT = `Você cria cartas para um jogo de cartas colecionáveis no estilo Pokémon TCG Pocket.
Cada carta é uma criatura original inspirada em uma pessoa real da equipe, combinando a aparência e a personalidade dela com um Pokémon de referência (quando houver).
Os tipos de energia do jogo são papéis profissionais, não elementos. Use somente os códigos de tipo fornecidos.

Regras:
- Escreva nome, ataques, efeitos e flavorText em português do Brasil. O imagePrompt deve ser em inglês.
- O nome deve ser original (nunca o nome exato de um Pokémon existente), curto (até 24 caracteres) e brincar com o nome ou traços da pessoa e com a referência.
- Quando houver Pokémon de referência, mantenha HP, recuo, quantidade de ataques e dano próximos aos dele, adaptando o tipo original para o tipo do jogo mais coerente com o perfil da pessoa.
- Sem referência, invente criaturas variadas entre si, coerentes com o perfil da pessoa.
- weaknessType deve ser diferente de energyType.
- Cada ataque tem nome curto (até 30 caracteres), custo de energia coerente com o dano (cerca de 1 energia a cada 20-30 de dano) e effectText opcional (string vazia quando não houver efeito, até 160 caracteres).
- flavorText tem até 180 caracteres e fala da criatura como numa Pokédex, com humor sobre a pessoa.
- Prefira raridades common, uncommon e rare. Use frame "ex" apenas com raridade double_rare ou superior.
- imagePrompt é uma instrução em inglês (até 700 caracteres) para um modelo de edição de imagem. Não peça texto, molduras ou bordas de carta.
  - Com Pokémon de referência, o modelo recebe a ilustração original desse Pokémon como base e deve mantê-la quase igual. Descreva o que preservar, olhando a arte anexada: espécie, formato do corpo, cores, pose e cenário de fundo. Depois liste de 2 a 4 traços visuais da pessoa para adicionar como detalhes sutis no Pokémon (ex.: careca, óculos redondos, barba rala, headset, camiseta vermelha). Nunca transforme o Pokémon em humano nem troque o fundo.
  - Sem referência, descreva uma criatura original e não humana no estilo das ilustrações de Pokémon (corpo, cores, pose e cenário de fundo), incorporando de 2 a 4 traços visuais da pessoa como características da criatura.`;

const LIMITS = {
  name: 40,
  attackName: 40,
  effectText: 280,
  flavorText: 280,
  imagePrompt: 1000,
};

class OpenAiCardIdeaGenerator implements CardIdeaGenerator {
  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  async generate(request: CardIdeaRequest): Promise<CardIdea[]> {
    const count = request.inspirations.length;
    if (count === 0) return [];
    const types = request.allowedTypes.map((type) => type.code);
    const [firstType, ...otherTypes] = types;
    if (!firstType) throw new Error("Nenhum tipo de energia cadastrado.");
    const schema = ideasSchema([firstType, ...otherTypes], count);
    const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
    delete jsonSchema.$schema;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: await buildUserContent(request) },
      ],
      text: {
        format: { type: "json_schema", name: "card_ideas", schema: jsonSchema, strict: true },
      },
    });

    const parsed = schema.safeParse(JSON.parse(response.output_text));
    if (!parsed.success) throw new Error("A IA retornou cartas em formato inválido.");
    return parsed.data.cards.map(toCardIdea);
  }
}

function ideasSchema(types: [EnergyType, ...EnergyType[]], count: number) {
  const energy = z.enum(types);
  return z.strictObject({
    cards: z
      .array(
        z.strictObject({
          name: z.string(),
          hp: z.int().min(30).max(250),
          energyType: energy,
          weaknessType: energy.nullable(),
          retreatCost: z.int().min(0).max(4),
          rarity: z.enum(RARITIES),
          frame: z.enum(FRAMES),
          flavorText: z.string(),
          attacks: z
            .array(
              z.strictObject({
                name: z.string(),
                damage: z.int().min(0).max(300).nullable(),
                effectText: z.string(),
                energyCost: z
                  .array(z.strictObject({ type: energy, count: z.int().min(1).max(4) }))
                  .min(1)
                  .max(3),
              }),
            )
            .min(1)
            .max(2),
          imagePrompt: z.string(),
        }),
      )
      .min(count)
      .max(count),
  });
}

async function buildUserContent(request: CardIdeaRequest): Promise<ResponseInputContent[]> {
  const content: ResponseInputContent[] = [
    { type: "input_text", text: buildUserPrompt(request) },
    { type: "input_text", text: "Foto da pessoa:" },
    {
      type: "input_image",
      image_url: await fetchImageAsDataUri(request.person.imageUrl),
      detail: "low",
    },
  ];
  for (const [index, inspiration] of request.inspirations.entries()) {
    if (!inspiration?.artworkUrl) continue;
    try {
      const image = await fetchImageAsDataUri(inspiration.artworkUrl);
      content.push(
        { type: "input_text", text: `Ilustração original do Pokémon da carta ${index + 1} (${inspiration.pokemon.name}):` },
        { type: "input_image", image_url: image, detail: "low" },
      );
    } catch {
      continue;
    }
  }
  return content;
}

function buildUserPrompt(request: CardIdeaRequest) {
  const types = request.allowedTypes.map((type) => `- ${type.code}: ${type.name}`).join("\n");
  const slots = request.inspirations
    .map((inspiration, index) =>
      inspiration
        ? `Carta ${index + 1}: inspirada em ${describeInspiration(inspiration.pokemon)}`
        : `Carta ${index + 1}: criatura livre, sem Pokémon de referência.`,
    )
    .join("\n");
  return `Pessoa: ${request.person.name}
Descrição da pessoa: ${request.person.description}

Tipos de energia disponíveis (código: nome):
${types}

Gere exatamente ${request.inspirations.length} carta(s), na mesma ordem:
${slots}`;
}

function describeInspiration(source: SourcePokemon) {
  return JSON.stringify({
    name: source.name,
    hp: source.hp,
    types: source.types,
    stage: source.stage,
    description: source.description,
    attacks: source.attacks,
    abilities: source.abilities,
    weaknesses: source.weaknesses,
    retreat: source.retreat,
  });
}

function toCardIdea(card: z.infer<ReturnType<typeof ideasSchema>>["cards"][number]): CardIdea {
  return {
    name: clip(card.name, LIMITS.name) || "Criatura misteriosa",
    hp: Math.round(card.hp / 10) * 10,
    energyType: card.energyType,
    weaknessType: card.weaknessType === card.energyType ? null : card.weaknessType,
    retreatCost: card.retreatCost,
    rarity: card.rarity,
    frame: card.frame,
    flavorText: clip(card.flavorText, LIMITS.flavorText),
    attacks: card.attacks.map((attack) => ({
      name: clip(attack.name, LIMITS.attackName) || "Ataque",
      damage: attack.damage === null ? null : Math.round(attack.damage / 10) * 10,
      effectText: clip(attack.effectText, LIMITS.effectText),
      energyCost: attack.energyCost,
    })),
    imagePrompt: clip(card.imagePrompt, LIMITS.imagePrompt),
  };
}

function clip(value: string, max: number) {
  return value.trim().slice(0, max).trim();
}

export { OpenAiCardIdeaGenerator };
