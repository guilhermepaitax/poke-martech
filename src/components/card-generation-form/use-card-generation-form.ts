"use client";

import { useState } from "react";
import { useReturnTo } from "@/hooks/use-list-location";
import { withReturnTo } from "@/lib/return-path";
import { errorDescription, useToast } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useStartCardGeneration } from "@/hooks/use-admin";
import { optimizeImage } from "@/lib/image-processing";
import { MAX_GENERATION_CARDS, parsePokemonZoneUrl } from "@/lib/value-objects/card-generation";
import { uploadImage } from "@/services/http";

const MIN_DESCRIPTION = 10;
const DEFAULT_COUNT = 3;

function useCardGenerationForm() {
  const router = useRouter();
  const returnTo = useReturnTo("/admin/cartas");
  const { pushToast } = useToast();
  const start = useStartCardGeneration();
  const [personName, setPersonName] = useState("");
  const [personDescription, setPersonDescription] = useState("");
  const [personImageUrl, setPersonImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([""]);
  const [count, setCount] = useState(DEFAULT_COUNT);

  const sourceUrls = links.map((link) => link.trim()).filter(Boolean);
  const invalidLinks = new Set(sourceUrls.filter((url) => !parsePokemonZoneUrl(url)));
  const usesLinks = sourceUrls.length > 0;
  const uploaded = Boolean(personImageUrl) && !personImageUrl?.startsWith("blob:");
  const canSubmit =
    personName.trim().length > 0 &&
    personDescription.trim().length >= MIN_DESCRIPTION &&
    uploaded &&
    !uploading &&
    invalidLinks.size === 0 &&
    !start.isPending;

  function setLink(index: number, value: string) {
    setLinks((current) => current.map((link, position) => (position === index ? value : link)));
  }

  function addLink() {
    setLinks((current) => (current.length >= MAX_GENERATION_CARDS ? current : [...current, ""]));
  }

  function removeLink(index: number) {
    setLinks((current) => {
      const next = current.filter((_, position) => position !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function isInvalidLink(value: string) {
    return invalidLinks.has(value.trim());
  }

  async function onFile(file: File) {
    setUploadError(null);
    setUploading(true);
    const local = URL.createObjectURL(file);
    setPersonImageUrl(local);
    try {
      const result = await uploadImage(await optimizeImage(file));
      setPersonImageUrl(result.url);
      URL.revokeObjectURL(local);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (!canSubmit || !personImageUrl) return;
    start.mutate(
      {
        personName: personName.trim(),
        personDescription: personDescription.trim(),
        personImageUrl,
        sourceUrls,
        count: usesLinks ? null : count,
      },
      {
        onSuccess: (result) => {
          pushToast({ tone: "success", title: "Geração iniciada" });
          router.push(withReturnTo(`/admin/cartas/gerar/${result.id}`, returnTo));
        },
        onError: (error) => {
          pushToast({
            tone: "error",
            title: "Não foi possível iniciar a geração",
            description: errorDescription(error),
          });
        },
      },
    );
  }

  return {
    personName,
    setPersonName,
    personDescription,
    setPersonDescription,
    personImageUrl,
    uploading,
    uploadError,
    onFile,
    links,
    setLink,
    addLink,
    removeLink,
    isInvalidLink,
    canAddLink: links.length < MAX_GENERATION_CARDS,
    usesLinks,
    count,
    setCount,
    totalCards: usesLinks ? sourceUrls.length : count,
    canSubmit,
    submit,
    isPending: start.isPending,
    error: start.error,
    minDescription: MIN_DESCRIPTION,
    maxCards: MAX_GENERATION_CARDS,
  };
}

export { useCardGenerationForm };
