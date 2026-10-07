"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { Stepper } from "@/components/ui/stepper";
import { SwitchField } from "@/components/ui/switch-field";
import {
  ATTACK_EFFECT_KINDS,
  ATTACK_EFFECT_LABELS,
  defaultAttackEffect,
  describeAttackEffect,
  isAttackEffectKind,
  isStatusCondition,
  MAX_ATTACK_EFFECTS,
  STATUS_CONDITIONS,
  STATUS_LABELS,
  type AttackEffect,
} from "@/lib/value-objects/attack-effect";

const kindOptions = ATTACK_EFFECT_KINDS.map((value) => ({ value, label: ATTACK_EFFECT_LABELS[value] }));
const statusOptions = STATUS_CONDITIONS.map((value) => ({ value, label: STATUS_LABELS[value] }));
const targetOptions = [
  { value: "opponent", label: "Oponente" },
  { value: "self", label: "Si mesmo" },
];
const scopeOptions = [
  { value: "all", label: "Todos" },
  { value: "one", label: "1 aleatório" },
];

interface AttackEffectsEditorProps {
  effects: AttackEffect[];
  onChange: (effects: AttackEffect[]) => void;
}

function AttackEffectsEditor({ effects, onChange }: AttackEffectsEditorProps) {
  function replace(index: number, effect: AttackEffect) {
    onChange(effects.map((item, itemIndex) => (itemIndex === index ? effect : item)));
  }

  return (
    <div data-slot="attack-effects-editor" className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground-subtle">Efeitos na batalha</p>
      {effects.map((effect, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-2xl bg-white/50 p-2">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <SelectField
                ariaLabel="Tipo de efeito"
                value={effect.kind}
                options={kindOptions}
                onValueChange={(kind) => {
                  if (isAttackEffectKind(kind)) replace(index, defaultAttackEffect(kind));
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Remover efeito"
              onClick={() => onChange(effects.filter((_, itemIndex) => itemIndex !== index))}
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>
          <AttackEffectFields effect={effect} onChange={(next) => replace(index, next)} />
          <p className="text-xs text-foreground-subtle">{describeAttackEffect(effect)}</p>
        </div>
      ))}
      {effects.length < MAX_ATTACK_EFFECTS ? (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => onChange([...effects, defaultAttackEffect("status")])}
        >
          Adicionar efeito
        </Button>
      ) : null}
    </div>
  );
}

function AttackEffectFields({ effect, onChange }: { effect: AttackEffect; onChange: (effect: AttackEffect) => void }) {
  switch (effect.kind) {
    case "heal_self":
    case "self_damage":
    case "bonus_if_damaged":
      return (
        <Stepper
          ariaLabel="Quantidade"
          value={effect.amount}
          min={10}
          max={300}
          step={10}
          onValueChange={(amount) => onChange({ ...effect, amount })}
        />
      );
    case "status":
      return (
        <div className="flex flex-col gap-2">
          <SegmentedControl
            ariaLabel="Condição"
            value={effect.condition}
            options={statusOptions}
            onValueChange={(condition) => {
              if (isStatusCondition(condition)) onChange({ ...effect, condition });
            }}
          />
          <SegmentedControl
            ariaLabel="Alvo"
            value={effect.target}
            options={targetOptions}
            onValueChange={(target) => onChange({ ...effect, target: target === "self" ? "self" : "opponent" })}
          />
          <SwitchField
            checked={effect.coinFlip}
            onCheckedChange={(coinFlip) => onChange({ ...effect, coinFlip })}
            label="Depende de cara na moeda"
          />
        </div>
      );
    case "coin_bonus":
      return (
        <div className="flex flex-wrap gap-3">
          <Stepper ariaLabel="Moedas" value={effect.coins} min={1} max={5} onValueChange={(coins) => onChange({ ...effect, coins })} />
          <Stepper
            ariaLabel="Dano por cara"
            value={effect.amountPerHeads}
            min={10}
            max={300}
            step={10}
            onValueChange={(amountPerHeads) => onChange({ ...effect, amountPerHeads })}
          />
        </div>
      );
    case "bench_damage":
      return (
        <div className="flex flex-wrap gap-3">
          <Stepper
            ariaLabel="Dano"
            value={effect.amount}
            min={10}
            max={300}
            step={10}
            onValueChange={(amount) => onChange({ ...effect, amount })}
          />
          <SegmentedControl
            ariaLabel="Alcance"
            value={effect.scope}
            options={scopeOptions}
            onValueChange={(scope) => onChange({ ...effect, scope: scope === "one" ? "one" : "all" })}
          />
        </div>
      );
    case "discard_energy":
      return (
        <div className="flex flex-wrap gap-3">
          <Stepper ariaLabel="Energias" value={effect.count} min={1} max={5} onValueChange={(count) => onChange({ ...effect, count })} />
          <SegmentedControl
            ariaLabel="Alvo"
            value={effect.target}
            options={targetOptions}
            onValueChange={(target) => onChange({ ...effect, target: target === "self" ? "self" : "opponent" })}
          />
        </div>
      );
    case "draw_cards":
    case "attach_energy_self":
      return (
        <Stepper ariaLabel="Quantidade" value={effect.count} min={1} max={5} onValueChange={(count) => onChange({ ...effect, count })} />
      );
    case "prevent_damage_next_turn":
      return (
        <SwitchField
          checked={effect.coinFlip}
          onCheckedChange={(coinFlip) => onChange({ ...effect, coinFlip })}
          label="Depende de cara na moeda"
        />
      );
    case "coin_or_nothing":
      return null;
  }
}

export { AttackEffectsEditor };
