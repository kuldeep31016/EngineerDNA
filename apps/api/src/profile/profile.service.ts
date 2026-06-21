import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Profile as ProfileRow, Skill, User } from "@prisma/client";
import { z } from "zod";
import {
  achievementItemSchema,
  certificationItemSchema,
  educationItemSchema,
  experienceItemSchema,
  projectItemSchema,
  socialLinkSchema,
  type AddSkillInput,
  type Profile,
  type UpdateProfileInput,
} from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";

// Parse stored JSON defensively so a malformed row can never crash a response.
const arr = <S extends z.ZodTypeAny>(schema: S, value: unknown) =>
  z.array(schema).safeParse(value).data ?? [];

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /** Return the user's passport, creating an empty one on first visit. */
  async getOrCreate(user: User): Promise<Profile> {
    const profile = await this.prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      include: { skills: { orderBy: { createdAt: "asc" } } },
    });
    return this.toResponse(user, profile, profile.skills);
  }

  /** Update editable core fields and/or whole content sections. */
  async update(user: User, input: UpdateProfileInput): Promise<Profile> {
    await this.ensureProfile(user.id);
    const data: Prisma.ProfileUpdateInput = { ...(input as Prisma.ProfileUpdateInput) };
    try {
      const updated = await this.prisma.profile.update({
        where: { userId: user.id },
        data,
        include: { skills: { orderBy: { createdAt: "asc" } } },
      });
      return this.toResponse(user, updated, updated.skills);
    } catch (err) {
      // Unique-constraint violation — almost always a taken username.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("That username is already taken.");
      }
      throw err;
    }
  }

  /** Add a self-claimed skill (idempotent on name within a profile). */
  async addSkill(user: User, input: AddSkillInput): Promise<Profile> {
    const profile = await this.ensureProfile(user.id);
    await this.prisma.skill.upsert({
      where: { profileId_name: { profileId: profile.id, name: input.name } },
      create: {
        profileId: profile.id,
        name: input.name,
        category: input.category ?? null,
      },
      update: { category: input.category ?? null },
    });
    return this.getOrCreate(user);
  }

  /** Remove a skill the caller owns. */
  async removeSkill(user: User, skillId: string): Promise<Profile> {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      include: { profile: true },
    });
    if (!skill || skill.profile.userId !== user.id) {
      throw new NotFoundException("Skill not found");
    }
    await this.prisma.skill.delete({ where: { id: skillId } });
    return this.getOrCreate(user);
  }

  private async ensureProfile(userId: string): Promise<ProfileRow> {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  private toResponse(user: User, row: ProfileRow, skills: Skill[]): Profile {
    return {
      user: UsersService.toAuthUser(user),
      username: row.username,
      headline: row.headline,
      about: row.about,
      location: row.location,
      websiteUrl: row.websiteUrl,
      githubUsername: row.githubUsername,
      leetcodeUsername: row.leetcodeUsername,
      codeforcesUsername: row.codeforcesUsername,
      openToWork: row.openToWork,
      isPublic: row.isPublic,
      college: row.college,
      experienceYears: row.experienceYears,
      availability: row.availability,
      expectedSalary: row.expectedSalary,
      education: arr(educationItemSchema, row.education),
      experience: arr(experienceItemSchema, row.experience),
      projects: arr(projectItemSchema, row.projects),
      achievements: arr(achievementItemSchema, row.achievements),
      certifications: arr(certificationItemSchema, row.certifications),
      socialLinks: arr(socialLinkSchema, row.socialLinks),
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        status: s.status,
      })),
    };
  }
}
