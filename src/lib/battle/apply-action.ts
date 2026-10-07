import type { BattleAction } from "@/lib/battle/battle-action";
import type { BattleEvent } from "@/lib/battle/battle-event";
import {
  applyAttackEffects,
  attackSucceeds,
  dealDamage,
  drawCards,
  extraDamage,
} from "@/lib/battle/attack-effects";
import { canPay } from "@/lib/battle/energy-cost";
import {
  allInPlay,
  cardOf,
  cloneState,
  findPokemon,
  isKnockedOut,
  isOpeningTurn,
  isPlayersFirstTurn,
  prizePoints,
} from "@/lib/battle/helpers";
import { flipCoin, pickRandom } from "@/lib/battle/rng";
import {
  CONFUSION_DAMAGE,
  MAX_BENCH,
  MAX_TURNS,
  POINTS_TO_WIN,
  otherSide,
  type BattleState,
  type PokemonInPlay,
  type Side,
} from "@/lib/battle/battle-state";
import {
  canAttack,
  canRetreat,
  checkup,
  clearStatus,
  hasStatus,
} from "@/lib/battle/status-conditions";

type ApplyResult =
  | { ok: true; state: BattleState; events: BattleEvent[] }
  | { ok: false; error: string };

function applyAction(state: BattleState, side: Side, action: BattleAction): ApplyResult {
  if (state.winner) return fail("A batalha já terminou.");
  const next = cloneState(state);
  const events: BattleEvent[] = [];
  try {
    runAction(next, side, action, events);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Jogada inválida.");
  }
  return { ok: true, state: next, events };
}

function runAction(state: BattleState, side: Side, action: BattleAction, events: BattleEvent[]) {
  if (action.type === "setup") return applySetup(state, side, action.activeUid, action.benchUids, events);
  if (action.type === "promote") return applyPromote(state, side, action.benchUid, events);
  if (state.phase !== "main") throw new Error("Não é hora dessa jogada.");
  if (state.current !== side) throw new Error("Não é o seu turno.");
  switch (action.type) {
    case "attach_energy":
      return applyAttach(state, side, action.targetUid, events);
    case "play_basic":
      return applyPlayBasic(state, side, action.handUid, events);
    case "evolve":
      return applyEvolve(state, side, action.handUid, action.targetUid, events);
    case "retreat":
      return applyRetreat(state, side, action.benchUid, events);
    case "attack":
      return applyAttack(state, side, action.attackIndex, events);
    case "end_turn":
      return endTurn(state, events);
  }
}

function applySetup(
  state: BattleState,
  side: Side,
  activeUid: string,
  benchUids: string[],
  events: BattleEvent[],
) {
  if (state.phase !== "setup") throw new Error("A preparação já terminou.");
  const mine = state.sides[side];
  if (mine.setupDone) throw new Error("Você já posicionou seus Pokémon.");
  if (benchUids.length > MAX_BENCH) throw new Error("O banco aceita no máximo 3 Pokémon.");
  const chosen = [activeUid, ...benchUids];
  if (new Set(chosen).size !== chosen.length) throw new Error("Não repita o mesmo Pokémon.");
  const basics = chosen.map((uid) => {
    const card = takeFromHand(mine.hand, uid);
    if (state.cards[card.cardId]?.stage !== "basic") throw new Error("Só Pokémon Básicos entram no início.");
    return toPokemon(uid, card.cardId, 0);
  });
  mine.active = basics[0];
  mine.bench = basics.slice(1);
  mine.setupDone = true;
  events.push({ type: "pokemon_played", side, uid: mine.active.uid, cardId: mine.active.cardId, zone: "active" });
  for (const pokemon of mine.bench) {
    events.push({ type: "pokemon_played", side, uid: pokemon.uid, cardId: pokemon.cardId, zone: "bench" });
  }
  if (state.sides.player.setupDone && state.sides.cpu.setupDone) {
    state.phase = "main";
    startTurn(state, events);
  }
}

function applyAttach(state: BattleState, side: Side, targetUid: string, events: BattleEvent[]) {
  const mine = state.sides[side];
  const energy = mine.currentEnergy;
  if (!energy) throw new Error("Não há energia para anexar.");
  const pokemon = findPokemon(mine, targetUid);
  if (!pokemon) throw new Error("Pokémon não encontrado.");
  pokemon.energies.push(energy);
  mine.currentEnergy = null;
  events.push({ type: "energy_attached", side, uid: pokemon.uid, energy });
}

function applyPlayBasic(state: BattleState, side: Side, handUid: string, events: BattleEvent[]) {
  const mine = state.sides[side];
  if (mine.bench.length >= MAX_BENCH) throw new Error("O banco está cheio.");
  const card = takeFromHand(mine.hand, handUid);
  if (state.cards[card.cardId]?.stage !== "basic") throw new Error("Só Pokémon Básicos entram no banco.");
  const pokemon = toPokemon(handUid, card.cardId, state.turn);
  mine.bench.push(pokemon);
  events.push({ type: "pokemon_played", side, uid: pokemon.uid, cardId: pokemon.cardId, zone: "bench" });
}

