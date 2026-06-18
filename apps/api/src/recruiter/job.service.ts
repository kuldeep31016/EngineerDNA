import { Injectable, NotFoundException } from "@nestjs/common";
import type { JobPost as JobRow, Prisma, User } from "@prisma/client";
import type { CandidateSearchResult, CreateJobInput, JobPost, UpdateJobInput } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RecruiterService } from "./recruiter.service";

@Injectable()
export class JobService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recruiter: RecruiterService,
  ) {}

  /** The recruiter's own job posts, newest first (with match counts). */
  async list(user: User): Promise<JobPost[]> {
    const rows = await this.prisma.jobPost.findMany({
      where: { recruiterId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((row) => this.toContract(user, row)));
  }

  async create(user: User, input: CreateJobInput): Promise<JobPost> {
    const row = await this.prisma.jobPost.create({
      data: {
        recruiterId: user.id,
        title: input.title,
        description: input.description,
        skills: (input.skills ?? []) as unknown as Prisma.InputJsonValue,
        location: input.location ?? null,
        type: input.type,
        workMode: input.workMode,
      },
    });
    return this.toContract(user, row);
  }

  async get(user: User, id: string): Promise<JobPost> {
    return this.toContract(user, await this.requireOwned(user, id));
  }

  async update(user: User, id: string, input: UpdateJobInput): Promise<JobPost> {
    await this.requireOwned(user, id);
    const row = await this.prisma.jobPost.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        skills:
          input.skills !== undefined ? (input.skills as unknown as Prisma.InputJsonValue) : undefined,
        location: input.location !== undefined ? (input.location ?? null) : undefined,
        type: input.type,
        workMode: input.workMode,
        status: input.status,
      },
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

  private async requireOwned(user: User, id: string): Promise<JobRow> {
    const row = await this.prisma.jobPost.findUnique({ where: { id } });
    if (!row || row.recruiterId !== user.id) {
      throw new NotFoundException("Job post not found");
    }
    return row;
  }

  private async toContract(user: User, row: JobRow): Promise<JobPost> {
    const skills = (row.skills as unknown as string[]) ?? [];
    const matchCount = skills.length === 0 ? 0 : (await this.recruiter.search(user, { skills })).total;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      skills,
      location: row.location ?? null,
      type: row.type,
      workMode: row.workMode,
      status: row.status,
      matchCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
