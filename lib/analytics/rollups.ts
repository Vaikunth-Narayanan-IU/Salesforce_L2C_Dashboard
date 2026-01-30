import { STAGES, type Stage, type StageRow } from "@/lib/schema";

export type DealRollup = {
  deal_id: string;
  rep: string;
  region: string;
  segment: string;
  seller_tenure_years: number;
  seller_tenure_bucket: string;
  outcome: "Won" | "Lost";

  total_cycle_time_days: number;
  reached_stage_max: number;
  dropped_at_stage: string;
  stage_count: number;

  approval_count: number;
  quote_revisions: number;

  time_in_qualify: number;
  time_in_opportunity: number;
  time_in_quote: number;
};

export type StageAgg = {
  stage: Stage;
  stage_order: number;
  n: number;
  avg: number;
  median: number;
  p75: number;
};

export type CycleStats = {
  nDeals: number;
  winRate: number; // 0..1
  avgTotalCycleTime: number;
  medianTotalCycleTime: number;
};

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] === undefined) return sorted[base] ?? 0;
  return (sorted[base] ?? 0) + rest * ((sorted[base + 1] ?? 0) - (sorted[base] ?? 0));
}

function stageFromOrder(order: number): Stage {
  const found = STAGES.find((s) => s.stage_order === order)?.stage;
  return (found ?? "Lead") as Stage;
}

export function computeDealRollups(stageRows: StageRow[]): DealRollup[] {
  const byDeal = new Map<
    string,
    {
      deal_id: string;
      rep: string;
      region: string;
      segment: string;
      seller_tenure_years: number;
      seller_tenure_bucket: string;
      outcome: "Won" | "Lost";
      total_cycle_time_days: number;
      reached_stage_max: number;
      approval_count: number;
      quote_revisions: number;
      stagesSeen: Set<number>;
      time_in_qualify: number;
      time_in_opportunity: number;
      time_in_quote: number;
    }
  >();

  for (const r of stageRows) {
    const dealId = r.deal_id;
    const existing = byDeal.get(dealId);
    if (!existing) {
      byDeal.set(dealId, {
        deal_id: dealId,
        rep: r.rep,
        region: r.region,
        segment: r.segment,
        seller_tenure_years: r.seller_tenure_years,
        seller_tenure_bucket: r.seller_tenure_bucket,
        outcome: r.outcome,
        total_cycle_time_days: r.stage_duration_days,
        reached_stage_max: r.stage_order,
        approval_count: r.approval_count,
        quote_revisions: r.quote_revisions,
        stagesSeen: new Set([r.stage_order]),
        time_in_qualify: r.stage_order === 2 ? r.stage_duration_days : 0,
        time_in_opportunity: r.stage_order === 3 ? r.stage_duration_days : 0,
        time_in_quote: r.stage_order === 4 ? r.stage_duration_days : 0
      });
      continue;
    }

    existing.total_cycle_time_days += r.stage_duration_days;
    existing.reached_stage_max = Math.max(existing.reached_stage_max, r.stage_order);
    existing.approval_count = Math.max(existing.approval_count, r.approval_count);
    existing.quote_revisions = Math.max(existing.quote_revisions, r.quote_revisions);
    existing.stagesSeen.add(r.stage_order);

    if (r.stage_order === 2) existing.time_in_qualify += r.stage_duration_days;
    if (r.stage_order === 3) existing.time_in_opportunity += r.stage_duration_days;
    if (r.stage_order === 4) existing.time_in_quote += r.stage_duration_days;
  }

  const deals: DealRollup[] = [];
  for (const d of byDeal.values()) {
    const dropped =
      d.outcome === "Lost" && d.reached_stage_max < 5
        ? stageFromOrder(d.reached_stage_max)
        : "Close/Won";

    deals.push({
      deal_id: d.deal_id,
      rep: d.rep,
      region: d.region,
      segment: d.segment,
      seller_tenure_years: d.seller_tenure_years,
      seller_tenure_bucket: d.seller_tenure_bucket,
      outcome: d.outcome,
      total_cycle_time_days: d.total_cycle_time_days,
      reached_stage_max: d.reached_stage_max,
      dropped_at_stage: dropped,
      stage_count: d.stagesSeen.size,
      approval_count: d.approval_count,
      quote_revisions: d.quote_revisions,
      time_in_qualify: d.time_in_qualify,
      time_in_opportunity: d.time_in_opportunity,
      time_in_quote: d.time_in_quote
    });
  }

  return deals;
}

export function computeStageAggregates(stageRows: StageRow[]): StageAgg[] {
  const byStage = new Map<Stage, number[]>();
  for (const r of stageRows) {
    const arr = byStage.get(r.stage) ?? [];
    arr.push(r.stage_duration_days);
    byStage.set(r.stage, arr);
  }

  return STAGES.map(({ stage, stage_order }) => {
    const values = (byStage.get(stage) ?? []).slice().sort((a, b) => a - b);
    const n = values.length;
    const avg = n ? values.reduce((s, v) => s + v, 0) / n : 0;
    const median = n ? quantile(values, 0.5) : 0;
    const p75 = n ? quantile(values, 0.75) : 0;
    return { stage, stage_order, n, avg, median, p75 };
  });
}

export function computeCycleStats(deals: DealRollup[]): CycleStats {
  const nDeals = deals.length;
  if (nDeals === 0) {
    return { nDeals: 0, winRate: 0, avgTotalCycleTime: 0, medianTotalCycleTime: 0 };
  }

  const winCount = deals.filter((d) => d.outcome === "Won").length;
  const times = deals.map((d) => d.total_cycle_time_days).slice().sort((a, b) => a - b);
  const avgTotalCycleTime = times.reduce((s, v) => s + v, 0) / nDeals;
  const medianTotalCycleTime = quantile(times, 0.5);
  const winRate = winCount / nDeals;

  return { nDeals, winRate, avgTotalCycleTime, medianTotalCycleTime };
}

