import { ShopList } from "@/components/shop-list/shop-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loja",
};

export default function LojaPage() {
  return <ShopList />;
}
