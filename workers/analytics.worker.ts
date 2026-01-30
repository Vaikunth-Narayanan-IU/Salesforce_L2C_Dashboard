import { trainFrictionModel, type ModelResult } from "../lib/analytics/model";
import type { DealRollup } from "../lib/analytics/rollups";

type ComputeMessage = {
  type: "trainModel";
  deals: DealRollup[];
  categories: { segments: string[]; regions: string[] };
};

type WorkerResponse =
  | {
      type: "modelResult";
      result: ModelResult;
    }
  | {
      type: "error";
      message: string;
    };

const ctx: any = self as any;

ctx.onmessage = (e: MessageEvent<ComputeMessage>) => {
  try {
    const msg = e.data;
    if (msg.type !== "trainModel") return;
    const result = trainFrictionModel(msg.deals, msg.categories);
    const res: WorkerResponse = { type: "modelResult", result };
    ctx.postMessage(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Worker error";
    const res: WorkerResponse = { type: "error", message };
    ctx.postMessage(res);
  }
};

