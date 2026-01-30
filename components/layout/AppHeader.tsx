"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { SAMPLE_CSV_PATH } from "@/lib/constants";
import { buildDatasetFromCsvText, fetchCsvText } from "@/lib/loadDataset";
import { useExplorerStore } from "@/store/useExplorerStore";

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function DataStatusChip({ source }: { source: "none" | "sample" | "custom" }) {
  const label =
    source === "sample"
      ? "Sample data loaded"
      : source === "custom"
        ? "Custom data loaded"
        : "No data loaded";

  const styles =
    source === "sample"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : source === "custom"
        ? "border-brand-200 bg-brand-50 text-brand-900"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles
      )}
    >
      {label}
    </span>
  );
}

export function AppHeader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const source = useExplorerStore((s) => s.source);
  const actions = useExplorerStore((s) => s.actions);

  async function loadCsvText(csvText: string, nextSource: "sample" | "custom") {
    setBusy(true);
    try {
      actions.setLoadError(null);

      const built = buildDatasetFromCsvText(csvText);
      if (!built.ok) {
        actions.setLoadError(built.error);
        return;
      }

      actions.loadData({
        source: nextSource,
        stageRows: built.dataset.stageRows,
        deals: built.dataset.deals,
        parseSummary: built.dataset.parseSummary,
        availableSegments: built.dataset.availableSegments,
        availableRegions: built.dataset.availableRegions
      });
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(file: File | null | undefined) {
    if (!file) return;
    const csvText = await file.text();
    await loadCsvText(csvText, "custom");
  }

  async function onLoadSample() {
    const fetched = await fetchCsvText(SAMPLE_CSV_PATH);
    if (!fetched.ok) return actions.setLoadError(fetched.error);
    const csvText = fetched.csvText;
    await loadCsvText(csvText, "sample");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-slate-900">
            L2O Funnel Friction Explorer
          </Link>
          <nav className="hidden items-center gap-3 text-sm sm:flex">
            <Link href="/" className="text-slate-600 hover:text-brand-800">
              Dashboard
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-brand-800">
              About
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DataStatusChip source={source} />

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />

          <button
            type="button"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-60"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Upload CSV
          </button>

          <button
            type="button"
            className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 disabled:opacity-60"
            disabled={busy}
            onClick={onLoadSample}
            title="Load the bundled synthetic sample dataset"
          >
            Load sample data
          </button>

          <a
            href={SAMPLE_CSV_PATH}
            download
            className={classNames(
              "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2",
              busy && "pointer-events-none opacity-60"
            )}
          >
            Download sample CSV
          </a>
        </div>
      </div>
    </header>
  );
}

