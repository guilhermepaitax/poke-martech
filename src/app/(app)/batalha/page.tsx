import { ArenaScreen } from "@/components/arena/arena-screen";
import { container } from "@/server/container";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batalha",
};

export default async function BatalhaPage() {
  const result = await container.listArenaRoster.execute();
  if (!result.ok)
    return <ArenaScreen roster={null} message={result.error.message} />;
  return <ArenaScreen roster={result.value} />;
}