function applyEvolve(state: BattleState, side: Side, handUid: string, targetUid: string, events: BattleEvent[]) {
  if (isPlayersFirstTurn(state)) throw new Error("Não é possível evoluir no primeiro turno.");
  const mine = state.sides[side];
  const target = findPokemon(mine, targetUid);
  if (!target) throw new Error("Pokémon não encontrado.");
  if (target.playedTurn === state.turn) throw new Error("Esse Pokémon acabou de entrar em jogo.");
  const card = takeFromHand(mine.hand, handUid);
  const data = state.cards[card.cardId];
  if (data.evolvesFromId !== target.cardId) throw new Error("Essa carta não evolui deste Pokémon.");
  const fromCardId = target.cardId;
  mine.discard.push(fromCardId);
  target.stack.push(card.cardId);
  target.cardId = card.cardId;
  target.playedTurn = state.turn;
  clearStatus(target, side, events);
  events.push({ type: "evolved", side, uid: target.uid, fromCardId, toCardId: card.cardId });
}

function applyRetreat(state: BattleState, side: Side, benchUid: string, events: BattleEvent[]) {
  const mine = state.sides[side];
  if (mine.retreated) throw new Error("Você já recuou neste turno.");
  const active = mine.active;
  if (!active) throw new Error("Não há Pokémon Ativo.");
  if (!canRetreat(active)) throw new Error("Esse Pokémon não pode recuar.");
  const cost = cardOf(state, active).retreatCost;
  if (active.energies.length < cost) throw new Error("Energia insuficiente para recuar.");
  const incoming = mine.bench.find((pokemon) => pokemon.uid === benchUid);
  if (!incoming) throw new Error("Pokémon do banco não encontrado.");
  if (cost > 0) {
    active.energies.splice(active.energies.length - cost, cost);
    events.push({ type: "energy_discarded", side, uid: active.uid, count: cost });
  }
  mine.bench = mine.bench.filter((pokemon) => pokemon.uid !== benchUid);
  mine.bench.push(active);
  mine.active = incoming;
  mine.retreated = true;
  events.push({ type: "retreated", side, fromUid: active.uid, toUid: incoming.uid });
}

function applyAttack(state: BattleState, side: Side, attackIndex: number, events: BattleEvent[]) {
  if (isOpeningTurn(state)) throw new Error("Quem começa não ataca no primeiro turno.");
  const mine = state.sides[side];
  const foe = state.sides[otherSide(side)];
  const attacker = mine.active;
  const defender = foe.active;
  if (!attacker || !defender) throw new Error("Não há Pokémon Ativo.");
  if (!canAttack(attacker)) throw new Error("Esse Pokémon não pode atacar.");
  const attack = cardOf(state, attacker).attacks[attackIndex];
  if (!attack) throw new Error("Ataque inválido.");
  if (!canPay(attacker.energies, attack.energyCost)) throw new Error("Energia insuficiente.");
  events.push({ type: "attack", side, uid: attacker.uid, attackName: attack.name });

  if (hasStatus(attacker, "confused")) {
    const heads = flipCoin(state);
    events.push({ type: "coin_flip", side, heads });
    if (!heads) {
      events.push({ type: "attack_failed", side, uid: attacker.uid, reason: "confused" });
      attacker.damage += CONFUSION_DAMAGE;
      events.push({ type: "damage", side, uid: attacker.uid, amount: CONFUSION_DAMAGE, weakness: false });
      return finishAction(state, events, true);
    }
  }

  if (!attackSucceeds(state, attack.effects, events, side)) {
    events.push({ type: "attack_failed", side, uid: attacker.uid, reason: "coin" });
    return finishAction(state, events, true);
  }

  const extra = extraDamage(state, attacker, attack.effects, events, side);
  const weakness = Boolean(defender && cardOf(state, defender).weaknessType === cardOf(state, attacker).energyType);
  const weaknessBonus = weakness ? cardOf(state, defender).weaknessModifier : 0;
  const amount = (attack.damage ?? 0) + extra + weaknessBonus;
  if (amount > 0) {
    dealDamage({ state, attacker, defender, side, amount, weakness, events });
  }
  applyAttackEffects({ state, side, attacker, defender, effects: attack.effects, events });
  finishAction(state, events, true);
}

function applyPromote(state: BattleState, side: Side, benchUid: string, events: BattleEvent[]) {
  if (state.phase !== "promote" || !state.pendingPromotion.includes(side)) {
    throw new Error("Não é hora de promover um Pokémon.");
  }
  const mine = state.sides[side];
  if (mine.active) throw new Error("Já existe um Pokémon Ativo.");
  const index = mine.bench.findIndex((pokemon) => pokemon.uid === benchUid);
  if (index === -1) throw new Error("Pokémon do banco não encontrado.");
  mine.active = mine.bench[index];
  mine.bench.splice(index, 1);
  state.pendingPromotion = state.pendingPromotion.filter((item) => item !== side);
  events.push({ type: "promoted", side, uid: mine.active.uid });
  if (state.pendingPromotion.length > 0) return;
  state.phase = "main";
  if (state.awaitingTurnAdvance) {
    state.awaitingTurnAdvance = false;
    passTurn(state, events);
  }
}

