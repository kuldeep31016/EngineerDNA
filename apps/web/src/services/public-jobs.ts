import { publicJobSchema, type PublicJob } from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

export interface JobFilters {
  q?: string;
  type?: string;
  workMode?: string;
  skills?: string;
}

export async function listPublicJobs(filters: JobFilters = {}): Promise<PublicJob[]> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.workMode) params.set("workMode", filters.workMode);
  if (filters.skills) params.set("skills", filters.skills);
  const qs = params.toString();
  const data = await apiFetch<unknown[]>(`/jobs${qs ? `?${qs}` : ""}`);
  return (data ?? []).map((d) => publicJobSchema.parse(d));
}

export async function getPublicJob(id: string): Promise<PublicJob> {
  return publicJobSchema.parse(await apiFetch<unknown>(`/jobs/${id}`));
}
