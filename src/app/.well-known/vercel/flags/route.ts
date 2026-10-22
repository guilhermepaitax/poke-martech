import { getProviderData } from "@flags-sdk/vercel";
import { createFlagsDiscoveryEndpoint } from "flags/next";
import * as flags from "@/flags";

const GET = createFlagsDiscoveryEndpoint(() => getProviderData(flags));

export { GET };
