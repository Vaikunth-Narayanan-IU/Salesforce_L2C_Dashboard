export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h1 className="text-lg font-semibold">About</h1>
        <p className="mt-2 text-sm text-slate-700">
          L2O Funnel Friction Explorer is a browser-based analytics tool for
          stage-level Lead-to-Cash (L2C) funnel datasets. It runs entirely in
          your browser and uses only the CSV you upload (or the bundled sample
          dataset).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold">Data schema</h2>
        <p className="mt-2 text-sm text-slate-700">
          Input CSV is stage-level rows (one row per deal per stage). Required
          columns:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 pr-4 font-medium text-slate-800">Column</th>
                <th className="py-2 pr-4 font-medium text-slate-800">Type</th>
                <th className="py-2 font-medium text-slate-800">Notes</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                ["deal_id", "string/number", "Deal identifier"],
                ["stage", "string", "One of: Lead, Qualify, Opportunity, Quote, Close"],
                ["stage_order", "int", "1..5 aligned to stage order"],
                ["stage_duration_days", "float", "Duration spent in the stage"],
                ["rep", "string", "Seller identifier/name"],
                ["region", "string", "Region label"],
                ["segment", "string", "Segment label"],
                ["seller_tenure_years", "float", "Seller tenure in years"],
                ["seller_tenure_bucket", "string", "One of: 0-1, 1-3, 3-6, 6+"],
                ["approval_count", "int", "Approvals count (stage-level)"],
                ["quote_revisions", "int", "Quote revision count (stage-level)"],
                ["outcome", "string", "Won or Lost"]
              ].map(([col, type, notes]) => (
                <tr key={col} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-mono text-xs">{col}</td>
                  <td className="py-2 pr-4">{type}</td>
                  <td className="py-2">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-base font-semibold text-amber-900">Disclaimers</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
          <li>
            The bundled sample dataset is <span className="font-semibold">synthetic</span>{" "}
            and provided for demonstration only.
          </li>
          <li>
            The “Friction Drivers” model is{" "}
            <span className="font-semibold">explanatory, not predictive</span>. It
            is intended to highlight associations, not to forecast outcomes.
          </li>
          <li>
            All processing happens locally in your browser; no data is uploaded
            to a server.
          </li>
        </ul>
      </div>
    </div>
  );
}

