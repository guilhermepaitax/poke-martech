import { ArenaScreen } from "@/components/arena/arena-screen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arena",
};

export default function BatalhaPage() {
  return <ArenaScreen />;
}
