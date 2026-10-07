"use client";

import { Button } from "@/components/ui/button";
import { EnergyChip } from "@/components/ui/energy-chip";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Stepper } from "@/components/ui/stepper";
import { SwitchField } from "@/components/ui/switch-field";
import { cn } from "@/lib/utils";
import { isBattleDifficulty } from "@/lib/value-objects/battle";
import Image from "next/image";
import { difficultyOptions, useOpponentForm } from "./use-opponent-form";

function OpponentForm({ opponentId }: { opponentId?: string }) {
  const form = useOpponentForm(opponentId);
  if (form.isLoading)
    return <p className="text-foreground-subtle">Carregando adversário...</p>;
  if (form.isMissing)
    return <p className="text-destructive">Adversário não encontrado.</p>;
  const values = form.form;
  const total = values.cards.reduce((sum, item) => sum + item.copies, 0);

  return (
    <form
      data-slot="opponent-form"
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        form.saveForm();
      }}
    >
      <div className="glass flex flex-col gap-5 rounded-3xl p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="opponent-name">Nome</Label>
          <Input
            id="opponent-name"
            value={values.name}
            onChange={(event) => form.update({ name: event.target.value })}
            required
          />
        </div>
        <ImageDropzone
          imageUrl={values.avatarUrl}
          onFile={(file) => void form.onFile(file)}
          uploading={form.uploading}
          error={form.uploadError}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground-subtle">
            Dificuldade
          </p>
          <SegmentedControl
            ariaLabel="Dificuldade"
            value={values.difficulty}
            options={difficultyOptions}
            onValueChange={(value) => {
              if (isBattleDifficulty(value)) form.update({ difficulty: value });
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground-subtle">
            Recompensa
          </p>
          <Stepper
            ariaLabel="Moedas"
            value={values.rewardCoins}
            min={0}
            max={500}
            step={5}
            onValueChange={(rewardCoins) => form.update({ rewardCoins })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="opponent-description">Descrição</Label>
          <Textarea
            id="opponent-description"
            value={values.description}
            onChange={(event) =>
              form.update({ description: event.target.value })
            }
          />
        </div>
        <SwitchField
          checked={values.active}
          onCheckedChange={(active) => form.update({ active })}
          label="Disponível para batalha"
        />
        <div className="flex flex-col gap-2">
          <p className="font-semibold">Energias do deck</p>
          <div className="flex flex-wrap gap-2">
            {form.availableEnergy.map((energy) => (
              <EnergyChip
                key={energy}
                energy={energy}
                selected={values.energyTypes.includes(energy)}
                onClick={() => {
                  const selected = values.energyTypes.includes(energy);
                  const next = selected
                    ? values.energyTypes.filter((item) => item !== energy)
                    : [...values.energyTypes, energy].slice(0, 3);
                  form.update({ energyTypes: next });
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <p className="font-semibold">Cartas do deck</p>
            <p className="text-sm text-foreground-subtle">{total} / 20</p>
          </div>
          <Input
            aria-label="Buscar carta"
            placeholder="Buscar carta"
            value={form.cardQuery}
            onChange={(event) => form.setCardQuery(event.target.value)}
          />
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {form.visibleCatalog.map((card) => {
              const current = values.cards.find(
                (item) => item.cardId === card.id,
              );
              return (
                <li
                  key={card.id}
                  data-selected={current ? "" : undefined}
                  className={cn(
                    "flex flex-col gap-2 rounded-3xl border border-white/70 bg-white/40 p-2",
                    current && "ring-2 ring-primary",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => form.setCopies(card.id, current ? 0 : 1)}
                    className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="relative block aspect-[63/88] overflow-hidden rounded-2xl bg-muted">
                      {card.imageUrl ? (
                        <Image
                          src={card.imageUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="140px"
                        />
                      ) : null}
                    </span>
                    <span className="mt-2 block text-sm font-semibold">
                      {card.name}
                    </span>
                  </button>
                  {current ? (
                    <Stepper
                      ariaLabel={`Cópias de ${card.name}`}
                      value={current.copies}
                      min={1}
                      max={2}
                      onValueChange={(copies) =>
                        form.setCopies(card.id, copies)
                      }
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {form.error ? (
        <p className="text-sm text-destructive">{form.error.message}</p>
      ) : null}
      <Button type="submit" disabled={form.isPending || !form.isDirty}>
        Salvar adversário
      </Button>
    </form>
  );
}

export { OpponentForm };
