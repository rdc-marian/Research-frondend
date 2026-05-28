"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ClipboardCheck,
  FileText,
  XCircle,
} from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { PageLayout } from "@/components/PageLayout";
import { coordinatorNav } from "@/data/roleNav";
import { apiGet } from "@/lib/api";

type ReportSummary = {
  total: number;
  byStatus: {
    Pending: number;
    Approved: number;
    Rejected: number;
    "In Review": number;
  };
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-slate-600 shadow-sm";

export default function CoordinatorReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (filters?: { from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (filters?.from) searchParams.set("from", filters.from);
    if (filters?.to) searchParams.set("to", filters.to);

    const suffix = searchParams.toString();
    const path = suffix ? `/reports/summary?${suffix}` : "/reports/summary";

    return apiGet<ReportSummary>(path);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await loadSummary();
        if (!isMounted) return;
        setSummary(response);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadSummary]);

  const metrics = useMemo(() => {
    const total = summary?.total ?? 0;
    return [
      { label: "Total submissions", value: `${total}`, icon: FileText },
      {
        label: "Pending",
        value: `${summary?.byStatus?.Pending ?? 0}`,
        icon: ClipboardCheck,
      },
      {
        label: "Approved",
        value: `${summary?.byStatus?.Approved ?? 0}`,
        icon: CheckCircle,
      },
      {
        label: "Rejected",
        value: `${summary?.byStatus?.Rejected ?? 0}`,
        icon: XCircle,
      },
    ];
  }, [summary]);

  const statusSummary = useMemo(
    () => [
      { label: "Approved", value: summary?.byStatus?.Approved ?? 0 },
      { label: "Pending", value: summary?.byStatus?.Pending ?? 0 },
      { label: "Rejected", value: summary?.byStatus?.Rejected ?? 0 },
    ],
    [summary]
  );

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSummary = await loadSummary({
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setSummary(nextSummary);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load report";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Reports (MCA)"
      userName="Dr. Priya Sharma"
      roleLabel="Coordinator"
      navItems={coordinatorNav}
      activeItem="Reports"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
          Reports - MCA
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Submission overview for the MCA department.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              From date
            </label>
            <input
              className={inputClass}
              placeholder="dd/mm/yyyy"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              To date
            </label>
            <input
              className={inputClass}
              placeholder="dd/mm/yyyy"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Report type
            </label>
            <select className={inputClass} defaultValue="Submission Summary">
              <option>Submission Summary</option>
              <option>Approval Timeline</option>
              <option>Scholar Breakdown</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white"
              onClick={handleGenerate}
            >
              Generate
            </button>
          </div>
        </div>
        <div className="mt-6">
          <DashboardCards items={metrics} />
          {error ? (
            <p className="mt-3 text-sm text-red-600">Failed to load report: {error}</p>
          ) : null}
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Loading report data...</p>
          ) : null}
        </div>
        <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)] p-5">
          <h3 className="text-sm font-semibold text-[color:var(--maroon-900)]">
            Submission status
          </h3>
          <div className="mt-4 space-y-3">
            {statusSummary.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
            {!loading && !error && statusSummary.length === 0 ? (
              <p className="text-xs text-slate-500">No status data yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