function endTurn(state: BattleState, events: BattleEvent[]) {
  finishAction(state, events, true);
}

function finishAction(state: BattleState, events: BattleEvent[], turnShouldEnd: boolean) {
  resolveKnockouts(state, events);
  if (state.winner) return;
  if (state.pendingPromotion.length > 0) {
    state.phase = "promote";
    state.awaitingTurnAdvance = turnShouldEnd;
    return;
  }
  if (turnShouldEnd) passTurn(state, events);
}

function passTurn(state: BattleState, events: BattleEvent[]) {
  if (!state.checkupDone) {
    checkup(state, state.current, events);
    state.checkupDone = true;
    resolveKnockouts(state, events);
    if (state.winner) return;
    if (state.pendingPromotion.length > 0) {
      state.phase = "promote";
      state.awaitingTurnAdvance = true;
      return;
    }
  }
  actuallyAdvance(state, events);
}

function actuallyAdvance(state: BattleState, events: BattleEvent[]) {
  if (state.turn >= MAX_TURNS) {
    finishByPoints(state, events);
    return;
  }
  state.checkupDone = false;
  state.awaitingTurnAdvance = false;
  state.current = otherSide(state.current);
  startTurn(state, events);
}

function startTurn(state: BattleState, events: BattleEvent[]) {
  state.turn += 1;
  state.phase = "main";
  state.awaitingTurnAdvance = false;
  state.checkupDone = false;
  const side = state.current;
  const mine = state.sides[side];
  mine.retreated = false;
  mine.currentEnergy = null;
  if (mine.active) mine.active.preventDamage = false;
  events.push({ type: "turn_start", side, turn: state.turn });
  drawCards(state, side, 1, events);
  if (!isOpeningTurn(state)) {
    const energy = pickRandom(state, mine.energyTypes);
    if (energy) {
      mine.currentEnergy = energy;
      events.push({ type: "energy_generated", side, energy });
    }
  }
}

function resolveKnockouts(state: BattleState, events: BattleEvent[]) {
  for (const side of ["player", "cpu"] as const) {
    const mine = state.sides[side];
    const fallen = allInPlay(mine).filter((pokemon) => isKnockedOut(state, pokemon));
    for (const pokemon of fallen) knockOut(state, side, pokemon, events);
    if (state.winner) return;
    if (!mine.active && mine.bench.length === 0 && mine.setupDone) {
      endGame(state, otherSide(side), events);
      return;
    }
    if (!mine.active && mine.bench.length > 0 && !state.pendingPromotion.includes(side)) {
      state.pendingPromotion.push(side);
    }
  }
}

function knockOut(state: BattleState, side: Side, pokemon: PokemonInPlay, events: BattleEvent[]) {
  const mine = state.sides[side];
  const points = prizePoints(cardOf(state, pokemon));
  mine.discard.push(...pokemon.stack);
  if (mine.active?.uid === pokemon.uid) mine.active = null;
  mine.bench = mine.bench.filter((item) => item.uid !== pokemon.uid);
  const scorer = otherSide(side);
  state.sides[scorer].points += points;
  events.push({ type: "knocked_out", side, uid: pokemon.uid, cardId: pokemon.cardId, points });
  if (state.sides[scorer].points >= POINTS_TO_WIN) endGame(state, scorer, events);
}

function endGame(state: BattleState, winner: Side, events: BattleEvent[]) {
  state.winner = winner;
  state.phase = "finished";
  events.push({ type: "game_over", winner });
}

function finishByPoints(state: BattleState, events: BattleEvent[]) {
  const player = state.sides.player.points;
  const cpu = state.sides.cpu.points;
  state.phase = "finished";
  state.winner = player === cpu ? "draw" : player > cpu ? "player" : "cpu";
  events.push({ type: "game_over", winner: state.winner });
}

function takeFromHand(hand: { uid: string; cardId: string }[], uid: string) {
  const index = hand.findIndex((card) => card.uid === uid);
  if (index === -1) throw new Error("Carta não está na mão.");
  const [card] = hand.splice(index, 1);
  return card;
}

function toPokemon(uid: string, cardId: string, playedTurn: number): PokemonInPlay {
  return {
    uid,
    cardId,
    stack: [cardId],
    damage: 0,
    energies: [],
    status: [],
    playedTurn,
    preventDamage: false,
  };
}

function fail(error: string): ApplyResult {
  return { ok: false, error };
}

export { applyAction };
export type { ApplyResult };
