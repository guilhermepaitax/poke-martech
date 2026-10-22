import type { ArenaFighter } from "@/lib/arena/fighter";

import { antoniomander } from "./antoniomander";
import { calvossauro } from "./calvossauro";
import { papaitaxone } from "./papaitaxone";

const ARENA_FIGHTERS: readonly ArenaFighter[] = [antoniomander, calvossauro, papaitaxone];

function findFighter(id: string | null) {
  if (!id) return null;
  return ARENA_FIGHTERS.find((fighter) => fighter.id === id) ?? null;
}

export { ARENA_FIGHTERS, findFighter };
