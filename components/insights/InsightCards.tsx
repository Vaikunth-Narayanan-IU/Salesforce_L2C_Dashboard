"use client";

import type { InsightCard } from "@/lib/analytics/insights";

export function InsightCards(props: { insights: InsightCard[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-base font-semibold">Insight Cards</h2>
        <p className="mt-1 text-sm text-slate-600">
          Deterministic rules generated from the current filters.
        </p>
      </div>

      {props.insights.length === 0 ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Not enough data to generate insights for the current filters.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {props.insights.map((c) => (
            <div key={c.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">{c.title}</div>
              <div className="mt-2 text-sm text-slate-700">{c.insight}</div>
              <div className="mt-3 text-sm text-slate-600">
                <span className="font-medium text-slate-900">Suggested action:</span>{" "}
                {c.suggestedAction}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

