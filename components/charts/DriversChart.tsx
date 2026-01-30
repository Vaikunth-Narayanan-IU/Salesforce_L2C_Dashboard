"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ModelResult } from "@/lib/analytics/model";

function fmt(n: number) {
  return n.toFixed(3);
}

export function DriversChart(props: {
  status: "idle" | "training" | "ready" | "error";
  result: ModelResult | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Friction Drivers</h2>
          <p className="mt-1 text-sm text-slate-600">
            Simple logistic regression on deal-level features.{" "}
            <span className="text-slate-500">Model is explanatory, not predictive.</span>
          </p>
        </div>
      </div>

      {props.status === "training" ? (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Training model…
        </div>
      ) : props.result?.ok === false ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {props.result.message}
        </div>
      ) : props.result?.ok === true ? (
        <>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={props.result.drivers
                  .slice()
                  .reverse()
                  .map((d) => ({ feature: d.feature, importance: d.importance, coef: d.coefficient }))}
                layout="vertical"
                margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11 }} width={140} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload as {
                      feature: string;
                      importance: number;
                      coef: number;
                    };
                    return (
                      <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm">
                        <div className="font-semibold text-slate-900">{label}</div>
                        <div className="mt-1 text-slate-700">
                          |coef|: <span className="font-medium">{fmt(p.importance)}</span>
                        </div>
                        <div className="text-slate-700">
                          coef: <span className="font-medium">{fmt(p.coef)}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="importance" fill="#006F9E" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <span className="font-medium text-slate-900">Deals:</span>{" "}
                {props.result.metrics.nDeals}
              </span>
              <span>
                <span className="font-medium text-slate-900">Win rate:</span>{" "}
                {(props.result.metrics.positiveRate * 100).toFixed(1)}%
              </span>
              <span>
                <span className="font-medium text-slate-900">Accuracy:</span>{" "}
                {(props.result.metrics.accuracy * 100).toFixed(1)}%
              </span>
              <span>
                <span className="font-medium text-slate-900">AUC:</span>{" "}
                {props.result.metrics.auc === null
                  ? "n/a"
                  : props.result.metrics.auc.toFixed(3)}
              </span>
              <span className="text-slate-500">80/20 split, deterministic seed</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          Load data to compute friction drivers.
        </div>
      )}
    </div>
  );
}

