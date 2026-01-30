import { create } from "zustand";

import type { InvalidRowPreview } from "@/lib/parseCsv";
import type { StageRow } from "@/lib/schema";
import type { DealRollup } from "@/lib/analytics/rollups";
import type { ModelResult } from "@/lib/analytics/model";

export type DataSource = "none" | "sample" | "custom";

export type ExplorerFilters = {
  segment: string; // "All" or a value
  region: string; // "All" or a value
  sellerTenureBucket: string; // "All" or one of: 0-1, 1-3, 3-6, 6+
  outcome: "All" | "Won" | "Lost";
};

export type ParseSummary = {
  droppedRowCount: number;
  invalidRowsPreview: InvalidRowPreview[];
  papaErrors: string[];
  missingColumns: string[];
};

export type ExplorerState = {
  source: DataSource;
  stageRows: StageRow[];
  deals: DealRollup[];
  parseSummary: ParseSummary | null;
  loadError: string | null;

  availableSegments: string[];
  availableRegions: string[];

  filters: ExplorerFilters;

  modelStatus: "idle" | "training" | "ready" | "error";
  modelResult: ModelResult | null;

  actions: {
    setFilters: (patch: Partial<ExplorerFilters>) => void;
    loadData: (args: {
      source: DataSource;
      stageRows: StageRow[];
      deals: DealRollup[];
      parseSummary: ParseSummary;
      availableSegments: string[];
      availableRegions: string[];
    }) => void;
    setLoadError: (message: string | null) => void;
    clearData: () => void;
    setModelTraining: () => void;
    setModelResult: (result: ModelResult) => void;
    setModelError: (message: string) => void;
  };
};

const defaultFilters: ExplorerFilters = {
  segment: "All",
  region: "All",
  sellerTenureBucket: "All",
  outcome: "All"
};

export const useExplorerStore = create<ExplorerState>((set) => ({
  source: "none",
  stageRows: [],
  deals: [],
  parseSummary: null,
  loadError: null,
  availableSegments: [],
  availableRegions: [],
  filters: defaultFilters,

  modelStatus: "idle",
  modelResult: null,

  actions: {
    setFilters: (patch) =>
      set((s) => ({
        filters: {
          ...s.filters,
          ...patch
        }
      })),
    loadData: (args) =>
      set(() => ({
        source: args.source,
        stageRows: args.stageRows,
        deals: args.deals,
        parseSummary: args.parseSummary,
        loadError: null,
        availableSegments: args.availableSegments,
        availableRegions: args.availableRegions,
        filters: defaultFilters,
        modelStatus: "idle",
        modelResult: null
      })),
    setLoadError: (message) => set(() => ({ loadError: message })),
    clearData: () =>
      set(() => ({
        source: "none",
        stageRows: [],
        deals: [],
        parseSummary: null,
        loadError: null,
        availableSegments: [],
        availableRegions: [],
        filters: defaultFilters,
        modelStatus: "idle",
        modelResult: null
      })),
    setModelTraining: () => set(() => ({ modelStatus: "training" })),
    setModelResult: (result) =>
      set(() => ({
        modelStatus: result.ok ? "ready" : "error",
        modelResult: result
      })),
    setModelError: (message) =>
      set(() => ({
        modelStatus: "error",
        modelResult: { ok: false, message }
      }))
  }
}));

