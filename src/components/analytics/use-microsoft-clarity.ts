"use client";

import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

function useMicrosoftClarity() {
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) return;
    Clarity.init(projectId);
  }, []);
}

export { useMicrosoftClarity };
