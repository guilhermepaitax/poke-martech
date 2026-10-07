import { nextRouteAdapter } from "@/server/adapters/next/http-adapter";
import { container } from "@/server/container";

const GET = nextRouteAdapter(() => container.listPokemonTypes.execute());

export { GET };
