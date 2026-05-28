"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";
import { DashboardCards } from "@/components/DashboardCards";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { DataTable } from "@/components/Table";
import { adminNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  department: string;
  status: string;
  submittedAt?: string;
  scholar?: { name?: string };
};

type User = {
  _id: string;
};

const defaultMetrics = [
  { label: "Total users", value: "0", icon: Users },
  { label: "Total submissions", value: "0", icon: FileText },
  { label: "Pending approvals", value: "0", icon: ClipboardCheck },
  { label: "Approved papers", value: "0", icon: CheckCircle },
];

const submissionColumns = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "department", label: "Department" },
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

export default function AdminDashboard() {
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

        const [usersRes, submissionsRes, approvalsRes, approvedRes] =
          await Promise.all([
            apiGet<ApiListResponse<User>>("/users"),
            apiGet<ApiListResponse<Submission>>("/submissions"),
            apiGet<ApiListResponse<Submission>>("/approvals"),
            apiGet<ApiListResponse<Submission>>("/submissions?status=Approved"),
          ]);

        if (!isMounted) return;

        setMetrics([
          {
            label: "Total users",
            value: `${usersRes.items.length}`,
            icon: Users,
          },
          {
            label: "Total submissions",
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
      submissions.map((item) => ({
        id: item._id,
        title: item.title,
        author: item.scholar?.name ?? "Unknown",
        department: item.department,
        status: <StatusBadge status={item.status} />,
        submitted: formatDate(item.submittedAt),
      })),
    [submissions]
  );

  return (
    <PageLayout
      title="Admin Dashboard"
      userName="Admin"
      roleLabel="Administrator"
      navItems={adminNav}
      activeItem="Dashboard"
    >
      <DashboardCards items={metrics} />
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Recent submissions
            </h2>
            <p className="text-sm text-slate-500">
              System-wide submissions requiring oversight.
            </p>
          </div>
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]">
            This month
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
