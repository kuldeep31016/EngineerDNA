import { Injectable, NotFoundException } from "@nestjs/common";
import type { Company, JobPost as JobRow, Prisma } from "@prisma/client";
import type { PublicJob } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";

export interface JobListQuery {
  q?: string;
  type?: string;
  workMode?: string;
  skills?: string;
}

type JobWithRelations = JobRow & {
  company: Company | null;
  recruiter: { name: string | null };
  _count: { applications: number };
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: JobListQuery = {}): Promise<PublicJob[]> {
    const where: Prisma.JobPostWhereInput = { status: "OPEN" };

    if (query.q) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { company: { name: { contains: q, mode: "insensitive" } } },
      ];
    }
    if (query.type && ["FULL_TIME", "INTERNSHIP", "CONTRACT", "PART_TIME"].includes(query.type)) {
      where.type = query.type as Prisma.EnumJobTypeFilter["equals"];
    }
    if (query.workMode && ["ONSITE", "REMOTE", "HYBRID"].includes(query.workMode)) {
      where.workMode = query.workMode as Prisma.EnumJobWorkModeFilter["equals"];
    }

    const rows = await this.prisma.jobPost.findMany({
      where,
      include: {
        company: true,
        recruiter: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const appliedSet = await this.appliedJobIds(userId, rows.map((r) => r.id));

    let results = rows.map((row) => this.toPublic(row, appliedSet.has(row.id)));

    if (query.skills) {
      const filterSkills = query.skills
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (filterSkills.length > 0) {
        results = results.filter((j) =>
          j.skills.some((s) => filterSkills.some((f) => s.toLowerCase().includes(f))),
        );
      }
    }

    return results;
  }

  async get(userId: string, jobId: string): Promise<PublicJob> {
    const row = await this.prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        recruiter: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!row || row.status === "CLOSED") throw new NotFoundException("Job not found");

    const appliedSet = await this.appliedJobIds(userId, [row.id]);
    return this.toPublic(row, appliedSet.has(row.id));
  }

  private async appliedJobIds(userId: string, jobIds: string[]): Promise<Set<string>> {
    if (!userId || jobIds.length === 0) return new Set();
    const apps = await this.prisma.jobApplication.findMany({
      where: { studentId: userId, jobId: { in: jobIds } },
      select: { jobId: true },
    });
    return new Set(apps.map((a) => a.jobId));
  }

  private toPublic(row: JobWithRelations, hasApplied: boolean): PublicJob {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      responsibilities: row.responsibilities ?? null,
      requirements: row.requirements ?? null,
      benefits: row.benefits ?? null,
      skills: (row.skills as unknown as string[]) ?? [],
      location: row.location ?? null,
      type: row.type,
      workMode: row.workMode,
      status: row.status,
      salaryMin: row.salaryMin ?? null,
      salaryMax: row.salaryMax ?? null,
      experience: row.experience ?? null,
      deadline: row.deadline?.toISOString() ?? null,
      applicationCount: row._count.applications,
      hasApplied,
      company: row.company
        ? {
            id: row.company.id,
            name: row.company.name,
            logo: row.company.logo ?? null,
            website: row.company.website ?? null,
            description: row.company.description ?? null,
          }
        : null,
      recruiterName: row.recruiter.name ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /** Ensure a Company row exists for a recruiter (auto-creates from RecruiterProfile). */
  static async ensureCompany(
    prisma: PrismaService,
    recruiterId: string,
  ): Promise<string | null> {
    const existing = await prisma.company.findUnique({ where: { recruiterId } });
    if (existing) return existing.id;

    const profile = await prisma.recruiterProfile.findUnique({ where: { userId: recruiterId } });
    if (!profile) return null;

    const company = await prisma.company.create({
      data: {
        recruiterId,
        name: profile.companyName,
        website: profile.companyWebsite ?? null,
      },
    });
    return company.id;
  }
}
