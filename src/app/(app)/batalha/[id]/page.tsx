import { BattleBoard } from "@/components/battle-board/battle-board";

export default async function BattleMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BattleBoard id={id} />;
}
