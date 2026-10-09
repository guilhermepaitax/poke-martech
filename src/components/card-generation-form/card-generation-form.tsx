"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageDropzone } from "@/components/ui/image-dropzone";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { CardGenerationHistory } from "./card-generation-history";
import { CardGenerationLinks } from "./card-generation-links";
import { useCardGenerationForm } from "./use-card-generation-form";

function CardGenerationForm() {
  const form = useCardGenerationForm();

  return (
    <div data-slot="card-generation-form" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          form.submit();
        }}
      >
        <div className="glass flex flex-col gap-5 rounded-3xl p-5">
          <p className="font-semibold">Pessoa</p>
          <ImageDropzone
            imageUrl={form.personImageUrl}
            onFile={(file) => void form.onFile(file)}
            uploading={form.uploading}
            error={form.uploadError}
            emptyText="Solte a foto da pessoa ou clique para enviar"
            ariaLabel="Enviar foto da pessoa"
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="person-name">Nome</Label>
            <Input
              id="person-name"
              value={form.personName}
              maxLength={60}
              onChange={(event) => form.setPersonName(event.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="person-description">Descrição</Label>
            <Textarea
              id="person-description"
              value={form.personDescription}
              maxLength={600}
              placeholder="Cargo, jeito, manias, piadas internas..."
              onChange={(event) => form.setPersonDescription(event.target.value)}
              required
            />
            <p className="text-sm text-foreground-subtle">Mínimo de {form.minDescription} caracteres.</p>
          </div>
        </div>
        <div className="glass flex flex-col gap-4 rounded-3xl p-5">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Pokémon de inspiração</p>
            <p className="text-sm text-foreground-subtle">
              Opcional. Cada link do pokemon-zone vira uma carta inspirada nele. Sem links, a IA inventa as criaturas.
            </p>
          </div>
          <CardGenerationLinks
            links={form.links}
            canAdd={form.canAddLink}
            isInvalid={form.isInvalidLink}
            onChange={form.setLink}
            onAdd={form.addLink}
            onRemove={form.removeLink}
          />
          {form.usesLinks ? null : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground-subtle">Quantidade de Pokémon</p>
              <Stepper ariaLabel="Quantidade de Pokémon" value={form.count} min={1} max={form.maxCards} onValueChange={form.setCount} />
            </div>
          )}
        </div>
        <Button type="submit" disabled={!form.canSubmit}>
          <Sparkles className="size-4" />
          {form.isPending ? "Enviando..." : `Gerar ${form.totalCards} ${form.totalCards === 1 ? "carta" : "cartas"}`}
        </Button>
      </form>
      <CardGenerationHistory />
    </div>
  );
}

export { CardGenerationForm };
