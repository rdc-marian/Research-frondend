"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { coordinatorNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Submission = {
  _id: string;
  title: string;
  department: string;
  submittedAt?: string;
  status: string;
  scholar?: { name?: string };
};

const columns = [
  { key: "title", label: "Title" },
  { key: "scholar", label: "Scholar" },
  { key: "department", label: "Department" },
  { key: "submitted", label: "Submitted On" },
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

export default function CoordinatorApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [approvals, setApprovals] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<ApiListResponse<Submission>>(
          `/approvals?status=${encodeURIComponent(statusFilter)}`
        );
        if (!isMounted) return;
        setApprovals(response.items);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load approvals";
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const rows = useMemo(
    () =>
      approvals.map((submission) => ({
        id: submission._id,
        title: submission.title,
        scholar: submission.scholar?.name ?? "Unknown",
        department: submission.department,
        submitted: formatDate(submission.submittedAt),
        status: <StatusBadge status={submission.status} />,
        action: (
          <Link
            href="/coordinator/submissions/details"
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]"
          >
            Review
          </Link>
        ),
      })),
    [approvals]
  );

  return (
    <PageLayout
      title="Approvals (MCA)"
      userName="Dr. Priya Sharma"
      roleLabel="Coordinator"
      navItems={coordinatorNav}
      activeItem="Approvals"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Approvals - MCA
            </h2>
            <p className="text-sm text-slate-500">
              Approvals queue for MCA submissions.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] p-1">
            <button
              type="button"
              onClick={() => setStatusFilter("Pending")}
              className={`rounded-full px-4 py-1 text-xs font-semibold ${
                statusFilter === "Pending"
                  ? "bg-[color:var(--maroon-800)] text-white"
                  : "text-slate-500"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Approved")}
              className={`rounded-full px-4 py-1 text-xs font-semibold ${
                statusFilter === "Approved"
                  ? "bg-[color:var(--maroon-800)] text-white"
                  : "text-slate-500"
              }`}
            >
              Approved
            </button>
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
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
