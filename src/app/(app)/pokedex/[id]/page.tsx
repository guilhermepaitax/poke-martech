import { CardDetail } from "@/components/card-detail/card-detail";

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CardDetail id={id} />;
}
