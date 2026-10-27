"use client";

import { parseDevSettings, type ArenaDevSettings, type ArenaDevToggle } from "@/lib/arena/dev-settings";
import { useState } from "react";

const STORAGE_KEY = "arena:dev-settings:v1";

function readSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseDevSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return parseDevSettings(null);
  }
}

function saveSettings(settings: ArenaDevSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

// Só roda no cliente (o jogo carrega sem SSR); lembra os ajustes entre testes.
function useArenaDevSettings() {
  const [settings, setSettings] = useState(readSettings);

  function toggle(key: ArenaDevToggle) {
    setSettings((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      saveSettings(next);
      return next;
    });
  }

  return { settings, toggle };
}

export { useArenaDevSettings };
