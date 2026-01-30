import { z } from "zod";

export const STAGES = [
  { stage: "Lead", stage_order: 1 },
  { stage: "Qualify", stage_order: 2 },
  { stage: "Opportunity", stage_order: 3 },
  { stage: "Quote", stage_order: 4 },
  { stage: "Close", stage_order: 5 }
] as const;

export const StageEnum = z.enum(["Lead", "Qualify", "Opportunity", "Quote", "Close"]);
export type Stage = z.infer<typeof StageEnum>;

export const OutcomeEnum = z.enum(["Won", "Lost"]);
export type Outcome = z.infer<typeof OutcomeEnum>;

const trimmedNonEmptyString = z.coerce.string().trim().min(1);

function finiteNumber(min?: number) {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return Number.NaN;
    const s = String(v).trim();
    if (!s) return Number.NaN;
    return Number(s);
  }, min === undefined ? z.number().finite() : z.number().finite().min(min));
}

function finiteInt(min?: number) {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return Number.NaN;
    const s = String(v).trim();
    if (!s) return Number.NaN;
    return Number.parseInt(s, 10);
  }, min === undefined ? z.number().int().finite() : z.number().int().finite().min(min));
}

export const StageRowSchema = z
  .object({
    deal_id: trimmedNonEmptyString,
    stage: StageEnum,
    stage_order: finiteInt(1).pipe(z.number().max(5)),
    stage_duration_days: finiteNumber(0),
    rep: trimmedNonEmptyString,
    region: trimmedNonEmptyString,
    segment: trimmedNonEmptyString,
    seller_tenure_years: finiteNumber(0),
    seller_tenure_bucket: trimmedNonEmptyString,
    approval_count: finiteInt(0),
    quote_revisions: finiteInt(0),
    outcome: OutcomeEnum
  })
  .superRefine((row, ctx) => {
    const expectedOrder = STAGES.find((s) => s.stage === row.stage)?.stage_order;
    if (expectedOrder && expectedOrder !== row.stage_order) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `stage_order (${row.stage_order}) does not match stage (${row.stage} expects ${expectedOrder})`,
        path: ["stage_order"]
      });
    }
  });

export type StageRow = z.infer<typeof StageRowSchema>;

export const REQUIRED_COLUMNS = [
  "deal_id",
  "stage",
  "stage_order",
  "stage_duration_days",
  "rep",
  "region",
  "segment",
  "seller_tenure_years",
  "seller_tenure_bucket",
  "approval_count",
  "quote_revisions",
  "outcome"
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

