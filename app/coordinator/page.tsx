"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  NotebookText,
} from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/Table";
import { coordinatorNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  status: string;
  submittedAt?: string;
  scholar?: { name?: string };
};

type Department = {
  _id: string;
  name: string;
  coordinator?: { name?: string };
  totalScholars?: number;
};

const defaultMetrics = [
  { label: "MCA submissions", value: "0", icon: FileText },
  { label: "Pending approvals", value: "0", icon: ClipboardCheck },
  { label: "Approved papers", value: "0", icon: LayoutDashboard },
  { label: "Department overview", value: "N/A", icon: NotebookText },
];

const submissionColumns = [
  { key: "title", label: "Title" },
  { key: "scholar", label: "Scholar" },
  { key: "submitted", label: "Submitted On" },
  { key: "status", label: "Status", align: "right" as const },
];

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CoordinatorDashboard() {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [primaryDepartment, setPrimaryDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [submissionsRes, approvalsRes, approvedRes, departmentsRes] =
          await Promise.all([
            apiGet<ApiListResponse<Submission>>("/submissions"),
            apiGet<ApiListResponse<Submission>>("/approvals"),
            apiGet<ApiListResponse<Submission>>("/submissions?status=Approved"),
            apiGet<ApiListResponse<Department>>("/departments"),
          ]);

        if (!isMounted) return;

        const firstDepartment = departmentsRes.items[0] ?? null;
        setPrimaryDepartment(firstDepartment);
        setSubmissions(submissionsRes.items.slice(0, 4));

        setMetrics([
          {
            label: "MCA submissions",
            value: `${submissionsRes.items.length}`,
            icon: FileText,
          },
          {
            label: "Pending approvals",
            value: `${approvalsRes.items.length}`,
            icon: ClipboardCheck,
          },
          {
            label: "Approved papers",
            value: `${approvedRes.items.length}`,
            icon: LayoutDashboard,
          },
          {
            label: "Department overview",
            value: firstDepartment?.name ?? "N/A",
            icon: NotebookText,
          },
        ]);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const submissionRows = useMemo(
    () =>
      submissions.map((submission) => ({
        id: submission._id,
        title: submission.title,
        scholar: submission.scholar?.name ?? "Unknown",
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
      })),
    [submissions]
  );

  return (
    <PageLayout
      title="Research Centre Coordinator"
      userName="Dr. Priya Sharma"
      roleLabel="Coordinator"
      navItems={coordinatorNav}
      activeItem="Dashboard"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--maroon-700)]">
          Department
        </p>
        <h2 className="mt-2 font-display text-2xl text-[color:var(--maroon-900)]">
          {primaryDepartment?.name ?? "MCA - Master of Computer Applications"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>
            Coordinator: {primaryDepartment?.coordinator?.name ?? "Dr. Priya Sharma"}
          </span>
          <span>Academic Year: 2024-2025</span>
          <span>
            Total Scholars: {primaryDepartment?.totalScholars ?? 0}
          </span>
        </div>
      </section>
      <DashboardCards items={metrics} />
      {error ? (
        <p className="text-sm text-red-600">Failed to load dashboard: {error}</p>
      ) : null}
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              MCA submissions
            </h2>
            <p className="text-sm text-slate-500">
              Recent submissions across the MCA department.
            </p>
          </div>
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]">
            Updated this week
          </span>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading submissions...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Failed to load submissions: {error}</p>
          ) : (
            <DataTable columns={submissionColumns} rows={submissionRows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
