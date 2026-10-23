import type { ArenaFighter } from "@/lib/arena/fighter";

import { antoniomander } from "./antoniomander";
import { calvossauro } from "./calvossauro";
import { douguitoryu } from "./douguitoryu";
import { joaovee } from "./joaovee";
import { papaitaxone } from "./papaitaxone";

const ARENA_FIGHTERS: readonly ArenaFighter[] = [
  antoniomander,
  calvossauro,
  papaitaxone,
  joaovee,
  douguitoryu,
];

function findFighter(id: string | null) {
  if (!id) return null;
  return ARENA_FIGHTERS.find((fighter) => fighter.id === id) ?? null;
}

export { ARENA_FIGHTERS, findFighter };
