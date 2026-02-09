"use client";

import type { InsightCard } from "@/lib/analytics/insights";

export function InsightCards(props: { insights: InsightCard[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">Key Insights</h2>
        <p className="mt-1 text-sm text-slate-500">
          Automated analysis of current friction points
        </p>
      </div>

      {props.insights.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-500">Not enough data to generate insights for the current filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {props.insights.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-shadow hover:shadow-md"
            >
              <div>
                <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-700">
                  {c.insight}
                </div>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="text-xs font-medium uppercase text-slate-500">
                  Suggested Action
                </div>
                <div className="mt-1 text-sm text-slate-600">{c.suggestedAction}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

