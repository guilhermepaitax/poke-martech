import { Layers, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton, LoadingScreen, ShopGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PreviewEstados() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-4 py-10">
      <LoadingScreen label="Carregando loja" className="flex flex-col gap-6">
        <Skeleton className="h-10 w-24" />
        <ShopGridSkeleton />
      </LoadingScreen>
      <div className="flex min-h-[70vh] flex-col gap-6">
        <h1 className="text-4xl font-semibold tracking-tight">Loja</h1>
        <EmptyState
          placement="fill"
          icon={Package}
          title="Nenhum pacote à venda"
          description="Quando um pacote estiver ativo no catálogo, ele aparece aqui para você abrir."
        />
      </div>
      <div className="flex min-h-[70vh] flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Cartas</h1>
        </div>
        <EmptyState
          placement="fill"
          icon={Layers}
          title="Nenhuma carta cadastrada"
          description="Crie a primeira carta do catálogo para ela aparecer na loja e na Pokédex."
        />
      </div>
      <ListSkeleton count={3} />
    </main>
  );
}
