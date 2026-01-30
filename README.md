# L2O Funnel Friction Explorer

Production-quality browser app to explore Lead-to-Cash (L2C) funnel friction from a stage-level CSV. All processing happens locally in the browser (uploaded CSV) or via a bundled **synthetic** sample dataset.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Recharts
- PapaParse
- Zod
- Zustand
- @tanstack/react-table
- Web Worker for model training

## Getting started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

If you see `Watchpack Error (watcher): EMFILE: too many open files`, increase your OS file-descriptor limit or run with polling:

```bash
WATCHPACK_POLLING=true npm run dev
```

## Pages

- `/` Dashboard
- `/about` Schema + disclaimers

## Data loading

- **Upload CSV**: Use the header button. Your data stays in the browser.
- **Load sample data**: Loads `public/sample/l2o_funnel_synthetic_dataset.csv`.
- **Download sample CSV**: Downloads the bundled sample.

## Input schema (stage-level rows)

Required columns:

- `deal_id`
- `stage` (Lead, Qualify, Opportunity, Quote, Close)
- `stage_order` (1..5 matching the stage)
- `stage_duration_days` (float)
- `rep`
- `region`
- `segment`
- `seller_tenure_years` (float)
- `seller_tenure_bucket` (string; expected: 0-1, 1-3, 3-6, 6+)
- `approval_count` (int)
- `quote_revisions` (int)
- `outcome` (Won or Lost)

Parsing pipeline:

- PapaParse parses CSV with headers
- Zod validates and coerces types
- Rows missing required fields or invalid values are dropped (count shown); first 5 invalid rows are previewed

## Analytics (high level)

### Deal-level rollups

Computed first (then filtered), including:

- `total_cycle_time_days` = sum of stage durations per deal
- `reached_stage_max` = max `stage_order` per deal
- `dropped_at_stage` = if Lost and `reached_stage_max < 5` then stage name else `Close/Won`
- `stage_count` = number of distinct stages observed

### Funnel + drop-off

- Funnel: % of deals reaching each stage (Lead = 100% relative to the filtered deal set)
- Drop-off heatmap: stage-to-stage drop-off % for transitions

### Friction drivers (simple model)

In-browser logistic regression (gradient descent), trained on filtered deal rollups:

- Features: approvals, quote revisions, total cycle time, time in qualify/opportunity/quote, seller tenure years, segment one-hot, region one-hot
- Target: `Won=1`, `Lost=0`
- Metrics: Accuracy + AUC (80/20 split, deterministic seed)
- Output: Top 8 drivers by absolute coefficient magnitude

**Modeling disclaimer:** The model is explanatory (association-focused), not predictive.

## Synthetic data disclaimer

The bundled sample dataset is synthetic and provided for demonstration only.

## Key files

- `app/page.tsx` Dashboard
- `app/about/page.tsx` About page
- `components/filters/FiltersBar.tsx` Filters UI
- `components/charts/*` Charts
- `components/insights/InsightCards.tsx` Insight cards
- `components/table/DataTable.tsx` Table view
- `lib/schema.ts` Zod schema + required columns
- `lib/parseCsv.ts` CSV parsing + validation
- `lib/analytics/*` Rollups, funnel, model, insights
- `store/useExplorerStore.ts` Zustand client store
- `workers/analytics.worker.ts` Web Worker (model training)

