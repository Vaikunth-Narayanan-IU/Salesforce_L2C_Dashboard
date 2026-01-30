import Papa from "papaparse";
import { z } from "zod";

import { REQUIRED_COLUMNS, StageRowSchema, type StageRow } from "@/lib/schema";

export type InvalidRowPreview = {
  rowNumber: number;
  raw: Record<string, unknown>;
  issues: string[];
};

export type ParseResult =
  | {
      ok: true;
      rows: StageRow[];
      droppedRowCount: number;
      invalidRowsPreview: InvalidRowPreview[];
      missingColumns: string[];
      papaErrors: string[];
    }
  | {
      ok: false;
      error: string;
      missingColumns: string[];
      invalidRowsPreview: InvalidRowPreview[];
      papaErrors: string[];
    };

function formatZodIssues(err: z.ZodError): string[] {
  return err.issues.map((i) => {
    const path = i.path.length ? i.path.join(".") : "row";
    return `${path}: ${i.message}`;
  });
}

export function parseCsvText(csvText: string): ParseResult {
  const papa = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });

  const papaErrors = (papa.errors ?? []).slice(0, 10).map((e) => e.message);

  const fields = (papa.meta.fields ?? []).map((f) => String(f).trim());
  const missingColumns = REQUIRED_COLUMNS.filter((c) => !fields.includes(c));

  if (missingColumns.length > 0) {
    return {
      ok: false,
      error: `CSV is missing required columns: ${missingColumns.join(", ")}`,
      missingColumns,
      invalidRowsPreview: [],
      papaErrors
    };
  }

  const rows: StageRow[] = [];
  const invalidRowsPreview: InvalidRowPreview[] = [];

  let droppedRowCount = 0;

  // PapaParse includes a trailing empty object sometimes; skipEmptyLines should handle it, but keep a guard.
  const data = (papa.data ?? []).filter((r) => r && Object.keys(r).length > 0);

  for (let i = 0; i < data.length; i++) {
    const raw = data[i] ?? {};
    const parsed = StageRowSchema.safeParse(raw);

    if (!parsed.success) {
      droppedRowCount += 1;
      if (invalidRowsPreview.length < 5) {
        invalidRowsPreview.push({
          rowNumber: i + 2, // +1 for 0-index, +1 for header row
          raw,
          issues: formatZodIssues(parsed.error)
        });
      }
      continue;
    }

    rows.push(parsed.data);
  }

  return {
    ok: true,
    rows,
    droppedRowCount,
    invalidRowsPreview,
    missingColumns: [],
    papaErrors
  };
}

