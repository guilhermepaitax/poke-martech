"use client";

import { createContext } from "react";
import type { FeatureFlagMap } from "@/lib/feature-flags";

const FeatureFlagsContext = createContext<FeatureFlagMap | null>(null);

export { FeatureFlagsContext };
