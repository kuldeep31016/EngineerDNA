import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import { proctoringReportSchema } from "@engineerdna/shared";
import type {
  ApplyRequest,
  DeveloperEvidenceItem,
  MatchedRepo,
  MyApplication,
  RecruiterApplicant,
  StudentApplicationStats,
  UpdateApplicationStatusInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { EvidenceService } from "../evidence/evidence.service";
import { MailService } from "../mail/mail.service";
import { computeDnaScores } from "../dna/dna-scorer";

/** Normalize a tech/skill string for tolerant matching (React.js → react). */
function normTech(s: string): string {
  return s
    .toLowerCase()
    .replace(/\.js$/i, "")
    .replace(/[^a-z0-9+#]/g, "");
}

/** Does a normalized evidence tech match a normalized required skill? */
function techMatches(reqNorm: string, techNorm: string): boolean {
  if (!reqNorm || !techNorm) return false;
  return techNorm === reqNorm || (reqNorm.length >= 3 && (techNorm.includes(reqNorm) || reqNorm.includes(techNorm)));
}

const STATUS_MESSAGES: Record<string, string> = {
  VIEWED: "Your application has been viewed by the recruiter.",
  SHORTLISTED: "Congratulations! You have been shortlisted.",
  INTERVIEW: "You have been invited for an interview.",
  REJECTED: "Unfortunately, your application was not selected.",
  SELECTED: "Congratulations! You have been selected!",
};

/** Human-friendly stage labels used in status-update emails. */
const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  VIEWED: "Viewed",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  REJECTED: "Not selected",
  SELECTED: "Selected",
};

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly evidence: EvidenceService,
    private readonly mail: MailService,
  ) {}

  /** Student applies to a job. */
  async apply(student: User, jobId: string, input: ApplyRequest): Promise<{ id: string }> {
    if (student.role !== "STUDENT" && student.role !== "ADMIN") {
      throw new ForbiddenException("Only students can apply for jobs");
    }

    const job = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: { company: true },
    });
    if (!job || job.status !== "OPEN") throw new NotFoundException("Job not found or closed");

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_studentId: { jobId, studentId: student.id } },
    });
    if (existing) throw new ConflictException("Already applied to this job");

    const app = await this.prisma.jobApplication.create({
      data: {
        jobId,
        studentId: student.id,
        resumeText: input.resumeText,
        coverLetter: input.coverLetter ?? null,
      },
    });

    await this.notifications.create(
      student.id,
      "Application submitted",
      `Your application for ${job.title}${job.company ? ` at ${job.company.name}` : ""} has been received.`,
    );

    // Let the recruiter know a new candidate has applied.
    await this.notifications.create(
      job.recruiterId,
      "New applicant",
      `${student.name ?? "A candidate"} applied to ${job.title}.`,
    );

    // Confirmation email (best-effort — never blocks or breaks the response).
    void this.mail.sendApplicationReceived(
      student.email,
      student.name,
      job.title,
      job.company?.name ?? null,
    );

    return { id: app.id };
  }

  /** Student's own applications, newest first. */
  async myApplications(student: User): Promise<MyApplication[]> {
    const rows = await this.prisma.jobApplication.findMany({
      where: { studentId: student.id },
      include: {
        job: {
          include: { company: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      coverLetter: r.coverLetter ?? null,
      appliedAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      job: {
        id: r.job.id,
        title: r.job.title,
        type: r.job.type,
        location: r.job.location ?? null,
        company: r.job.company
          ? {
              id: r.job.company.id,
              name: r.job.company.name,
              logo: r.job.company.logo ?? null,
              website: r.job.company.website ?? null,
              description: r.job.company.description ?? null,
            }
          : null,
      },
    }));
  }

  /** Student dashboard stats. */
  async myStats(student: User): Promise<StudentApplicationStats> {
    const apps = await this.prisma.jobApplication.findMany({
      where: { studentId: student.id },
      select: { status: true },
    });
    return {
      total: apps.length,
      shortlisted: apps.filter((a) => a.status === "SHORTLISTED").length,
      interviews: apps.filter((a) => a.status === "INTERVIEW").length,
      offers: apps.filter((a) => a.status === "SELECTED").length,
      rejected: apps.filter((a) => a.status === "REJECTED").length,
    };
  }

  /** Recruiter — list applicants for their job, each with the evidence + resume
   *  match report that explains the ranking. Sorted best-match first. */
  async listForJob(recruiter: User, jobId: string): Promise<RecruiterApplicant[]> {
    const job = await this.prisma.jobPost.findUnique({ where: { id: jobId } });
    if (!job || job.recruiterId !== recruiter.id) throw new NotFoundException("Job not found");

    const jobSkills = ((job.skills as unknown as string[]) ?? []).map((s) => s.trim()).filter(Boolean);

    const apps = await this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        student: {
          include: {
            profile: true,
            portfolio: { select: { slug: true, published: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const applicants = await Promise.all(
      apps.map((app) => this.buildApplicant(app, jobSkills)),
    );

    // Best-match first — surfaces the strongest candidates to the recruiter.
    return applicants.sort(
      (a, b) => b.matchScore - a.matchScore || b.dnaScore - a.dnaScore || b.verifiedSkillCount - a.verifiedSkillCount,
    );
  }

  private async buildApplicant(
    app: {
      id: string;
      status: RecruiterApplicant["status"];
      createdAt: Date;
      coverLetter: string | null;
      resumeText: string | null;
      studentId: string;
      student: {
        name: string | null;
        email: string;
        profileImage: string | null;
        profile: { headline: string | null; location: string | null; githubUsername: string | null } | null;
        portfolio: { slug: string | null; published: boolean } | null;
      };
    },
    jobSkills: string[],
  ): Promise<RecruiterApplicant> {
    const items = await this.evidence.getPublicEvidenceItems(app.studentId);
    const { overall } = computeDnaScores(items);
    const used = items.filter((i) => i.strength === "USED");

    const topSkills = [...used]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((i) => i.technology);

    const verifiedSkills = await this.prisma.skill.count({
      where: { profile: { userId: app.studentId }, status: "VERIFIED" },
    });

    const report = await this.matchReport(app.studentId, jobSkills, used, app.resumeText);

    // Best evaluated mock interview (informational signal + its integrity).
    const bestInterview = await this.prisma.interview.findFirst({
      where: { userId: app.studentId, status: "EVALUATED", overallScore: { not: null } },
      orderBy: { overallScore: "desc" },
      select: { overallScore: true, proctoring: true },
    });

    const profile = app.student.profile;
    const portfolioSlug = app.student.portfolio?.published ? (app.student.portfolio.slug ?? null) : null;

    return {
      applicationId: app.id,
      status: app.status,
      appliedAt: app.createdAt.toISOString(),
      coverLetter: app.coverLetter ?? null,
      hasResume: Boolean(app.resumeText),
      studentId: app.studentId,
      name: app.student.name ?? null,
      email: app.student.email,
      profileImage: app.student.profileImage ?? null,
      headline: profile?.headline ?? null,
      location: profile?.location ?? null,
      dnaScore: Math.round(overall),
      verifiedSkillCount: verifiedSkills,
      topSkills,
      portfolioSlug,
      githubUsername: profile?.githubUsername ?? null,
      interviewScore: bestInterview?.overallScore ?? null,
      interviewIntegrity: bestInterview?.proctoring
        ? proctoringReportSchema.parse(bestInterview.proctoring)
        : null,
      ...report,
    };
  }

  /**
   * The heart of the ranking: for each required skill, decide if it's PROVEN in
   * the candidate's repos (evidence) and/or present in their resume (keyword
   * match, like Internshala). Evidence is weighted higher because it's verified.
   * matchScore = 70% evidence coverage + 30% resume coverage.
   */
  private async matchReport(
    studentId: string,
    jobSkills: string[],
    used: DeveloperEvidenceItem[],
    resumeText: string | null,
  ): Promise<{
    matchScore: number;
    evidenceSkills: string[];
    resumeSkills: string[];
    missingSkills: string[];
    matchedRepos: MatchedRepo[];
  }> {
    if (jobSkills.length === 0) {
      return { matchScore: 0, evidenceSkills: [], resumeSkills: [], missingSkills: [], matchedRepos: [] };
    }

    const resumeLower = (resumeText ?? "").toLowerCase();
    const evidenceSkills: string[] = [];
    const resumeSkills: string[] = [];
    const missingSkills: string[] = [];

    // repoName → set of required skills it proves
    const repoSkillMap = new Map<string, Set<string>>();

    for (const skill of jobSkills) {
      const reqNorm = normTech(skill);

      const provenItems = used.filter((u) => techMatches(reqNorm, normTech(u.technology)));
      const proven = provenItems.length > 0;
      const inResume = reqNorm.length >= 2 && resumeLower.includes(skill.toLowerCase());

      if (proven) {
        evidenceSkills.push(skill);
        for (const item of provenItems) {
          for (const repoName of item.repositories) {
            if (!repoSkillMap.has(repoName)) repoSkillMap.set(repoName, new Set());
            repoSkillMap.get(repoName)!.add(skill);
          }
        }
      }
      if (inResume) resumeSkills.push(skill);
      if (!proven && !inResume) missingSkills.push(skill);
    }

    const evidenceCoverage = evidenceSkills.length / jobSkills.length;
    const resumeCoverage = resumeSkills.length / jobSkills.length;
    const matchScore = Math.round(evidenceCoverage * 70 + resumeCoverage * 30);

    const matchedRepos = await this.resolveRepos(studentId, repoSkillMap);

    return { matchScore, evidenceSkills, resumeSkills, missingSkills, matchedRepos };
  }

  /** Resolve repo names (from evidence) to full public repo cards with links. */
  private async resolveRepos(
    studentId: string,
    repoSkillMap: Map<string, Set<string>>,
  ): Promise<MatchedRepo[]> {
    if (repoSkillMap.size === 0) return [];

    const repos = await this.prisma.repository.findMany({
      where: { account: { userId: studentId }, isPrivate: false, name: { in: [...repoSkillMap.keys()] } },
      select: { name: true, htmlUrl: true, description: true, language: true, stars: true },
    });

    return repos
      .map((r) => ({
        name: r.name,
        htmlUrl: r.htmlUrl,
        description: r.description,
        language: r.language,
        stars: r.stars,
        skills: [...(repoSkillMap.get(r.name) ?? [])],
      }))
      .sort((a, b) => b.skills.length - a.skills.length || b.stars - a.stars);
  }

  /** Recruiter — update an application's status and notify the student. */
  async updateStatus(
    recruiter: User,
    applicationId: string,
    input: UpdateApplicationStatusInput,
  ): Promise<{ id: string; status: string }> {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: { include: { company: true } }, student: { select: { email: true, name: true } } },
    });
    if (!app) throw new NotFoundException("Application not found");
    if (app.job.recruiterId !== recruiter.id) throw new ForbiddenException("Not your job");

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: input.status },
    });

    const companyName = app.job.company?.name ?? null;
    const msg = STATUS_MESSAGES[input.status];
    if (msg) {
      const jobLabel = `${app.job.title}${companyName ? ` at ${companyName}` : ""}`;
      await this.notifications.create(
        app.studentId,
        `Application update — ${app.job.title}`,
        `${msg} (${jobLabel})`,
      );
    }

    // Email the student about the status change (best-effort).
    void this.mail.sendStatusUpdate(
      app.student.email,
      app.student.name,
      app.job.title,
      companyName,
      STATUS_LABELS[input.status] ?? input.status,
    );

    return { id: updated.id, status: updated.status };
  }
}
