import {
  myApplicationSchema,
  recruiterApplicantSchema,
  studentApplicationStatsSchema,
  applicationLifecycleSchema,
  type ApplyRequest,
  type MyApplication,
  type RecruiterApplicant,
  type StudentApplicationStats,
  type ApplicationStatus,
  type ApplicationLifecycle,
  type ScheduleInterviewInput,
  type SendOfferInput,
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

/* ---------------- Hiring lifecycle ---------------- */

export async function getApplicationTimeline(applicationId: string): Promise<ApplicationLifecycle> {
  return applicationLifecycleSchema.parse(await apiFetch<unknown>(`/applications/${applicationId}/timeline`));
}

export async function scheduleInterview(
  applicationId: string,
  input: ScheduleInterviewInput,
): Promise<ApplicationLifecycle> {
  return applicationLifecycleSchema.parse(
    await apiFetch<unknown>(`/applications/${applicationId}/interview`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function respondInterview(
  applicationId: string,
  action: "accept" | "decline",
): Promise<ApplicationLifecycle> {
  return applicationLifecycleSchema.parse(
    await apiFetch<unknown>(`/applications/${applicationId}/interview/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  );
}

export async function sendOffer(
  applicationId: string,
  input: SendOfferInput,
): Promise<ApplicationLifecycle> {
  return applicationLifecycleSchema.parse(
    await apiFetch<unknown>(`/applications/${applicationId}/offer`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function respondOffer(
  applicationId: string,
  action: "accept" | "reject",
): Promise<ApplicationLifecycle> {
  return applicationLifecycleSchema.parse(
    await apiFetch<unknown>(`/applications/${applicationId}/offer/respond`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  );
}
