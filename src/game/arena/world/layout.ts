import {
  createMapProps,
  destroyMapProps,
  layoutMapProps,
  type MapProps,
} from "@/game/arena/entities/map-props";
import {
  createObstacle,
  destroyObstacles,
  placeObstacle,
  type Obstacle,
} from "@/game/arena/entities/obstacle";
import { placePlayer, type Player } from "@/game/arena/entities/player";
import {
  createWaterFx,
  destroyWaterFx,
  layoutWaterFx,
  type WaterFx,
} from "@/game/arena/entities/water-fx";
import type { Point } from "@/lib/arena/combat";
import type { ArenaMap } from "@/lib/arena/map";
import { isWaterAt, mapTerrain, toWorldRect, type TerrainZone } from "@/lib/arena/terrain";
import { arenaWorldSize } from "@/lib/arena/world-size";
import Phaser from "phaser";

const ZONE_DEBUG_DEPTH = 9;

// Corpo estático invisível de uma zona de terreno (água ou rocha).
type TerrainBody = {
  zone: TerrainZone;
  body: Phaser.GameObjects.Rectangle;
};

type ArenaWorld = {
  map: ArenaMap;
  // Zonas do mapa já somadas (manuais + áreas do editor).
  zones: TerrainZone[];
  background: Phaser.GameObjects.Image;
  obstacles: Obstacle[];
  terrain: TerrainBody[];
  water: WaterFx | null;
  props: MapProps | null;
  zoneDebug: Phaser.GameObjects.Graphics | null;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
};

type FighterAnchors = {
  playerX: number;
  playerY: number;
  opponentX: number;
  opponentY: number;
};

// /arena-check?zones=1 desenha as zonas por cima da arte para conferir medidas.
function zoneDebugEnabled() {
  if (typeof window === "undefined" || window.location.pathname !== "/arena-check") return false;
  return new URLSearchParams(window.location.search).get("zones") === "1";
}

function createArenaWorld(scene: Phaser.Scene, map: ArenaMap): ArenaWorld {
  const background = scene.add.image(0, 0, map.background.key);
  if (map.background.pixelArt) {
    scene.textures.get(map.background.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const obstacles = map.obstacles.map((spec, index) =>
    createObstacle(scene, spec, (index + 1) * 0x9e3779b1, map.obstacleTheme),
  );
  const zones = mapTerrain(map);
  const terrain = zones.map((zone) => {
    const body = scene.add.rectangle(0, 0, 1, 1).setOrigin(0, 0).setVisible(false);
    scene.physics.add.existing(body, true);
    return { zone, body };
  });
  const world: ArenaWorld = {
    map,
    zones,
    background,
    obstacles,
    terrain,
    water: createWaterFx(scene, zones, map.ambient?.fish ?? false),
    props: null,
    zoneDebug: zoneDebugEnabled() ? scene.add.graphics().setDepth(ZONE_DEBUG_DEPTH) : null,
    sourceWidth: background.width,
    sourceHeight: background.height,
    width: 0,
    height: 0,
  };
  if (map.props?.length) {
    world.props = createMapProps(scene, map.props, (at) => worldIsWater(world, at));
  }
  return world;
}

function worldIsWater(world: ArenaWorld, at: Point) {
  if (world.width <= 0 || world.height <= 0) return false;
  return isWaterAt(at, world.zones, world);
}

// Spawn do mapa (fração da arte) ou o padrão nas laterais do centro.
function mapSpawn(world: ArenaWorld) {
  const spawn = world.map.spawn;
  if (!spawn || world.width <= 0) return null;
  return {
    player: { x: spawn.player.x * world.width, y: spawn.player.y * world.height },
    opponent: { x: spawn.opponent.x * world.width, y: spawn.opponent.y * world.height },
  };
}

function drawZoneDebug(world: ArenaWorld) {
  const graphics = world.zoneDebug;
  if (!graphics) return;
  graphics.clear();
  for (const { zone } of world.terrain) {
    const rect = toWorldRect(zone.rect, world);
    const color = zone.kind === "water" ? 0x2a7bff : 0xff3a3a;
    graphics.fillStyle(color, 0.3).fillRect(rect.x, rect.y, rect.width, rect.height);
    graphics.lineStyle(2, color, 0.9).strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
}

function destroyArenaWorld(scene: Phaser.Scene, world: ArenaWorld) {
  destroyObstacles(scene, world.obstacles);
  world.terrain.forEach(({ body }) => body.destroy());
  if (world.water) destroyWaterFx(world.water);
  if (world.props) destroyMapProps(world.props);
  world.zoneDebug?.destroy();
}

function layoutArena(
  scene: Phaser.Scene,
  world: ArenaWorld,
  anchors: FighterAnchors,
  player: Player | null,
  opponent: Player | null,
): FighterAnchors {
  const size = arenaWorldSize(
    scene.scale.width,
    scene.scale.height,
    world.sourceWidth,
    world.sourceHeight,
  );
  if (size.width === 0 || size.height === 0) return anchors;

  const next = { ...anchors };
  if (world.width > 0 && world.height > 0) {
    if (player) {
      next.playerX = player.sprite.x / world.width;
      next.playerY = player.sprite.y / world.height;
    }
    if (opponent) {
      next.opponentX = opponent.sprite.x / world.width;
      next.opponentY = opponent.sprite.y / world.height;
    }
  }

  world.background
    .setPosition(size.width / 2, size.height / 2)
    .setDisplaySize(size.width, size.height);
  const inset = world.map.walkInset;
  scene.physics.world.setBounds(
    inset.left,
    inset.top,
    Math.max(size.width - inset.left - inset.right, 1),
    Math.max(size.height - inset.top - inset.bottom, 1),
  );
  scene.cameras.main.setBounds(0, 0, size.width, size.height);
  world.width = size.width;
  world.height = size.height;

  world.obstacles.forEach((obstacle) => {
    placeObstacle(scene, obstacle, size.width * obstacle.spec.x, size.height * obstacle.spec.y);
  });
  world.terrain.forEach(({ zone, body }) => {
    const rect = toWorldRect(zone.rect, size);
    body.setPosition(rect.x, rect.y).setSize(rect.width, rect.height);
    if (body.body instanceof Phaser.Physics.Arcade.StaticBody) body.body.updateFromGameObject();
  });
  if (world.water) layoutWaterFx(scene, world.water, size);
  if (world.props) layoutMapProps(world.props, size);
  drawZoneDebug(world);

  if (player) {
    placePlayer(player, size.width * next.playerX, size.height * next.playerY);
    scene.cameras.main.centerOn(player.sprite.x, player.sprite.y);
  }
  if (opponent) {
    placePlayer(opponent, size.width * next.opponentX, size.height * next.opponentY);
  }

  return next;
}

export { createArenaWorld, destroyArenaWorld, layoutArena, mapSpawn, worldIsWater };
export type { ArenaWorld, FighterAnchors, TerrainBody };
