import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Company, JobPost as JobRow, Prisma, User } from "@prisma/client";
import type { CandidateSearchResult, CreateJobInput, JobPost, UpdateJobInput } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RecruiterService } from "./recruiter.service";
import { SubscriptionService } from "../payments/subscription.service";
import { JobsService } from "../jobs/jobs.service";

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recruiter: RecruiterService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  /** The recruiter's own job posts, newest first. */
  async list(user: User): Promise<JobPost[]> {
    const rows = await this.prisma.jobPost.findMany({
      where: { recruiterId: user.id },
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((row) => this.toContract(user, row)));
  }

  async create(user: User, input: CreateJobInput): Promise<JobPost> {
    const { allowed, limit, used } = await this.subscriptions.canCreateJob(user.id);
    if (!allowed) {
      throw new ForbiddenException(
        limit === 0
          ? "An active recruiter subscription is required to post jobs."
          : `Your plan allows ${limit} active job posts (you have ${used}). Close one or upgrade your plan.`,
      );
    }

    const companyId = await JobsService.ensureCompany(this.prisma, user.id);

    const row = await this.prisma.jobPost.create({
      data: {
        recruiterId: user.id,
        companyId,
        title: input.title,
        description: input.description,
        responsibilities: input.responsibilities ?? null,
        requirements: input.requirements ?? null,
        benefits: input.benefits ?? null,
        skills: (input.skills ?? []) as unknown as Prisma.InputJsonValue,
        location: input.location ?? null,
        type: input.type,
        workMode: input.workMode,
        salaryMin: input.salaryMin ?? null,
        salaryMax: input.salaryMax ?? null,
        experience: input.experience ?? null,
        deadline: input.deadline ? new Date(input.deadline) : null,
      },
      include: { company: true, _count: { select: { applications: true } } },
    });
    return this.toContract(user, row);
  }

  async get(user: User, id: string): Promise<JobPost> {
    const row = await this.requireOwned(user, id);
    return this.toContract(user, row);
  }

  async update(user: User, id: string, input: UpdateJobInput): Promise<JobPost> {
    await this.requireOwned(user, id);
    const row = await this.prisma.jobPost.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        responsibilities: input.responsibilities !== undefined ? (input.responsibilities ?? null) : undefined,
        requirements: input.requirements !== undefined ? (input.requirements ?? null) : undefined,
        benefits: input.benefits !== undefined ? (input.benefits ?? null) : undefined,
        skills: input.skills !== undefined ? (input.skills as unknown as Prisma.InputJsonValue) : undefined,
        location: input.location !== undefined ? (input.location ?? null) : undefined,
        type: input.type,
        workMode: input.workMode,
        status: input.status,
        salaryMin: input.salaryMin !== undefined ? (input.salaryMin ?? null) : undefined,
        salaryMax: input.salaryMax !== undefined ? (input.salaryMax ?? null) : undefined,
        experience: input.experience !== undefined ? (input.experience ?? null) : undefined,
        deadline: input.deadline !== undefined ? (input.deadline ? new Date(input.deadline) : null) : undefined,
      },
      include: { company: true, _count: { select: { applications: true } } },
    });
    return this.toContract(user, row);
  }

  async remove(user: User, id: string): Promise<void> {
    await this.requireOwned(user, id);
    await this.prisma.jobPost.delete({ where: { id } });
  }

  /** Verified candidates matching this job's required skills. */
  async matches(user: User, id: string): Promise<CandidateSearchResult> {
    const row = await this.requireOwned(user, id);
    const skills = (row.skills as unknown as string[]) ?? [];
    if (skills.length === 0) return { candidates: [], total: 0 };
    return this.recruiter.search(user, { skills });
  }

  private async requireOwned(
    user: User,
    id: string,
  ): Promise<JobRow & { company: Company | null; _count: { applications: number } }> {
    const row = await this.prisma.jobPost.findUnique({
      where: { id },
      include: { company: true, _count: { select: { applications: true } } },
    });
    if (!row || row.recruiterId !== user.id) {
      throw new NotFoundException("Job post not found");
    }
    return row;
  }

  private async toContract(
    user: User,
    row: JobRow & { company: Company | null; _count: { applications: number } },
  ): Promise<JobPost> {
    const skills = (row.skills as unknown as string[]) ?? [];
    const matchCount = skills.length === 0 ? 0 : (await this.recruiter.search(user, { skills })).total;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      responsibilities: row.responsibilities ?? null,
      requirements: row.requirements ?? null,
      benefits: row.benefits ?? null,
      skills,
      location: row.location ?? null,
      type: row.type,
      workMode: row.workMode,
      status: row.status,
      salaryMin: row.salaryMin ?? null,
      salaryMax: row.salaryMax ?? null,
      experience: row.experience ?? null,
      deadline: row.deadline?.toISOString() ?? null,
      matchCount,
      applicationCount: row._count.applications,
      company: row.company
        ? {
            id: row.company.id,
            name: row.company.name,
            logo: row.company.logo ?? null,
            website: row.company.website ?? null,
            description: row.company.description ?? null,
          }
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
