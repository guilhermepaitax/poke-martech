"use client";

import {
  DEV_ACTIONS,
  DEV_TOGGLE_GROUPS,
  type ArenaDevAction,
  type ArenaDevSettings,
  type ArenaDevToggle,
} from "@/lib/arena/dev-settings";
import { FlaskConical } from "lucide-react";

// Painel do modo teste. O clique não pega foco: espaço e atalhos seguem indo para o jogo.
function ArenaDevPanel({
  settings,
  onToggle,
  onAction,
}: {
  settings: ArenaDevSettings;
  onToggle: (key: ArenaDevToggle) => void;
  onAction: (action: ArenaDevAction) => void;
}) {
  return (
    <details
      data-slot="arena-dev-panel"
      open
      onMouseDown={(event) => event.preventDefault()}
      className="absolute top-20 left-3 z-[7] w-56 max-w-[calc(100%-1.5rem)] border-2 border-(--arena-line) bg-(--arena-panel) text-(--arena-ink) backdrop-blur-md sm:top-24"
    >
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 font-arena-title text-sm uppercase select-none">
        <FlaskConical aria-hidden className="size-4 text-(--arena-cta)" />
        Modo teste
      </summary>
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto px-3 pb-3">
        {DEV_TOGGLE_GROUPS.map((group) => (
          <fieldset key={group.title} className="flex flex-col gap-1">
            <legend className="mb-1 text-[11px] font-bold tracking-widest text-(--arena-ink-subtle) uppercase">
              {group.title}
            </legend>
            {group.toggles.map((toggle) => (
              <label key={toggle.key} className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={settings[toggle.key]}
                  onChange={() => onToggle(toggle.key)}
                  className="size-3.5 accent-(--arena-cta)"
                />
                {toggle.label}
              </label>
            ))}
          </fieldset>
        ))}
        <div className="grid grid-cols-2 gap-1.5">
          {DEV_ACTIONS.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => onAction(item.action)}
              className="arena-ghost px-1.5 py-1.5 font-arena-title text-[10px] leading-tight uppercase"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

export { ArenaDevPanel };
