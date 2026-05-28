"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { scholarNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  department: string;
  submittedAt?: string;
  status: string;
};

const columns = [
  { key: "title", label: "Title" },
  { key: "department", label: "Department" },
  { key: "submitted", label: "Date Submitted" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action", align: "right" as const },
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

export default function ScholarSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<ApiListResponse<Submission>>("/submissions");
        if (!isMounted) return;
        setSubmissions(response.items);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load submissions";
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

  const rows = useMemo(
    () =>
      submissions.map((submission) => ({
        id: submission._id,
        title: submission.title,
        department: submission.department,
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
        action: (
          <Link
            href="/scholar/submissions/details"
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]"
          >
            View
          </Link>
        ),
      })),
    [submissions]
  );

  return (
    <PageLayout
      title="My Submissions"
      userName="Scholar User"
      roleLabel="Scholar"
      navItems={scholarNav}
      activeItem="My Submissions"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              My submissions
            </h2>
            <p className="text-sm text-slate-500">
              Track the status of your submitted research papers.
            </p>
          </div>
          <Link
            href="/scholar/submissions/new"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Submission
          </Link>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading submissions...</p>
          ) : error ? (
            <p className="text-sm text-red-600">
              Failed to load submissions: {error}
            </p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
