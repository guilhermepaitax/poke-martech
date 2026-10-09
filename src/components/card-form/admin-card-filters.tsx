"use client";

import { Search } from "lucide-react";
import type { SelectOption } from "@/components/ui/select-field";
import { SelectField } from "@/components/ui/select-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AdminCardFilterState } from "./filter-admin-cards";

const STATUS_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "draft", label: "Rascunhos" },
  { value: "published", label: "Publicadas" },
];

interface AdminCardFiltersProps {
  filters: AdminCardFilterState;
  typeOptions: SelectOption[];
  rarityOptions: SelectOption[];
  hasActiveFilters: boolean;
  onNameChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onEnergyTypeChange: (value: string) => void;
  onRarityChange: (value: string) => void;
  onClear: () => void;
}

function AdminCardFilters({
  filters,
  typeOptions,
  rarityOptions,
  hasActiveFilters,
  onNameChange,
  onStatusChange,
  onEnergyTypeChange,
  onRarityChange,
  onClear,
}: AdminCardFiltersProps) {
  return (
    <div data-slot="admin-card-filters" className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={filters.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="Buscar pelo nome"
          aria-label="Buscar pelo nome"
          autoComplete="off"
          className="glass border-white/80 bg-surface pl-9"
        />
      </div>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <SegmentedControl
          ariaLabel="Status da carta"
          value={filters.status}
          options={STATUS_OPTIONS}
          onValueChange={onStatusChange}
        />
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            value={filters.energyType}
            onValueChange={onEnergyTypeChange}
            options={typeOptions}
            ariaLabel="Tipo"
          />
          <SelectField
            value={filters.rarity}
            onValueChange={onRarityChange}
            options={rarityOptions}
            ariaLabel="Raridade"
          />
        </div>
        {hasActiveFilters ? (
          <Button variant="outline" size="sm" onClick={onClear} className="w-fit">
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { AdminCardFilters };
