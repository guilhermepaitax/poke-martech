import { ARENA_AUDIO, type ArenaCue } from "@/game/arena/assets/catalog";
import Phaser from "phaser";

// `config` muda velocidade/volume de um toque (ex.: bolhas estourando agudas).
function playArenaAudio(scene: Phaser.Scene, cue: ArenaCue, config?: Phaser.Types.Sound.SoundConfig) {
  const key = ARENA_AUDIO[cue].key;
  const play = () => {
    if (!scene.cache.audio.exists(key)) return;
    scene.sound.play(key, config);
  };
  if (scene.sound.locked) {
    scene.sound.once(Phaser.Sound.Events.UNLOCKED, play);
    return;
  }
  play();
}

export { playArenaAudio };
