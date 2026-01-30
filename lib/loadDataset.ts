import { parseCsvText, type ParseResult } from "@/lib/parseCsv";
import { computeDealRollups } from "@/lib/analytics/rollups";

type OkParse = Extract<ParseResult, { ok: true }>;

export type LoadedDataset = {
  stageRows: OkParse["rows"];
  deals: ReturnType<typeof computeDealRollups>;
  availableSegments: string[];
  availableRegions: string[];
  parseSummary: {
    droppedRowCount: number;
    invalidRowsPreview: OkParse["invalidRowsPreview"];
    papaErrors: OkParse["papaErrors"];
    missingColumns: OkParse["missingColumns"];
  };
};

export function buildDatasetFromCsvText(csvText: string): { ok: true; dataset: LoadedDataset } | { ok: false; error: string } {
  const parsed = parseCsvText(csvText);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const deals = computeDealRollups(parsed.rows);
  const availableSegments = Array.from(new Set(deals.map((d) => d.segment))).sort();
  const availableRegions = Array.from(new Set(deals.map((d) => d.region))).sort();

  return {
    ok: true,
    dataset: {
      stageRows: parsed.rows,
      deals,
      availableSegments,
      availableRegions,
      parseSummary: {
        droppedRowCount: parsed.droppedRowCount,
        invalidRowsPreview: parsed.invalidRowsPreview,
        papaErrors: parsed.papaErrors,
        missingColumns: parsed.missingColumns
      }
    }
  };
}

export async function fetchCsvText(url: string): Promise<{ ok: true; csvText: string } | { ok: false; error: string }> {
  const res = await fetch(url);
  if (!res.ok) return { ok: false, error: `Failed to fetch CSV from ${url}` };
  const csvText = await res.text();
  return { ok: true, csvText };
}

