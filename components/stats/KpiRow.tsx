import type { CycleStats, DealRollup } from "@/lib/analytics/rollups";
import type { DropoffPoint } from "@/lib/analytics/funnel";

interface KpiRowProps {
    filteredDealsCount: number;
    filteredStageRowsCount: number;
    cycleStats: CycleStats;
    worstDropoff: DropoffPoint | null;
}

function KpiCard({
    label,
    value,
    sub,
}: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {label}
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {value}
            </div>
            {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
        </div>
    );
}

export function KpiRow({ filteredDealsCount, cycleStats, worstDropoff }: KpiRowProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
                label="Total Deals Analyzed"
                value={filteredDealsCount.toLocaleString()}
                sub="Across selected filters"
            />
            <KpiCard
                label="Overall Win Rate"
                value={`${(cycleStats.winRate * 100).toFixed(1)}%`}
                sub={`n=${cycleStats.nDeals}`}
            />
            <KpiCard
                label="Avg Total Cycle Time"
                value={`${cycleStats.avgTotalCycleTime.toFixed(1)} days`}
                sub="Time from first to last stage"
            />
            <KpiCard
                label="Largest Drop-off Stage"
                value={
                    worstDropoff
                        ? `${worstDropoff.from} → ${worstDropoff.to}`
                        : "No drop-off"
                }
                sub={
                    worstDropoff
                        ? `${(worstDropoff.dropPct * 100).toFixed(1)}% drop rate`
                        : undefined
                }
            />
        </div>
    );
}
