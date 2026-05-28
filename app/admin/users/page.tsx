"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { DataTable } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";
import { adminNav } from "@/data/roleNav";
import { apiGet, apiPostJson, type ApiListResponse } from "@/lib/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status?: string;
};

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status" },
  { key: "action", label: "Action", align: "right" as const },
];

const roleLabels: Record<string, string> = {
  admin: "Admin",
  coordinator: "Research Center Coordinator",
  faculty: "Faculty / Guide",
  scholar: "Scholar",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-xs text-slate-700 shadow-sm";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    role: "scholar",
    department: "",
    status: "Active",
    phone: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet<ApiListResponse<User>>("/users");
      setUsers(response.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        await loadUsers();
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load users";
        setError(message);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [loadUsers]);

  const handleFormChange = (
    field: keyof typeof formState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const payload = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        role: formState.role,
        department: formState.department.trim() || undefined,
        status: formState.status || undefined,
        phone: formState.phone.trim() || undefined,
      };

      await apiPostJson("/users", payload);
      setSaveSuccess("User created successfully.");
      setFormState({
        name: "",
        email: "",
        role: "scholar",
        department: "",
        status: "Active",
        phone: "",
      });
      await loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create user";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(
    () =>
      users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: roleLabels[user.role] ?? user.role,
        department: user.department || "N/A",
        status: <StatusBadge status={user.status ?? "Active"} />,
        action: (
          <button
            type="button"
            className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold text-[color:var(--maroon-700)]"
          >
            View
          </button>
        ),
      })),
    [users]
  );

  return (
    <PageLayout
      title="Users"
      userName="Admin"
      roleLabel="Administrator"
      navItems={adminNav}
      activeItem="Users"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--border)] pb-4">
          <div>
            <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
              Users
            </h2>
            <p className="text-sm text-slate-500">
              Manage scholars, faculty, coordinators, and admin accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Close" : "Add User"}
          </button>
        </div>
        {showForm ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Create user
            </p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-name">
                  Name
                </label>
                <input
                  id="user-name"
                  className={inputClass}
                  value={formState.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-email">
                  Email
                </label>
                <input
                  id="user-email"
                  className={inputClass}
                  value={formState.email}
                  onChange={(event) => handleFormChange("email", event.target.value)}
                  placeholder="name@university.edu"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-role">
                  Role
                </label>
                <select
                  id="user-role"
                  className={inputClass}
                  value={formState.role}
                  onChange={(event) => handleFormChange("role", event.target.value)}
                >
                  <option value="scholar">Scholar</option>
                  <option value="faculty">Faculty</option>
                  <option value="coordinator">Research Center Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-department">
                  Department
                </label>
                <input
                  id="user-department"
                  className={inputClass}
                  value={formState.department}
                  onChange={(event) => handleFormChange("department", event.target.value)}
                  placeholder="Department name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-status">
                  Status
                </label>
                <select
                  id="user-status"
                  className={inputClass}
                  value={formState.status}
                  onChange={(event) => handleFormChange("status", event.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-phone">
                  Phone
                </label>
                <input
                  id="user-phone"
                  className={inputClass}
                  value={formState.phone}
                  onChange={(event) => handleFormChange("phone", event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={saving}
                className="rounded-full bg-[color:var(--maroon-800)] px-4 py-2 text-xs font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create user"}
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
            <span>Search users...</span>
          </div>
          <select className="rounded-full border border-[color:var(--border)] bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            <option>All Roles</option>
            <option>Scholar</option>
            <option>Faculty</option>
            <option>Research Center Coordinator</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading users...</p>
          ) : error ? (
            <p className="text-sm text-red-600">Failed to load users: {error}</p>
          ) : (
            <DataTable columns={columns} rows={rows} />
          )}
        </div>
      </section>
    </PageLayout>
  );
}
