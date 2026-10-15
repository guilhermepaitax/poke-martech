import { HomeDashboard } from "@/components/home-dashboard/home-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Início",
};

export default function HomePage() {
  return <HomeDashboard />;
}
