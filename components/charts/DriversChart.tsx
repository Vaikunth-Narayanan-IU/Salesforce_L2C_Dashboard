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
          <h2 className="text-base font-semibold text-slate-900">Primary Friction Drivers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Factors that most strongly correlate with deal friction/loss
          </p>
        </div>
      </div>

      {props.status === "training" ? (
        <div className="mt-8 flex h-40 animate-pulse items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-500">Training model on current data...</p>
        </div>
      ) : props.result?.ok === false ? (
        <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {props.result.message}
        </div>
      ) : props.result?.ok === true ? (
        <>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={props.result.drivers
                  .slice()
                  .reverse()
                  .map((d) => ({ feature: d.feature, importance: d.importance, coef: d.coefficient }))}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="feature"
                  tick={{ fontSize: 11, fill: "#475569" }}
                  width={150}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#F1F5F9" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload as {
                      feature: string;
                      importance: number;
                      coef: number;
                    };
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg ring-1 ring-black/5">
                        <div className="font-semibold text-slate-900">{label}</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Impact:</span>
                            <span className="font-medium text-slate-900">{fmt(p.importance)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-600">Coefficient:</span>
                            <span className="font-medium text-slate-900">{fmt(p.coef)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="importance"
                  fill="#006F9E"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <span className="font-semibold text-slate-900">Deals Analyzed:</span>{" "}
                {props.result.metrics.nDeals}
              </span>
              <span>
                <span className="font-semibold text-slate-900">Win Rate:</span>{" "}
                {(props.result.metrics.positiveRate * 100).toFixed(1)}%
              </span>
              <span>
                <span className="font-semibold text-slate-900">Model Accuracy:</span>{" "}
                {(props.result.metrics.accuracy * 100).toFixed(1)}%
              </span>
              <span className="text-slate-400">Logistic Regression (80/20 split)</span>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-8 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <p className="text-sm text-slate-500">Not enough data to compute drivers</p>
        </div>
      )}
    </div>
  );
}

