"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOpening, fetchPublicProfile } from "@/services/catalog";

const openingKeys = {
  all: ["openings"] as const,
  detail: (id: string) => [...openingKeys.all, id] as const,
};

function useOpening(id: string) {
  return useQuery({ queryKey: openingKeys.detail(id), queryFn: () => fetchOpening(id) });
}

const publicProfileKeys = {
  all: ["public-profile"] as const,
  detail: (username: string) => [...publicProfileKeys.all, username] as const,
};

function usePublicProfile(username: string) {
  return useQuery({
    queryKey: publicProfileKeys.detail(username),
    queryFn: () => fetchPublicProfile(username),
  });
}

export { useOpening, usePublicProfile };
