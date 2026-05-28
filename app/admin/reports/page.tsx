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
import { adminNav } from "@/data/roleNav";
import { apiGet } from "@/lib/api";

type ReportSummary = {
  total: number;
  byStatus: {
    Pending: number;
    Approved: number;
    Rejected: number;
    "In Review": number;
  };
  byDepartment: Array<{ department: string; total: number }>;
};

type Department = {
  _id: string;
  name: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-slate-600 shadow-sm";

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(
    async (filters?: { from?: string; to?: string; department?: string }) => {
      const searchParams = new URLSearchParams();
      if (filters?.from) searchParams.set("from", filters.from);
      if (filters?.to) searchParams.set("to", filters.to);
      if (filters?.department) searchParams.set("department", filters.department);

      const suffix = searchParams.toString();
      const path = suffix ? `/reports/summary?${suffix}` : "/reports/summary";

      const response = await apiGet<ReportSummary>(path);
      return response;
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryResponse, departmentsResponse] = await Promise.all([
          loadSummary(),
          apiGet<{ items: Department[] }>("/departments"),
        ]);

        if (!isMounted) return;
        setSummary(summaryResponse);
        setDepartments(departmentsResponse.items);
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

  const departmentSummary = useMemo(() => {
    const total = summary?.total ?? 0;
    return (summary?.byDepartment ?? []).map((item) => ({
      name: item.department,
      value: item.total,
      share: total > 0 ? `${Math.round((item.total / total) * 100)}%` : "0%",
    }));
  }, [summary]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSummary = await loadSummary({
        from: fromDate || undefined,
        to: toDate || undefined,
        department: department || undefined,
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
      title="Reports"
      userName="Admin"
      roleLabel="Administrator"
      navItems={adminNav}
      activeItem="Reports"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
          Reports
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Institution-wide submission analytics and summaries.
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
              Department
            </label>
            <select
              className={inputClass}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((item) => (
                <option key={item._id} value={item.name}>
                  {item.name}
                </option>
              ))}
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
            Submissions by department
          </h3>
          <div className="mt-4 space-y-3">
            {departmentSummary.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-white bg-white px-3 py-2 text-xs text-slate-600"
              >
                <div>
                  <p className="font-semibold text-slate-700">{item.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {item.value} submissions
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--border)] px-2 py-1 text-[10px] font-semibold text-[color:var(--maroon-700)]">
                  {item.share}
                </span>
              </div>
            ))}
            {!loading && !error && departmentSummary.length === 0 ? (
              <p className="text-xs text-slate-500">No department data yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
