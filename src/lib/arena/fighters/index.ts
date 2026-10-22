import type { ArenaFighter } from "@/lib/arena/fighter";

import { antoniomander } from "./antoniomander";
import { calvossauro } from "./calvossauro";

const ARENA_FIGHTERS: readonly ArenaFighter[] = [antoniomander, calvossauro];

function findFighter(id: string | null) {
  if (!id) return null;
  return ARENA_FIGHTERS.find((fighter) => fighter.id === id) ?? null;
}

export { ARENA_FIGHTERS, findFighter };
