"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  FileText,
  NotebookText,
  Users,
} from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/Table";
import { facultyNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  department: string;
  submittedAt?: string;
  status: string;
  scholar?: { name?: string };
};

type User = {
  _id: string;
};

const defaultMetrics = [
  { label: "Total scholars", value: "0", icon: Users },
  { label: "Pending reviews", value: "0", icon: ClipboardCheck },
  { label: "Recent submissions", value: "0", icon: FileText },
  { label: "Approval requests", value: "0", icon: NotebookText },
];

const submissionColumns = [
  { key: "title", label: "Title" },
  { key: "scholar", label: "Scholar" },
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

const approvalColumns = [
  { key: "title", label: "Title" },
  { key: "scholar", label: "Scholar" },
  { key: "submitted", label: "Submitted On" },
  { key: "status", label: "Status", align: "right" as const },
];

export default function FacultyDashboard() {
  const [metrics, setMetrics] = useState(defaultMetrics);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [approvals, setApprovals] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [scholarsRes, submissionsRes, pendingRes, approvalsRes] =
          await Promise.all([
            apiGet<ApiListResponse<User>>("/users?role=scholar"),
            apiGet<ApiListResponse<Submission>>("/submissions"),
            apiGet<ApiListResponse<Submission>>("/submissions?status=Pending"),
            apiGet<ApiListResponse<Submission>>("/approvals?status=Pending"),
          ]);

        if (!isMounted) return;

        setMetrics([
          {
            label: "Total scholars",
            value: `${scholarsRes.items.length}`,
            icon: Users,
          },
          {
            label: "Pending reviews",
            value: `${pendingRes.items.length}`,
            icon: ClipboardCheck,
          },
          {
            label: "Recent submissions",
            value: `${submissionsRes.items.length}`,
            icon: FileText,
          },
          {
            label: "Approval requests",
            value: `${approvalsRes.items.length}`,
            icon: NotebookText,
          },
        ]);

        setSubmissions(submissionsRes.items.slice(0, 4));
        setApprovals(approvalsRes.items.slice(0, 4));
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
        department: submission.department,
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
      })),
    [submissions]
  );

  const approvalRows = useMemo(
    () =>
      approvals.map((submission) => ({
        id: submission._id,
        title: submission.title,
        scholar: submission.scholar?.name ?? "Unknown",
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
      })),
    [approvals]
  );

  return (
    <PageLayout
      title="Faculty Dashboard"
      userName="Dr. Emily Davis"
      roleLabel="Faculty Member"
      navItems={facultyNav}
      activeItem="Dashboard"
    >
      <DashboardCards items={metrics} />
      {error ? (
        <p className="text-sm text-red-600">Failed to load dashboard: {error}</p>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
            <div>
              <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
                Recent submissions
              </h2>
              <p className="text-sm text-slate-500">
                Latest scholar submissions awaiting review.
              </p>
            </div>
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
        </div>
        <div className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
            <div>
              <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
                Approval requests
              </h2>
              <p className="text-sm text-slate-500">
                Submissions that need a decision this week.
              </p>
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading approvals...</p>
            ) : error ? (
              <p className="text-sm text-red-600">
                Failed to load approvals: {error}
              </p>
            ) : (
              <DataTable columns={approvalColumns} rows={approvalRows} />
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
