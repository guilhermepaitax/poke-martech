import { MyPokedex } from "@/components/pokedex-grid/my-pokedex";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pokédex",
};

export default function PokedexPage() {
  return <MyPokedex />;
}
