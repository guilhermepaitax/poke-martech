let context: AudioContext | null = null;

function unlockArenaAudio() {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext;
  if (!context) context = new Ctx();
  if (context.state === "suspended") void context.resume();
}

function arenaAudioContext() {
  return context;
}

export { arenaAudioContext, unlockArenaAudio };
