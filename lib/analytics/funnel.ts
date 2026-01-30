import { STAGES, type Stage } from "@/lib/schema";
import type { DealRollup } from "@/lib/analytics/rollups";

export type FunnelPoint = {
  stage: Stage;
  stage_order: number;
  reachedCount: number;
  reachedPct: number; // 0..1
};

export type DropoffPoint = {
  from: Stage;
  to: Stage;
  fromOrder: number;
  toOrder: number;
  fromCount: number;
  toCount: number;
  dropPct: number; // 0..1
};

export function computeFunnel(deals: DealRollup[]): FunnelPoint[] {
  const total = deals.length;
  return STAGES.map(({ stage, stage_order }) => {
    const reachedCount = deals.filter((d) => d.reached_stage_max >= stage_order).length;
    const reachedPct = total ? reachedCount / total : 0;
    return { stage, stage_order, reachedCount, reachedPct };
  });
}

export function computeDropoffs(deals: DealRollup[]): DropoffPoint[] {
  const out: DropoffPoint[] = [];
  for (let i = 0; i < STAGES.length - 1; i++) {
    const from = STAGES[i]!;
    const to = STAGES[i + 1]!;
    const fromCount = deals.filter((d) => d.reached_stage_max >= from.stage_order).length;
    const toCount = deals.filter((d) => d.reached_stage_max >= to.stage_order).length;
    const dropPct = fromCount ? Math.max(0, (fromCount - toCount) / fromCount) : 0;
    out.push({
      from: from.stage,
      to: to.stage,
      fromOrder: from.stage_order,
      toOrder: to.stage_order,
      fromCount,
      toCount,
      dropPct
    });
  }
  return out;
}

