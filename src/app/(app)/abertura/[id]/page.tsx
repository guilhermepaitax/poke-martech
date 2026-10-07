import { PackOpening } from "@/components/pack-opening/pack-opening";

export default async function OpeningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PackOpening id={id} />;
}
