import {
  myApplicationSchema,
  recruiterApplicantSchema,
  studentApplicationStatsSchema,
  type ApplyRequest,
  type MyApplication,
  type RecruiterApplicant,
  type StudentApplicationStats,
  type ApplicationStatus,
} from "@engineerdna/shared";
import { apiFetch } from "@/lib/api";

export async function applyToJob(jobId: string, input: ApplyRequest): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/jobs/${jobId}/apply`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getMyApplications(): Promise<MyApplication[]> {
  const data = await apiFetch<unknown[]>("/student/applications");
  return (data ?? []).map((d) => myApplicationSchema.parse(d));
}

export async function getMyApplicationStats(): Promise<StudentApplicationStats> {
  return studentApplicationStatsSchema.parse(
    await apiFetch<unknown>("/student/applications/stats"),
  );
}

export async function getJobApplications(jobId: string): Promise<RecruiterApplicant[]> {
  const data = await apiFetch<unknown[]>(`/recruiter/jobs/${jobId}/applications`);
  return (data ?? []).map((d) => recruiterApplicantSchema.parse(d));
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<void> {
  await apiFetch(`/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
