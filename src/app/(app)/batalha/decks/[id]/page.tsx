import { DeckBuilder } from "@/components/deck-builder/deck-builder";

export default async function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeckBuilder deckId={id} />;
}
