"use client";

import { useExplorerStore } from "@/store/useExplorerStore";

const TENURE_BUCKETS = ["0-1", "1-3", "3-6", "6+"] as const;

function SelectField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">{props.label}</span>
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltersBar() {
  const availableSegments = useExplorerStore((s) => s.availableSegments);
  const availableRegions = useExplorerStore((s) => s.availableRegions);
  const filters = useExplorerStore((s) => s.filters);
  const setFilters = useExplorerStore((s) => s.actions.setFilters);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900">Filter Deals</h2>
        <span className="text-xs text-slate-500">
          Filters apply to all charts below
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Segment"
          value={filters.segment}
          onChange={(segment) => setFilters({ segment })}
          options={[
            { value: "All", label: "All Segments" },
            ...availableSegments.map((s) => ({ value: s, label: s }))
          ]}
        />

        <SelectField
          label="Region"
          value={filters.region}
          onChange={(region) => setFilters({ region })}
          options={[
            { value: "All", label: "All Regions" },
            ...availableRegions.map((r) => ({ value: r, label: r }))
          ]}
        />

        <SelectField
          label="Seller Tenure"
          value={filters.sellerTenureBucket}
          onChange={(sellerTenureBucket) => setFilters({ sellerTenureBucket })}
          options={[
            { value: "All", label: "All Tenures" },
            ...TENURE_BUCKETS.map((b) => ({ value: b, label: b }))
          ]}
        />

        <SelectField
          label="Outcome"
          value={filters.outcome}
          onChange={(outcome) => setFilters({ outcome: outcome as "All" | "Won" | "Lost" })}
          options={[
            { value: "All", label: "All Outcomes" },
            { value: "Won", label: "Won" },
            { value: "Lost", label: "Lost" }
          ]}
        />
      </div>
    </div>
  );
}

