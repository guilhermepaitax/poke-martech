import { BoosterDetail } from "@/components/booster-detail/booster-detail";

export default async function BoosterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BoosterDetail slug={slug} />;
}
