"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { scholarNav } from "@/data/roleNav";
import { apiGet, apiPostForm, type ApiListResponse } from "@/lib/api";

type Department = {
  _id: string;
  name: string;
};

type Scholar = {
  _id: string;
  name: string;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--maroon-600)]";

export default function ScholarNewSubmissionPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    department: "",
    scholarId: "",
    abstract: "",
    file: null as File | null,
  });

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [departmentsRes, scholarsRes] = await Promise.all([
          apiGet<ApiListResponse<Department>>("/departments"),
          apiGet<ApiListResponse<Scholar>>("/users?role=scholar"),
        ]);
        if (!isMounted) return;
        setDepartments(departmentsRes.items);
        setScholars(scholarsRes.items);
      } catch (err) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Failed to load form data";
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

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (
        !formState.title.trim() ||
        !formState.abstract.trim() ||
        !formState.department ||
        !formState.scholarId
      ) {
        setError("Title, abstract, department, and scholar are required.");
        setSaving(false);
        return;
      }

      const payload = new FormData();
      payload.append("title", formState.title.trim());
      payload.append("abstract", formState.abstract.trim());
      payload.append("department", formState.department);
      payload.append("scholarId", formState.scholarId);
      if (formState.file) {
        payload.append("file", formState.file);
      }

      await apiPostForm("/submissions", payload);
      setSuccess("Submission created successfully.");
      setFormState({
        title: "",
        department: "",
        scholarId: "",
        abstract: "",
        file: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit research";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      title="New Submission"
      userName="Scholar User"
      roleLabel="Scholar"
      navItems={scholarNav}
      activeItem="My Submissions"
    >
      <section className="rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_14px_28px_rgba(91,11,22,0.08)]">
        <Link
          href="/scholar/submissions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--maroon-700)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Submissions
        </Link>
        <h2 className="font-display text-lg text-[color:var(--maroon-900)]">
          New submission
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Submit your research paper for review.
        </p>
        <form className="mt-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              placeholder="Enter research title"
              className={inputClass}
              value={formState.title}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="department">
                Department
              </label>
              <select
                id="department"
                className={inputClass}
                value={formState.department}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    department: event.target.value,
                  }))
                }
              >
                <option value="" disabled>
                  Select department
                </option>
                {departments.map((item) => (
                  <option key={item._id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="file">
                File upload (PDF)
              </label>
              <input
                id="file"
                type="file"
                className={inputClass}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="scholar">
              Scholar
            </label>
            <select
              id="scholar"
              className={inputClass}
              value={formState.scholarId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  scholarId: event.target.value,
                }))
              }
            >
              <option value="" disabled>
                Select scholar
              </option>
              {scholars.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="abstract">
              Abstract
            </label>
            <textarea
              id="abstract"
              placeholder="Enter abstract"
              className={`${inputClass} min-h-[120px] resize-none`}
              value={formState.abstract}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, abstract: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || loading}
              className="rounded-full bg-[color:var(--maroon-800)] px-6 py-2 text-xs font-semibold text-white shadow-sm"
            >
              {saving ? "Submitting..." : "Submit"}
            </button>
            <Link
              href="/scholar/submissions"
              className="rounded-full border border-[color:var(--border)] px-6 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </Link>
          </div>
          {loading ? (
            <p className="text-xs text-slate-500">Loading form data...</p>
          ) : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {success ? <p className="text-xs text-emerald-600">{success}</p> : null}
        </form>
      </section>
    </PageLayout>
  );
}
