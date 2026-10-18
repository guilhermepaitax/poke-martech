const EFFECT_TEXT: Record<string, string> = {
  "Heal 30 damage from this Pokémon.": "Cure 30 de dano deste Pokémon.",
  "Heal 10 damage from this Pokémon.": "Cure 10 de dano deste Pokémon.",
  "Heal from this Pokémon the same amount of damage you did to your opponent's Active Pokémon.":
    "Cure deste Pokémon a mesma quantidade de dano que você causou ao Pokémon Ativo do oponente.",
  "Put 1 random {G} Pokémon from your deck into your hand.":
    "Coloque 1 Pokémon Careca aleatório do seu baralho na sua mão.",
  "Your opponent's Active Pokémon is now Asleep.":
    "O Pokémon Ativo do oponente agora está Adormecido.",
  "Your opponent's Active Pokémon is now Poisoned.":
    "O Pokémon Ativo do oponente agora está Envenenado.",
  "Flip a coin. If heads, this attack does 30 more damage.":
    "Jogue uma moeda. Se sair cara, este ataque causa 30 de dano a mais.",
  "Flip a coin. If heads, this attack does 40 more damage.":
    "Jogue uma moeda. Se sair cara, este ataque causa 40 de dano a mais.",
  "Flip 2 coins. This attack does 50 damage for each heads.":
    "Jogue 2 moedas. Este ataque causa 50 de dano para cada cara.",
  "Flip 2 coins. This attack does 30 damage for each heads.":
    "Jogue 2 moedas. Este ataque causa 30 de dano para cada cara.",
  "Flip 2 coins. This attack does 80 damage for each heads.":
    "Jogue 2 moedas. Este ataque causa 80 de dano para cada cara.",
  "Flip 2 coins. This attack does 100 damage for each heads.":
    "Jogue 2 moedas. Este ataque causa 100 de dano para cada cara.",
  "Flip 4 coins. This attack does 40 damage for each heads.":
    "Jogue 4 moedas. Este ataque causa 40 de dano para cada cara.",
  "Flip 4 coins. This attack does 50 damage for each heads.":
    "Jogue 4 moedas. Este ataque causa 50 de dano para cada cara.",
  "Flip 2 coins. If both of them are heads, this attack does 80 more damage.":
    "Jogue 2 moedas. Se as duas forem cara, este ataque causa 80 de dano a mais.",
  "Flip a coin. If tails, this attack does nothing.":
    "Jogue uma moeda. Se sair coroa, este ataque não faz nada.",
  "Flip a coin. If heads, this attack does 40 more damage. If tails, this Pokémon also does 20 damage to itself.":
    "Jogue uma moeda. Se sair cara, este ataque causa 40 de dano a mais. Se sair coroa, este Pokémon também sofre 20 de dano.",
  "Flip a coin. If heads, your opponent's Active Pokémon is now Paralyzed.":
    "Jogue uma moeda. Se sair cara, o Pokémon Ativo do oponente agora está Paralisado.",
  "Flip a coin. If heads, the Defending Pokémon can't attack during your opponent's next turn.":
    "Jogue uma moeda. Se sair cara, o Pokémon Ativo do oponente não pode atacar durante o próximo turno dele.",
  "Flip a coin. If heads, during your opponent's next turn, prevent all damage from-and effects of-attacks done to this Pokémon.":
    "Jogue uma moeda. Se sair cara, previna todo o dano e os efeitos de ataques causados a este Pokémon durante o próximo turno do oponente.",
  "Flip a coin until you get tails. This attack does 60 damage for each heads.":
    "Jogue uma moeda até sair coroa. Este ataque causa 60 de dano para cada cara.",
  "Flip a coin. If heads, discard a random Energy from your opponent's Active Pokémon.":
    "Jogue uma moeda. Se sair cara, descarte 1 Energia aleatória do Pokémon Ativo do oponente.",
  "Flip a coin. If heads, discard a random card from your opponent's hand.":
    "Jogue uma moeda. Se sair cara, descarte 1 carta aleatória da mão do oponente.",
  "Flip a coin. If heads, your opponent shuffles their Active Pokémon into their deck.":
    "Jogue uma moeda. Se sair cara, o oponente embaralha o Pokémon Ativo no baralho dele.",
  "Take a {G} Energy from your Energy Zone and attach it to 1 of your Benched {G} Pokémon.":
    "Pegue 1 Energia Careca da sua Zona de Energia e anexe a 1 dos seus Pokémon Careca no Banco.",
  "Take 1 {M} Energy from your Energy Zone and attach it to this Pokémon.":
    "Pegue 1 Energia Testes Automatizados da sua Zona de Energia e anexe a este Pokémon.",
  "Flip 3 coins. Take an amount of {R} Energy from your Energy Zone equal to the number of heads and attach it to your Benched {R} Pokémon in any way you like.":
    "Jogue 3 moedas. Pegue Energias DevOps da sua Zona de Energia iguais ao número de caras e anexe aos seus Pokémon DevOps no Banco como quiser.",
  "Discard a {R} Energy from this Pokémon.":
    "Descarte 1 Energia DevOps deste Pokémon.",
  "Discard 1 {R} Energy from this Pokémon.":
    "Descarte 1 Energia DevOps deste Pokémon.",
  "Discard 2 {R} Energy from this Pokémon.":
    "Descarte 2 Energias DevOps deste Pokémon.",
  "Discard 2 {P} Energy from this Pokémon.":
    "Descarte 2 Energias Frontend deste Pokémon.",
  "Discard all Energy from this Pokémon.":
    "Descarte todas as Energias deste Pokémon.",
  "Discard a random Energy from your opponent's Active Pokémon.":
    "Descarte 1 Energia aleatória do Pokémon Ativo do oponente.",
  "This Pokémon also does 20 damage to itself.":
    "Este Pokémon também sofre 20 de dano.",
  "This Pokémon also does 50 damage to itself.":
    "Este Pokémon também sofre 50 de dano.",
  "This attack also does 10 damage to each of your opponent's Benched Pokémon.":
    "Este ataque também causa 10 de dano a cada Pokémon no Banco do oponente.",
  "This attack does 30 damage to 1 of your opponent's Benched Pokémon.":
    "Este ataque causa 30 de dano a 1 Pokémon no Banco do oponente.",
  "This attack also does 30 damage to 1 of your Benched Pokémon.":
    "Este ataque também causa 30 de dano a 1 dos seus Pokémon no Banco.",
  "This attack does 50 damage to 1 of your opponent's Pokémon.":
    "Este ataque causa 50 de dano a 1 Pokémon do oponente.",
  "This attack does 30 damage to 1 of your opponent's Pokémon.":
    "Este ataque causa 30 de dano a 1 Pokémon do oponente.",
  "If this Pokémon has at least 2 extra {W} Energy attached, this attack does 60 more damage.":
    "Se este Pokémon tiver pelo menos 2 Energias UX/UI extras, este ataque causa 60 de dano a mais.",
  "If this Pokémon has at least 3 extra {W} Energy attached, this attack does 70 more damage.":
    "Se este Pokémon tiver pelo menos 3 Energias UX/UI extras, este ataque causa 70 de dano a mais.",
  "Your opponent can't use any Supporter cards from their hand during their next turn.":
    "O oponente não pode usar cartas de Apoiador da mão durante o próximo turno dele.",
  "During your opponent's next turn, the Defending Pokémon can't attack.":
    "Durante o próximo turno do oponente, o Pokémon Ativo dele não pode atacar.",
  "During your opponent's next turn, the Defending Pokémon can't retreat.":
    "Durante o próximo turno do oponente, o Pokémon Ativo dele não pode recuar.",
  "During your opponent's next turn, this Pokémon takes -20 damage from attacks.":
    "Durante o próximo turno do oponente, este Pokémon sofre -20 de dano dos ataques.",
  "During your opponent's next turn, attacks used by the Defending Pokémon do -20 damage.":
    "Durante o próximo turno do oponente, os ataques do Pokémon Ativo dele causam -20 de dano.",
  "If your opponent's Active Pokémon has damage on it, this attack does 60 more damage.":
    "Se o Pokémon Ativo do oponente tiver dano, este ataque causa 60 de dano a mais.",
  "If this Pokémon has damage on it, this attack does 60 more damage.":
    "Se este Pokémon tiver dano, este ataque causa 60 de dano a mais.",
  "If your opponent's Active Pokémon is Poisoned, this attack does 50 more damage.":
    "Se o Pokémon Ativo do oponente estiver Envenenado, este ataque causa 50 de dano a mais.",
  "This attack does 30 damage for each of your Benched {L} Pokémon.":
    "Este ataque causa 30 de dano para cada Pokémon Full Stack seu no Banco.",
  "This attack does 30 more damage for each Energy attached to your opponent's Active Pokémon.":
    "Este ataque causa 30 de dano a mais para cada Energia no Pokémon Ativo do oponente.",
  "This attack does 20 more damage for each Energy attached to your opponent's Active Pokémon.":
    "Este ataque causa 20 de dano a mais para cada Energia no Pokémon Ativo do oponente.",
  "This attack does 30 damage for each of your Benched Pokémon.":
    "Este ataque causa 30 de dano para cada Pokémon seu no Banco.",
  "This attack does 50 more damage for each of your Benched Nidoking.":
    "Este ataque causa 50 de dano a mais para cada Nidoking seu no Banco.",
  "Switch this Pokémon with 1 of your Benched Pokémon.":
    "Troque este Pokémon por 1 dos seus Pokémon no Banco.",
  "Switch out your opponent's Active Pokémon to the Bench. (Your opponent chooses the new Active Pokémon.)":
    "Mande o Pokémon Ativo do oponente para o Banco. (O oponente escolhe o novo Ativo.)",
  "Put 1 random Nidoran♂ from your deck onto your Bench.":
    "Coloque 1 Nidoran♂ aleatório do seu baralho no seu Banco.",
  "Draw a card.": "Compre 1 carta.",
  "1 of your opponent's Pokémon is chosen at random 4 times. For each time a Pokémon was chosen, do 50 damage to it.":
    "1 Pokémon do oponente é escolhido ao acaso 4 vezes. Para cada vez que um Pokémon for escolhido, cause 50 de dano a ele.",
  "Choose 1 of your opponent's Pokémon's attacks and use it as this attack. If this Pokémon doesn't have the necessary Energy to use that attack, this attack does nothing.":
    "Escolha 1 ataque de um Pokémon do oponente e use-o como este ataque. Se este Pokémon não tiver a Energia necessária, este ataque não faz nada.",
};

function normalizeEffect(text: string) {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/[—–−]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function translateEffect(effect: string) {
  const text = EFFECT_TEXT[normalizeEffect(effect)];
  if (!text) throw new Error(`Efeito sem tradução: ${effect}`);
  return text;
}

function printedDamage(damage: string | null) {
  if (!damage) return null;
  if (/[×x]$/i.test(damage)) return null;
  const amount = Number(damage.replace(/\+$/g, ""));
  if (!Number.isInteger(amount)) return null;
  return amount;
}

function parseEffect(effect: string | null) {
  if (!effect?.trim()) return "";
  return translateEffect(effect);
}

export {
  EFFECT_TEXT,
  normalizeEffect,
  parseEffect,
  printedDamage,
  translateEffect,
};
