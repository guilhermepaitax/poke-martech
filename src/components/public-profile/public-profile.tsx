"use client";

import Image from "next/image";
import { usePublicProfile } from "@/hooks/use-opening";
import { PokedexGrid } from "@/components/pokedex-grid/pokedex-grid";

function PublicProfile({ username }: { username: string }) {
  const profile = usePublicProfile(username);
  if (profile.isLoading) return <p className="text-foreground-subtle">Carregando perfil...</p>;
  if (profile.isError || !profile.data) {
    return <p className="text-destructive">Treinador não encontrado.</p>;
  }
  const person = profile.data;
  return (
    <div data-slot="public-profile" className="flex flex-col gap-8">
      <div className="glass flex items-center gap-4 rounded-3xl p-5">
        {person.image ? (
          <Image
            src={person.image}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
        ) : (
          <div className="size-16 rounded-full bg-white/70" />
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{person.name}</h1>
          <p className="text-foreground-subtle">@{person.username}</p>
          {person.bio ? <p className="mt-2 max-w-prose text-sm">{person.bio}</p> : null}
        </div>
      </div>
      <PokedexGrid entries={person.pokedex} ownedOnly />
    </div>
  );
}

export { PublicProfile };
