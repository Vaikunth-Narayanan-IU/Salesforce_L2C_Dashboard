"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";

import type { StageRow } from "@/lib/schema";

export function DataTable(props: { rows: StageRow[] }) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<StageRow>[]>(
    () => [
      { header: "Deal", accessorKey: "deal_id" },
      { header: "Stage", accessorKey: "stage" },
      { header: "Order", accessorKey: "stage_order" },
      {
        header: "Duration (days)",
        accessorKey: "stage_duration_days",
        cell: (info) => Number(info.getValue<number>()).toFixed(2)
      },
      { header: "Rep", accessorKey: "rep" },
      { header: "Region", accessorKey: "region" },
      { header: "Segment", accessorKey: "segment" },
      { header: "Tenure", accessorKey: "seller_tenure_bucket" },
      { header: "Approvals", accessorKey: "approval_count" },
      { header: "Revisions", accessorKey: "quote_revisions" },
      { header: "Outcome", accessorKey: "outcome" }
    ],
    []
  );

  const table = useReactTable({
    data: props.rows,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Data table</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paginated stage-level rows (click headers to sort).
          </p>
        </div>
        <div className="text-sm text-slate-600">Rows: {props.rows.length}</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-slate-200 text-left">
                {hg.headers.map((h) => (
                  <th key={h.id} className="whitespace-nowrap py-2 pr-4 font-medium text-slate-800">
                    {h.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-2 rounded-md px-2 py-1 transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                        title="Sort"
                      >
                        <span>{flexRender(h.column.columnDef.header, h.getContext())}</span>
                        <span className="text-xs text-slate-400">
                          {h.column.getIsSorted() === "asc"
                            ? "▲"
                            : h.column.getIsSorted() === "desc"
                              ? "▼"
                              : ""}
                        </span>
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap py-2 pr-4 text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-600" colSpan={columns.length}>
                  No rows for current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

