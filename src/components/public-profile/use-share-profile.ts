"use client";

import { profileSharePath } from "@/lib/profile-share";
import { useEffect, useRef, useState } from "react";

async function copyLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    return;
  } catch {
    const field = document.createElement("textarea");
    field.value = url;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.focus();
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (!copied) throw new Error("copy failed");
  }
}

function useShareProfile(username: string) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function share(name: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    const url = `${window.location.origin}${profileSharePath(username)}`;
    const payload = {
      title: `${name} (@${username})`,
      text: `Siga ${name} no PokeMartech.`,
      url,
    };
    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share(payload);
          return;
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === "AbortError"
          )
            return;
        }
      }
      await copyLink(url);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError("Não foi possível copiar o link.");
    } finally {
      setPending(false);
    }
  }

  return { copied, pending, error, share };
}

export { useShareProfile };
