"use client";

import { Booster3D } from "@/components/booster-3d/booster-3d";
import { Button } from "@/components/ui/button";
import { FormPanelSkeleton, LoadingScreen, Skeleton } from "@/components/ui/skeleton";
import { Disclosure } from "@/components/ui/disclosure";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { NullableStepper, Stepper } from "@/components/ui/stepper";
import { SwitchField } from "@/components/ui/switch-field";
import { cn } from "@/lib/utils";
import { isFinish } from "@/lib/value-objects/card";
import Image from "next/image";
import {
  finishOptions,
  rarityOptions,
  useBoosterForm,
} from "./use-booster-form";

function BoosterForm({ boosterId }: { boosterId?: string }) {
  const form = useBoosterForm(boosterId);
  if (form.isLoading) {
    return (
      <LoadingScreen label="Carregando pacote" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <FormPanelSkeleton fields={5} />
        <Skeleton className="mx-auto aspect-[2/3] w-full max-w-64 rounded-2xl" />
      </LoadingScreen>
    );
  }
  if (form.isMissing)
    return <p className="text-destructive">Pacote não encontrado.</p>;
  const values = form.form;

  return (
    <form
      data-slot="booster-form"
      className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]"
      onSubmit={(event) => {
        event.preventDefault();
        form.saveForm();
      }}
    >
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        <div className="glass flex flex-col gap-5 rounded-3xl p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="booster-name">Nome</Label>
            <Input
              id="booster-name"
              value={values.name}
              onChange={(event) => form.update({ name: event.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">Preço</p>
            <Stepper
              ariaLabel="Preço"
              value={values.price}
              min={0}
              max={9990}
              step={10}
              onValueChange={(price) => form.update({ price })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">
              Cartas por pacote
            </p>
            <Stepper
              ariaLabel="Cartas por pacote"
              value={values.cardsPerPack}
              min={1}
              max={12}
              onValueChange={(cardsPerPack) => form.update({ cardsPerPack })}
            />
          </div>
          <ImageDropzone
            imageUrl={values.imageUrl}
            onFile={(file) => void form.onFile(file)}
            uploading={form.uploading}
            error={form.uploadError}
          />
          <details className="rounded-2xl bg-white/40 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium">
              Mais opções
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              <Label htmlFor="booster-image">Endereço da imagem</Label>
              <Input
                id="booster-image"
                type="url"
                value={
                  values.imageUrl?.startsWith("blob:")
                    ? ""
                    : (values.imageUrl ?? "")
                }
                placeholder="https://"
                onChange={(event) =>
                  form.update({ imageUrl: event.target.value || null })
                }
              />
            </div>
          </details>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">
              Acabamento
            </p>
            <SegmentedControl
              ariaLabel="Acabamento"
              value={values.finish}
              options={finishOptions}
              onValueChange={(value) => {
                if (isFinish(value)) form.update({ finish: value });
              }}
            />
          </div>
          <SwitchField
            checked={values.active}
            onCheckedChange={(active) => form.update({ active })}
            label="Ativo na loja"
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <p className="font-semibold">Cartas possíveis</p>
              <p className="text-sm text-foreground-subtle">
                {values.cards.length} selecionadas
              </p>
            </div>
            <Input
              aria-label="Buscar carta"
              placeholder="Buscar carta"
              value={form.cardQuery}
              onChange={(event) => form.setCardQuery(event.target.value)}
            />
            {form.catalog.length === 0 ? (
              <p className="text-sm text-foreground-subtle">
                Cadastre cartas antes do pacote.
              </p>
            ) : null}
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {form.visibleCatalog.map((card) => {
                const current = values.cards.find(
                  (item) => item.cardId === card.id,
                );
                const selected = Boolean(current);
                return (
                  <li
                    key={card.id}
                    data-selected={selected ? "" : undefined}
                    className={cn(
                      "flex flex-col gap-2 rounded-3xl border border-white/70 bg-white/40 p-2",
                      selected && "ring-2 ring-primary",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => form.toggleCard(card.id)}
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
                      <NullableStepper
                        ariaLabel={`Peso de ${card.name}`}
                        value={current.weightOverride}
                        min={1}
                        max={100}
                        emptyLabel="Auto"
                        onValueChange={(weightOverride) =>
                          form.setWeight(card.id, weightOverride)
                        }
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <Disclosure title="Opções da loja">
          <div className="flex flex-col gap-2">
            <Label htmlFor="booster-slug">Identificador</Label>
            <Input
              id="booster-slug"
              value={values.slug}
              onChange={(event) => form.update({ slug: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">
              Quantidade disponível
            </p>
            <NullableStepper
              ariaLabel="Quantidade disponível"
              value={values.stock}
              min={0}
              max={999}
              emptyLabel="Ilimitado"
              onValueChange={(stock) => form.update({ stock })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground-subtle">
              Raridade mínima da última carta
            </p>
            <SegmentedControl
              ariaLabel="Raridade mínima"
              value={values.featuredSlotMinRarity ?? "none"}
              options={rarityOptions}
              onValueChange={(value) =>
                form.update({
                  featuredSlotMinRarity:
                    value === "none"
                      ? null
                      : (value as NonNullable<
                          typeof values.featuredSlotMinRarity
                        >),
                })
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                form.update({ description: event.target.value })
              }
            />
          </div>
        </Disclosure>
        <Button type="submit" disabled={form.isPending || !form.isDirty}>
          Salvar pacote
        </Button>
      </div>
      <div className="order-1 mx-auto w-56 lg:sticky lg:top-28 lg:order-2 lg:w-full">
        <Booster3D
          name={values.name || "Pacote"}
          imageUrl={values.imageUrl}
          finish={values.finish}
        />
        <p className="mt-3 text-sm font-semibold text-accent-foreground">
          {values.price} moedas
        </p>
        <p className="text-sm text-foreground-subtle">
          {values.cardsPerPack} cartas por pacote
        </p>
      </div>
    </form>
  );
}

export { BoosterForm };
