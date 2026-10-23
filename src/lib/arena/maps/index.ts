import type { ArenaMap } from "@/lib/arena/map";

import { arenaDaSelva } from "./arena-da-selva";
import { ilhaDasEstrelas } from "./ilha-das-estrelas";

const ARENA_MAPS: readonly ArenaMap[] = [arenaDaSelva, ilhaDasEstrelas];

const DEFAULT_MAP = arenaDaSelva;

function findMap(id: string | null) {
  if (!id) return null;
  return ARENA_MAPS.find((map) => map.id === id) ?? null;
}

export { ARENA_MAPS, DEFAULT_MAP, findMap };
