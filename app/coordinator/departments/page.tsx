"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/Table";
import { coordinatorNav } from "@/data/roleNav";
import { apiGet, type ApiListResponse } from "@/lib/api";

type Department = {
  _id: string;
  name: string;
  email?: string;
  totalScholars?: number;
  coordinator?: { name?: string; email?: string };
};

const columns = [
  { key: "department", label: "Department" },
  { key: "head", label: "Head / Coordinator" },
  { key: "email", label: "Email" },
  { key: "total", label: "Total Scholars" },
  { key: "action", label: "Action", align: "right" as const },
];

export default function CoordinatorDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiGet<ApiListResponse<Department>>("/departments");
        if (!isMounted) return;
        setDepartments(response.items);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load departments";
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
      departments.map((department) => ({
        id: department._id,
        department: department.name,
        head: department.coordinator?.name ?? "Unassigned",
        email:
          department.email || department.coordinator?.email || "N/A",
        total: `${department.totalScholars ?? 0}`,
        action: (
          <Link
            href="/coordinator/departments/overview"
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]"
          >
            View
          </Link>
        ),
      })),
    [departments]
  );

  return (
    <PageLayout
      title="Departments"
      userName="Dr. Priya Sharma"
      roleLabel="Coordinator"
      navItems={coordinatorNav}
      activeItem="Departments"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Departments
            </h2>
            <p className="text-sm text-slate-500">
              Monitor departments under the research centre.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs text-slate-500">
            <Search className="h-4 w-4" />
            <span>Search departments...</span>
          </div>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading departments...</p>
          ) : error ? (
            <p className="text-sm text-red-600">
              Failed to load departments: {error}
            </p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
