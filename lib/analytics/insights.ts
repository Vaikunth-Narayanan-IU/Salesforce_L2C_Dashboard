import { STAGES, type Stage } from "@/lib/schema";
import type { DropoffPoint, FunnelPoint } from "@/lib/analytics/funnel";
import type { DealRollup, StageAgg } from "@/lib/analytics/rollups";

export type InsightCard = {
  id: string;
  title: string;
  insight: string;
  suggestedAction: string;
};

function pct(n: number, d: number): number {
  if (!d) return 0;
  return (n / d) * 100;
}

function fmtPct(p: number): string {
  return `${p.toFixed(1)}%`;
}

function winRate(deals: DealRollup[]): { won: number; total: number; rate: number } {
  const total = deals.length;
  const won = deals.filter((d) => d.outcome === "Won").length;
  return { won, total, rate: total ? won / total : 0 };
}

function bucket3(
  value: number,
  buckets: Array<{ label: string; test: (v: number) => boolean }>
): string {
  return buckets.find((b) => b.test(value))?.label ?? "Unknown";
}

export function generateInsights(args: {
  deals: DealRollup[];
  stageAggs: StageAgg[];
  funnel: FunnelPoint[];
  dropoffs: DropoffPoint[];
}): InsightCard[] {
  const { deals, stageAggs, dropoffs } = args;
  if (deals.length === 0) return [];

  const cards: InsightCard[] = [];

  // Approval buckets
  {
    const buckets = [
      { label: "0–1", test: (v: number) => v <= 1 },
      { label: "2–3", test: (v: number) => v >= 2 && v <= 3 },
      { label: "4+", test: (v: number) => v >= 4 }
    ];

    const by = new Map<string, DealRollup[]>();
    for (const d of deals) {
      const b = bucket3(d.approval_count, buckets);
      by.set(b, [...(by.get(b) ?? []), d]);
    }

    const stats = buckets.map((b) => ({ label: b.label, ...winRate(by.get(b.label) ?? []) }));
    const deltas = [
      { from: stats[0]!, to: stats[1]! },
      { from: stats[1]!, to: stats[2]! }
    ]
      .filter((x) => x.from.total > 0 && x.to.total > 0)
      .map((x) => ({
        from: x.from,
        to: x.to,
        deltaPts: (x.to.rate - x.from.rate) * 100
      }))
      .sort((a, b) => a.deltaPts - b.deltaPts); // most negative first

    const biggestDrop = deltas[0];
    if (biggestDrop) {
      cards.push({
        id: "approvals-buckets",
        title: "Approvals vs win rate",
        insight: `Deals with ${biggestDrop.to.label} approvals have a win rate of ${fmtPct(
          biggestDrop.to.rate * 100
        )} (n=${biggestDrop.to.total}) vs ${fmtPct(biggestDrop.from.rate * 100)} for ${
          biggestDrop.from.label
        } approvals (n=${biggestDrop.from.total}) (Δ=${biggestDrop.deltaPts.toFixed(1)} pts).`,
        suggestedAction: "Review approval steps and consolidate approvers."
      });
    }
  }

  // Quote revisions buckets
  {
    const buckets = [
      { label: "0–1", test: (v: number) => v <= 1 },
      { label: "2–3", test: (v: number) => v >= 2 && v <= 3 },
      { label: "4+", test: (v: number) => v >= 4 }
    ];

    const by = new Map<string, DealRollup[]>();
    for (const d of deals) {
      const b = bucket3(d.quote_revisions, buckets);
      by.set(b, [...(by.get(b) ?? []), d]);
    }

    const stats = buckets.map((b) => ({ label: b.label, ...winRate(by.get(b.label) ?? []) }));
    const deltas = [
      { from: stats[0]!, to: stats[1]! },
      { from: stats[1]!, to: stats[2]! }
    ]
      .filter((x) => x.from.total > 0 && x.to.total > 0)
      .map((x) => ({
        from: x.from,
        to: x.to,
        deltaPts: (x.to.rate - x.from.rate) * 100
      }))
      .sort((a, b) => a.deltaPts - b.deltaPts);

    const biggestDrop = deltas[0];
    if (biggestDrop) {
      cards.push({
        id: "revisions-buckets",
        title: "Quote revisions vs win rate",
        insight: `Deals with ${biggestDrop.to.label} quote revisions have a win rate of ${fmtPct(
          biggestDrop.to.rate * 100
        )} (n=${biggestDrop.to.total}) vs ${fmtPct(biggestDrop.from.rate * 100)} for ${
          biggestDrop.from.label
        } revisions (n=${biggestDrop.from.total}) (Δ=${biggestDrop.deltaPts.toFixed(1)} pts).`,
        suggestedAction: "Reduce quote rework via guided quoting templates."
      });
    }
  }

  // Drop-off hotspot
  {
    const worst = dropoffs
      .slice()
      .sort((a, b) => b.dropPct - a.dropPct)
      .find((d) => d.fromCount > 0);
    if (worst) {
      cards.push({
        id: "dropoff-hotspot",
        title: "Biggest drop-off hotspot",
        insight: `The largest drop-off is ${worst.from}→${worst.to}: ${fmtPct(
          worst.dropPct * 100
        )} (from n=${worst.fromCount} to n=${worst.toCount}).`,
        suggestedAction: "Review handoffs and exit criteria for this transition."
      });
    }
  }

  // Stage bottleneck (highest median stage duration)
  {
    const bottleneck = stageAggs
      .filter((s) => s.n > 0)
      .slice()
      .sort((a, b) => b.median - a.median)[0];
    if (bottleneck) {
      cards.push({
        id: "stage-bottleneck",
        title: "Stage bottleneck",
        insight: `${bottleneck.stage} has the highest median stage duration at ${bottleneck.median.toFixed(
          1
        )} days (n=${bottleneck.n}).`,
        suggestedAction: "Audit bottlenecks and unblock common waiting states in this stage."
      });
    }
  }

  // Segment difference (lowest win rate segment + its longest-median stage)
  {
    const segments = Array.from(new Set(deals.map((d) => d.segment)));
    const segStats = segments
      .map((seg) => {
        const ds = deals.filter((d) => d.segment === seg);
        const wr = winRate(ds);
        return { seg, ...wr };
      })
      .filter((s) => s.total >= 30)
      .sort((a, b) => a.rate - b.rate)[0];

    if (segStats) {
      // Try to approximate "stage with longest median duration in that segment" using deal-level stage times.
      const stageMedians: Array<{ stage: Stage; median: number }> = STAGES.map(({ stage }) => {
        const vals = deals
          .filter((d) => d.segment === segStats.seg)
          .map((d) => {
            if (stage === "Qualify") return d.time_in_qualify;
            if (stage === "Opportunity") return d.time_in_opportunity;
            if (stage === "Quote") return d.time_in_quote;
            return 0;
          })
          .filter((v) => v > 0)
          .sort((a, b) => a - b);

        const median = vals.length ? vals[Math.floor(vals.length / 2)]! : 0;
        return { stage, median };
      }).filter((s) => s.median > 0);

      const worstStage = stageMedians.sort((a, b) => b.median - a.median)[0];

      cards.push({
        id: "segment-low-winrate",
        title: "Segment risk area",
        insight: `Lowest win-rate segment is ${segStats.seg}: ${fmtPct(segStats.rate * 100)} (n=${
          segStats.total
        }).${
          worstStage
            ? ` Within this segment, ${worstStage.stage} has the longest median time at ${worstStage.median.toFixed(
                1
              )} days.`
            : ""
        }`,
        suggestedAction: "Improve qualification playbooks and tighten stage exit criteria for this segment."
      });
    }
  }

  return cards.slice(0, 6);
}

