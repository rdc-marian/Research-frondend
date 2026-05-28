"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/Table";
import { adminNav } from "@/data/roleNav";
import { apiGet, apiPostJson, type ApiListResponse } from "@/lib/api";

type Department = {
  _id: string;
  name: string;
  email?: string;
  coordinator?: { name?: string; email?: string };
};

type Coordinator = {
  _id: string;
  name: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-slate-700 shadow-sm";

const columns = [
  { key: "department", label: "Department" },
  { key: "coordinator", label: "Research Center Coordinator" },
  { key: "email", label: "Email" },
  { key: "action", label: "Action", align: "right" as const },
];

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    coordinatorId: "",
    totalScholars: "",
  });

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<ApiListResponse<Department>>("/departments");
      setDepartments(response.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [_, coordinatorsRes] = await Promise.all([
          loadDepartments(),
          apiGet<ApiListResponse<Coordinator>>("/users?role=coordinator"),
        ]);
        if (!isMounted) return;
        setCoordinators(coordinatorsRes.items);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load departments";
        setError(message);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadDepartments]);

  const handleFormChange = (
    field: keyof typeof formState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateDepartment = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const payload = {
        name: formState.name.trim(),
        email: formState.email.trim() || undefined,
        coordinatorId: formState.coordinatorId || undefined,
        totalScholars: formState.totalScholars
          ? Number(formState.totalScholars)
          : undefined,
      };

      await apiPostJson("/departments", payload);
      setSaveSuccess("Department created successfully.");
      setFormState({ name: "", email: "", coordinatorId: "", totalScholars: "" });
      await loadDepartments();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create department";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(
    () =>
      departments.map((department) => ({
        id: department._id,
        department: department.name,
        coordinator: department.coordinator?.name ?? "Unassigned",
        email:
          department.email || department.coordinator?.email || "N/A",
        action: (
          <button
            type="button"
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]"
          >
            View
          </button>
        ),
      })),
    [departments]
  );

  return (
    <PageLayout
      title="Departments"
      userName="Admin"
      roleLabel="Administrator"
      navItems={adminNav}
      activeItem="Departments"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Departments
            </h2>
            <p className="text-sm text-slate-500">
              Maintain department records and coordinator assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Close" : "Add Department"}
          </button>
        </div>
        {showForm ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Create department
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="dept-name">
                  Department name
                </label>
                <input
                  id="dept-name"
                  className={inputClass}
                  value={formState.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  placeholder="Department name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="dept-email">
                  Department email
                </label>
                <input
                  id="dept-email"
                  className={inputClass}
                  value={formState.email}
                  onChange={(event) => handleFormChange("email", event.target.value)}
                  placeholder="department@university.edu"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="dept-coordinator">
                  Coordinator
                </label>
                <select
                  id="dept-coordinator"
                  className={inputClass}
                  value={formState.coordinatorId}
                  onChange={(event) => handleFormChange("coordinatorId", event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {coordinators.map((coordinator) => (
                    <option key={coordinator._id} value={coordinator._id}>
                      {coordinator.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="dept-total">
                  Total scholars
                </label>
                <input
                  id="dept-total"
                  className={inputClass}
                  value={formState.totalScholars}
                  onChange={(event) => handleFormChange("totalScholars", event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateDepartment}
                disabled={saving}
                className="rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create department"}
              </button>
              {saveError ? (
                <span className="text-xs text-red-600">{saveError}</span>
              ) : null}
              {saveSuccess ? (
                <span className="text-xs text-emerald-600">{saveSuccess}</span>
              ) : null}
            </div>
          </div>
        ) : null}
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
