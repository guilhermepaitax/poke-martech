"use client";

import { X } from "lucide-react";
import { HoloCard } from "@/components/holo-card/holo-card";
import { CardZoomDialog } from "@/components/holo-card/card-zoom-dialog";
import { Button } from "@/components/ui/button";
import { FormPanelSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { Disclosure } from "@/components/ui/disclosure";
import { EnergyChip } from "@/components/ui/energy-chip";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Input, Label, Textarea } from "@/components/ui/input";
import { NullableStepper, Stepper } from "@/components/ui/stepper";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SelectField } from "@/components/ui/select-field";
import { SwitchField } from "@/components/ui/switch-field";
import type { CardEvolutionOrigin, CardInput } from "@/types/catalog";
import { AttackEffectsEditor } from "./attack-effects-editor";
import { CardDecorationPicker } from "./card-decoration-picker";
import { CardPlacementEditor } from "./card-placement-editor";
import { frameOptions, rarityOptions, stageOptions, useCardForm } from "./use-card-form";

function CardForm({ cardId }: { cardId?: string }) {
  const form = useCardForm(cardId);
  if (form.isLoading) {
    return (
      <LoadingScreen label="Carregando carta" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <FormPanelSkeleton fields={6} />
        <Skeleton className="mx-auto aspect-[63/88] w-full max-w-72 rounded-[4%]" />
      </LoadingScreen>
    );
  }
  if (form.isMissing) return <p className="text-destructive">Carta não encontrada.</p>;
  const values = form.form;

  return (
    <form
      data-slot="card-form"
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"
      onSubmit={(event) => {
        event.preventDefault();
        form.saveForm();
      }}
    >
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <div className="glass flex flex-col gap-5 rounded-3xl p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-name">Nome</Label>
            <Input id="card-name" value={values.name} onChange={(event) => form.update({ name: event.target.value })} required />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {form.energyTypes.map((energy) => (
                <EnergyChip
                  key={energy.code}
                  energy={energy.code}
                  selected={values.energyType === energy.code}
                  onClick={() => form.update({ energyType: energy.code })}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Moldura</p>
            <SegmentedControl
              ariaLabel="Moldura"
              value={values.frame}
              options={frameOptions}
              onValueChange={(frame) => form.update({ frame: frame as typeof values.frame })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">HP</p>
            <Stepper ariaLabel="HP" value={values.hp} min={10} max={400} step={10} onValueChange={(hp) => form.update({ hp })} />
          </div>
          <ImageDropzone
            imageUrl={values.imageUrl}
            onFile={(file) => void form.onFile(file, "imageUrl")}
            uploading={form.optimizing}
            error={form.errorFor("imageUrl")}
          />
          {values.imageUrl ? (
            <CardPlacementEditor
              imageUrl={values.imageUrl}
              x={values.imageX}
              y={values.imageY}
              scale={values.imageScale}
              onPositionChange={({ x, y }) => form.update({ imageX: x, imageY: y })}
              onScaleChange={(imageScale) => form.update({ imageScale })}
            />
          ) : null}
          {values.frame === "ex" ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground-subtle">Imagem sobreposta</p>
                <ImageDropzone
                  imageUrl={values.overlayImageUrl}
                  onFile={(file) => void form.onFile(file, "overlayImageUrl")}
                  uploading={form.uploading === "overlayImageUrl"}
                  error={form.errorFor("overlayImageUrl")}
                  emptyText="Solte a imagem que cobre a carta"
                  ariaLabel="Enviar imagem sobreposta"
                />
              </div>
              {values.overlayImageUrl ? (
                <CardPlacementEditor
                  imageUrl={values.overlayImageUrl}
                  x={values.overlayX}
                  y={values.overlayY}
                  scale={values.overlayScale}
                  onPositionChange={({ x, y }) => form.update({ overlayX: x, overlayY: y })}
                  onScaleChange={(overlayScale) => form.update({ overlayScale })}
                />
              ) : null}
              <CardDecorationPicker
                asset={values.decorationAsset}
                imageUrl={values.decorationImageUrl}
                uploading={form.uploading === "decorationImageUrl"}
                error={form.errorFor("decorationImageUrl")}
                onSelect={form.selectDecoration}
                onFile={(file) => void form.onFile(file, "decorationImageUrl")}
              />
            </>
          ) : null}
          <details className="rounded-2xl bg-white/40 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">Mais opções</summary>
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="image">Endereço da imagem</Label>
              <Input
                id="image"
                type="url"
                value={values.imageUrl ?? ""}
                placeholder="https://"
                onChange={(event) => form.update({ imageUrl: event.target.value || null })}
              />
            </div>
          </details>
          <div className="flex flex-col gap-3">
            <p className="font-semibold">Ataques</p>
            {values.attacks.map((attack, index) => {
              const cost = attack.energyCost[0] ?? { type: "ia" as const, count: 1 };
              return (
                <div key={index} className="flex flex-col gap-3 rounded-2xl bg-white/45 p-3">
                  <div className="flex gap-2">
                    <Input
                      aria-label="Nome do ataque"
                      value={attack.name}
                      onChange={(event) => form.updateAttack(index, { name: event.target.value })}
                    />
                    <button
                      type="button"
                      aria-label={`Remover ${attack.name}`}
                      onClick={() => form.removeAttack(index)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <NullableStepper
                    ariaLabel="Dano"
                    value={attack.damage}
                    min={10}
                    max={400}
                    step={10}
                    emptyLabel="—"
                    onValueChange={(damage) => form.updateAttack(index, { damage })}
                  />
                  <div className="flex flex-wrap gap-2">
                    {form.energyTypes.map((energy) => (
                      <EnergyChip
                        key={energy.code}
                        energy={energy.code}
                        selected={cost.type === energy.code}
                        onClick={() =>
                          form.updateAttack(index, {
                            energyCost: [{ type: energy.code, count: cost.count }, ...attack.energyCost.slice(1)],
                          })
                        }
                      />
                    ))}
                  </div>
                  <Stepper
                    ariaLabel="Custo de energia"
                    value={cost.count}
                    min={1}
                    max={5}
                    onValueChange={(count) =>
                      form.updateAttack(index, {
                        energyCost: [{ type: cost.type, count }, ...attack.energyCost.slice(1)],
                      })
                    }
                  />
                  <Textarea
                    aria-label="Efeito"
                    value={attack.effectText}
                    onChange={(event) => form.updateAttack(index, { effectText: event.target.value })}
                  />
                  <AttackEffectsEditor
                    effects={attack.effects}
                    onChange={(effects) => form.updateAttack(index, { effects })}
                  />
                </div>
              );
            })}
            <Button variant="outline" onClick={form.addAttack}>
              Adicionar ataque
            </Button>
          </div>
          <SwitchField checked={values.published} onCheckedChange={(published) => form.update({ published })} label="Publicada" />
        </div>
        <Disclosure title="Regras da carta">
          <div className="flex flex-col gap-2">
            <Label htmlFor="card-slug">Identificador</Label>
            <Input id="card-slug" value={values.slug} onChange={(event) => form.update({ slug: event.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Estágio</p>
            <SegmentedControl
              ariaLabel="Estágio"
              value={values.stage}
              options={stageOptions}
              onValueChange={(stage) => form.update({ stage: stage as typeof values.stage })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Evolui de</p>
            <SelectField
              ariaLabel="Evolui de"
              value={values.evolvesFromId ?? "none"}
              options={[{ value: "none", label: "Nenhuma" }, ...form.options.map((card) => ({ value: card.id, label: card.name }))]}
              onValueChange={(evolvesFromId) => form.update({ evolvesFromId: evolvesFromId === "none" ? null : evolvesFromId })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Raridade</p>
            <SegmentedControl
              ariaLabel="Raridade"
              value={values.rarity}
              options={rarityOptions}
              onValueChange={(rarity) => form.update({ rarity: rarity as typeof values.rarity })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Recuo</p>
            <Stepper ariaLabel="Recuo" value={values.retreatCost} min={0} max={5} onValueChange={(retreatCost) => form.update({ retreatCost })} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Fraqueza</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-selected={values.weaknessType == null ? "" : undefined}
                onClick={() => form.update({ weaknessType: null })}
                className="rounded-full bg-white/50 px-3 py-1.5 text-sm font-medium text-foreground-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-primary data-selected:text-primary-foreground"
              >
                Nenhuma
              </button>
              {form.energyTypes.map((energy) => (
                <EnergyChip
                  key={energy.code}
                  energy={energy.code}
                  selected={values.weaknessType === energy.code}
                  onClick={() => form.update({ weaknessType: energy.code })}
                />
              ))}
            </div>
            <Stepper
              ariaLabel="Modificador da fraqueza"
              value={values.weaknessModifier}
              min={0}
              max={200}
              step={10}
              onValueChange={(weaknessModifier) => form.update({ weaknessModifier })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="flavor">Texto</Label>
            <Textarea id="flavor" value={values.flavorText} onChange={(event) => form.update({ flavorText: event.target.value })} />
          </div>
        </Disclosure>
        {form.error ? <p className="text-sm text-destructive">{form.error.message}</p> : null}
        <Button type="submit" disabled={form.isPending || !form.isDirty}>
          {form.optimizing ? "Otimizando imagem..." : "Salvar carta"}
        </Button>
      </div>
      <div className="order-1 flex flex-col gap-3 lg:sticky lg:top-28 lg:order-2">
        <CardFormPreview values={values} evolvesFrom={form.evolvesFrom} />
        <Button type="button" variant="outline" onClick={() => form.setEnlarged(true)}>
          Ampliar
        </Button>
        <CardZoomDialog open={form.enlarged} onOpenChange={form.setEnlarged} title="Pré-visualização da carta">
          <CardFormPreview values={values} evolvesFrom={form.evolvesFrom} effects />
        </CardZoomDialog>
      </div>
    </form>
  );
}

function CardFormPreview({
  values,
  evolvesFrom,
  className,
  effects,
}: {
  values: CardInput;
  evolvesFrom: CardEvolutionOrigin | null;
  className?: string;
  effects?: boolean;
}) {
  return (
    <HoloCard
      className={className}
      effects={effects}
      name={values.name || "Nova carta"}
      imageUrl={values.imageUrl}
      rarity={values.rarity}
      hp={values.hp}
      energyType={values.energyType}
      frame={values.frame}
      stage={values.stage}
      evolvesFrom={evolvesFrom}
      attacks={values.attacks}
      retreatCost={values.retreatCost}
      weaknessType={values.weaknessType}
      weaknessModifier={values.weaknessModifier}
      flavorText={values.flavorText}
      imageX={values.imageX}
      imageY={values.imageY}
      imageScale={values.imageScale}
      overlayImageUrl={values.overlayImageUrl}
      overlayX={values.overlayX}
      overlayY={values.overlayY}
      overlayScale={values.overlayScale}
      decorationAsset={values.decorationAsset}
      decorationImageUrl={values.decorationImageUrl}
    />
  );
}

export { CardForm };
