import Phaser from "phaser";

const SCROLL_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

type ArenaKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
  shift: Phaser.Input.Keyboard.Key;
};

type ArenaPointerBinding = {
  onPrimaryDown: (worldX: number, worldY: number) => void;
  onPrimaryUp: (worldX: number, worldY: number) => void;
  onPointerActivity: () => void;
  onWheel: (deltaY: number) => void;
};

function axis(negative: boolean, positive: boolean) {
  if (negative === positive) return 0;
  return positive ? 1 : -1;
}

function bindArenaKeys(scene: Phaser.Scene) {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return null;
  return keyboard.addKeys(
    {
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    },
    false,
  ) as ArenaKeys;
}

function readMoveAxes(keys: ArenaKeys) {
  return {
    x: axis(
      keys.left.isDown || keys.A.isDown,
      keys.right.isDown || keys.D.isDown,
    ),
    y: axis(keys.up.isDown || keys.W.isDown, keys.down.isDown || keys.S.isDown),
  };
}

function bindArenaPointer(scene: Phaser.Scene, binding: ArenaPointerBinding) {
  const canvas = scene.game.canvas;
  canvas.tabIndex = 0;

  const focusCanvas = () => {
    canvas.focus();
  };
  const preventScrollKeys = (event: KeyboardEvent) => {
    if (document.activeElement !== canvas) return;
    if (!SCROLL_CODES.has(event.code)) return;
    event.preventDefault();
  };
  const onPointerDown = (pointer: Phaser.Input.Pointer) => {
    focusCanvas();
    binding.onPointerActivity();
    if (pointer.button !== 0) return;
    binding.onPrimaryDown(pointer.worldX, pointer.worldY);
  };
  const onPointerUp = (pointer: Phaser.Input.Pointer) => {
    if (pointer.button !== 0) return;
    binding.onPrimaryUp(pointer.worldX, pointer.worldY);
  };
  const onPointerMove = () => {
    binding.onPointerActivity();
  };
  const onWheel = (
    pointer: Phaser.Input.Pointer,
    _over: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ) => {
    pointer.event?.preventDefault();
    if (deltaY === 0) return;
    binding.onWheel(deltaY);
  };
  const preventWheel = (event: WheelEvent) => {
    if (document.activeElement !== canvas && !canvas.matches(":hover")) return;
    event.preventDefault();
  };

  scene.input.on(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
  scene.input.on(Phaser.Input.Events.POINTER_UP, onPointerUp);
  scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, onPointerUp);
  scene.input.on(Phaser.Input.Events.POINTER_MOVE, onPointerMove);
  scene.input.on("wheel", onWheel);
  window.addEventListener("keydown", preventScrollKeys);
  window.addEventListener("wheel", preventWheel, { passive: false });

  return () => {
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, onPointerDown);
    scene.input.off(Phaser.Input.Events.POINTER_UP, onPointerUp);
    scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, onPointerUp);
    scene.input.off(Phaser.Input.Events.POINTER_MOVE, onPointerMove);
    scene.input.off("wheel", onWheel);
    window.removeEventListener("keydown", preventScrollKeys);
    window.removeEventListener("wheel", preventWheel);
  };
}

export { bindArenaKeys, bindArenaPointer, readMoveAxes };
export type { ArenaKeys };
