import type { DealRollup } from "@/lib/analytics/rollups";

export type ModelDriver = {
  feature: string;
  coefficient: number;
  importance: number;
};

export type ModelMetrics = {
  nDeals: number;
  positiveRate: number; // Won rate
  nTrain: number;
  nTest: number;
  accuracy: number;
  auc: number | null;
};

export type ModelResult =
  | {
      ok: true;
      drivers: ModelDriver[];
      metrics: ModelMetrics;
    }
  | {
      ok: false;
      message: string;
    };

type Categories = {
  segments: string[];
  regions: string[];
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sigmoid(z: number): number {
  // Stable-ish sigmoid for typical ranges
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function aucScore(yTrue: number[], yProb: number[]): number | null {
  let pos = 0;
  let neg = 0;
  for (const y of yTrue) y === 1 ? (pos += 1) : (neg += 1);
  if (pos === 0 || neg === 0) return null;

  const pairs = yProb.map((p, i) => ({ p, y: yTrue[i]! }));
  pairs.sort((a, b) => a.p - b.p);

  // Rank-based AUC (equivalent to Mann–Whitney U)
  let rankSumPos = 0;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i]!.y === 1) rankSumPos += i + 1; // ranks are 1-based
  }

  const u = rankSumPos - (pos * (pos + 1)) / 2;
  return u / (pos * neg);
}

function standardize(
  X: number[][],
  numericFeatureCount: number
): { Xs: number[][]; means: number[]; stds: number[] } {
  const n = X.length;
  const means = new Array(numericFeatureCount).fill(0);
  const stds = new Array(numericFeatureCount).fill(0);

  for (let j = 0; j < numericFeatureCount; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += X[i]![j]!;
    means[j] = s / n;
  }

  for (let j = 0; j < numericFeatureCount; j++) {
    let ss = 0;
    for (let i = 0; i < n; i++) {
      const d = (X[i]![j] ?? 0) - (means[j] ?? 0);
      ss += d * d;
    }
    stds[j] = Math.sqrt(ss / n) || 1;
  }

  const Xs = X.map((row) => {
    const out = row.slice();
    for (let j = 0; j < numericFeatureCount; j++) {
      out[j] = ((out[j] ?? 0) - (means[j] ?? 0)) / (stds[j] ?? 1);
    }
    return out;
  });

  return { Xs, means, stds };
}

export function trainFrictionModel(deals: DealRollup[], categories: Categories): ModelResult {
  const nDeals = deals.length;
  if (nDeals < 50) {
    return { ok: false, message: "Not enough deals to train (need at least 50)." };
  }

  const y: number[] = deals.map((d) => (d.outcome === "Won" ? 1 : 0));
  const won = y.reduce((s, v) => s + v, 0 as number);
  const lost = nDeals - won;
  if (won === 0 || lost === 0) {
    return { ok: false, message: "Need both Won and Lost deals to train the model." };
  }

  const numericFeatures: Array<{
    key: keyof DealRollup;
    name: string;
  }> = [
    { key: "approval_count", name: "approval_count" },
    { key: "quote_revisions", name: "quote_revisions" },
    { key: "total_cycle_time_days", name: "total_cycle_time_days" },
    { key: "time_in_qualify", name: "time_in_qualify" },
    { key: "time_in_opportunity", name: "time_in_opportunity" },
    { key: "time_in_quote", name: "time_in_quote" },
    { key: "seller_tenure_years", name: "seller_tenure_years" }
  ];

  const segmentCats = categories.segments;
  const regionCats = categories.regions;

  const featureNames: string[] = [
    ...numericFeatures.map((f) => f.name),
    ...segmentCats.map((s) => `segment=${s}`),
    ...regionCats.map((r) => `region=${r}`)
  ];

  const numericCount = numericFeatures.length;
  const p = featureNames.length;

  const X: number[][] = deals.map((d) => {
    const row: number[] = new Array(p).fill(0);
    for (let j = 0; j < numericCount; j++) {
      const f = numericFeatures[j]!;
      row[j] = Number(d[f.key] ?? 0);
    }

    // One-hot segment
    const segOffset = numericCount;
    const segIdx = segmentCats.indexOf(d.segment);
    if (segIdx >= 0) row[segOffset + segIdx] = 1;

    // One-hot region
    const regOffset = segOffset + segmentCats.length;
    const regIdx = regionCats.indexOf(d.region);
    if (regIdx >= 0) row[regOffset + regIdx] = 1;

    return row;
  });

  const rng = mulberry32(42);
  const idx = Array.from({ length: nDeals }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }

  const nTrain = Math.floor(nDeals * 0.8);
  const trainIdx = idx.slice(0, nTrain);
  const testIdx = idx.slice(nTrain);

  const XTrain = trainIdx.map((i) => X[i]!);
  const yTrain = trainIdx.map((i) => y[i]!);
  const XTest = testIdx.map((i) => X[i]!);
  const yTest = testIdx.map((i) => y[i]!);

  const { Xs: XTrainS, means, stds } = standardize(XTrain, numericCount);
  const XTestS = XTest.map((row) => {
    const out = row.slice();
    for (let j = 0; j < numericCount; j++) {
      out[j] = ((out[j] ?? 0) - (means[j] ?? 0)) / (stds[j] ?? 1);
    }
    return out;
  });

  // Logistic regression via batch gradient descent with light L2 regularization.
  const weights = new Array(p + 1).fill(0); // w0 is intercept
  const lr = 0.15;
  const iters = 700;
  const lambda = 0.15;

  for (let iter = 0; iter < iters; iter++) {
    const grad = new Array(p + 1).fill(0);

    for (let i = 0; i < XTrainS.length; i++) {
      const row = XTrainS[i]!;
      let z = weights[0] ?? 0;
      for (let j = 0; j < p; j++) z += (weights[j + 1] ?? 0) * (row[j] ?? 0);
      const pHat = sigmoid(z);
      const err = pHat - (yTrain[i] ?? 0);

      grad[0] += err;
      for (let j = 0; j < p; j++) grad[j + 1] += err * (row[j] ?? 0);
    }

    // Update
    const n = XTrainS.length || 1;
    weights[0] -= (lr * (grad[0] / n));
    for (let j = 0; j < p; j++) {
      const w = weights[j + 1] ?? 0;
      const reg = lambda * w;
      weights[j + 1] = w - lr * (grad[j + 1] / n + reg);
    }
  }

  // Evaluate
  const probs: number[] = [];
  const preds: number[] = [];
  for (let i = 0; i < XTestS.length; i++) {
    const row = XTestS[i]!;
    let z = weights[0] ?? 0;
    for (let j = 0; j < p; j++) z += (weights[j + 1] ?? 0) * (row[j] ?? 0);
    const pHat = sigmoid(z);
    probs.push(pHat);
    preds.push(pHat >= 0.5 ? 1 : 0);
  }

  const correct = preds.reduce((s, v, i) => s + (v === (yTest[i] ?? 0) ? 1 : 0), 0);
  const accuracy = preds.length ? correct / preds.length : 0;
  const auc = aucScore(yTest, probs);

  const drivers: ModelDriver[] = featureNames
    .map((name, j) => {
      const coefficient = weights[j + 1] ?? 0;
      const importance = Math.abs(coefficient);
      return { feature: name, coefficient, importance };
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  return {
    ok: true,
    drivers,
    metrics: {
      nDeals,
      positiveRate: won / nDeals,
      nTrain: XTrainS.length,
      nTest: XTestS.length,
      accuracy,
      auc
    }
  };
}

