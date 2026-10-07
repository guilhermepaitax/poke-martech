"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "@/services/catalog";

const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

function useProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: fetchProfile,
  });
}

export { profileKeys, useProfile };
