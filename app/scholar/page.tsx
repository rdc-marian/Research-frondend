"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/Table";
import { scholarNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  department: string;
  submittedAt?: string;
  status: string;
};

const defaultMetrics = [
  { label: "Total submissions", value: "0", icon: FileText },
  { label: "Pending approvals", value: "0", icon: Clock },
  { label: "Approved papers", value: "0", icon: CheckCircle },
];

const submissionColumns = [
  { key: "title", label: "Title" },
  { key: "department", label: "Department" },
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

export default function ScholarDashboard() {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [submissionsRes, pendingRes, approvedRes] = await Promise.all([
          apiGet<ApiListResponse<Submission>>("/submissions"),
          apiGet<ApiListResponse<Submission>>("/submissions?status=Pending"),
          apiGet<ApiListResponse<Submission>>("/submissions?status=Approved"),
        ]);

        if (!isMounted) return;

        setMetrics([
          {
            label: "Total submissions",
            value: `${submissionsRes.items.length}`,
            icon: FileText,
          },
          {
            label: "Pending approvals",
            value: `${pendingRes.items.length}`,
            icon: Clock,
          },
          {
            label: "Approved papers",
            value: `${approvedRes.items.length}`,
            icon: CheckCircle,
          },
        ]);

        setSubmissions(submissionsRes.items.slice(0, 4));
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
        department: submission.department,
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
      })),
    [submissions]
  );

  return (
    <PageLayout
      title="Scholar Dashboard"
      userName="Scholar User"
      roleLabel="Scholar"
      navItems={scholarNav}
      activeItem="Dashboard"
    >
      <DashboardCards items={metrics} />
      {error ? (
        <p className="text-sm text-red-600">Failed to load dashboard: {error}</p>
      ) : null}
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Recent submissions
            </h2>
            <p className="text-sm text-slate-500">
              Latest updates across your submitted papers.
            </p>
          </div>
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]">
            Last 30 days
          </span>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading submissions...</p>
          ) : error ? (
            <p className="text-sm text-red-600">
              Failed to load submissions: {error}
            </p>
          ) : (
            <DataTable columns={submissionColumns} rows={submissionRows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
