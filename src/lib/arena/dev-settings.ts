// Modo teste (só em desenvolvimento): chaves para isolar mecânicas na luta.
type ArenaDevSettings = {
  cpuMoves: boolean;
  cpuAttacks: boolean;
  cpuDefends: boolean;
  playerSpecialFull: boolean;
  cpuSpecialFull: boolean;
  noCooldowns: boolean;
  playerInvincible: boolean;
  cpuInvincible: boolean;
  pickups: boolean;
  hitboxes: boolean;
};

type ArenaDevToggle = keyof ArenaDevSettings;

// Ações de um clique no painel.
type ArenaDevAction = "heal" | "fill-special" | "drop-pickup" | "ko-cpu";

const DEFAULT_DEV_SETTINGS: ArenaDevSettings = {
  cpuMoves: true,
  cpuAttacks: true,
  cpuDefends: true,
  playerSpecialFull: false,
  cpuSpecialFull: false,
  noCooldowns: false,
  playerInvincible: false,
  cpuInvincible: false,
  pickups: true,
  hitboxes: false,
};

const DEV_TOGGLE_GROUPS: readonly {
  title: string;
  toggles: readonly { key: ArenaDevToggle; label: string }[];
}[] = [
  {
    title: "CPU",
    toggles: [
      { key: "cpuMoves", label: "Anda" },
      { key: "cpuAttacks", label: "Ataca" },
      { key: "cpuDefends", label: "Defende" },
      { key: "cpuSpecialFull", label: "Especial sempre cheio" },
      { key: "cpuInvincible", label: "Invencível" },
    ],
  },
  {
    title: "Você",
    toggles: [
      { key: "playerSpecialFull", label: "Especial sempre cheio" },
      { key: "noCooldowns", label: "Sem recarga" },
      { key: "playerInvincible", label: "Invencível" },
    ],
  },
  {
    title: "Arena",
    toggles: [
      { key: "pickups", label: "Caixas aparecem" },
      { key: "hitboxes", label: "Mostrar hitboxes" },
    ],
  },
];

const DEV_ACTIONS: readonly { action: ArenaDevAction; label: string }[] = [
  { action: "heal", label: "Curar todos" },
  { action: "fill-special", label: "Encher especiais" },
  { action: "drop-pickup", label: "Soltar caixa" },
  { action: "ko-cpu", label: "Nocautear CPU" },
];

const DEV_MODE_ENABLED = process.env.NODE_ENV === "development";

// Lê o que veio salvo; chave ausente ou com tipo errado volta ao padrão.
function parseDevSettings(value: unknown): ArenaDevSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_DEV_SETTINGS };
  const source = value as Record<string, unknown>;
  const settings = { ...DEFAULT_DEV_SETTINGS };
  for (const key of Object.keys(DEFAULT_DEV_SETTINGS) as ArenaDevToggle[]) {
    const flag = source[key];
    if (typeof flag === "boolean") settings[key] = flag;
  }
  return settings;
}

export { DEFAULT_DEV_SETTINGS, DEV_ACTIONS, DEV_MODE_ENABLED, DEV_TOGGLE_GROUPS, parseDevSettings };
export type { ArenaDevAction, ArenaDevSettings, ArenaDevToggle };
