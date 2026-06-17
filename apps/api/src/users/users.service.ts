import { Injectable } from "@nestjs/common";
import type { AuthProvider, Prisma, User } from "@prisma/client";
import type { AuthUser } from "@engineerdna/shared";
import { PrismaService } from "../prisma/prisma.service";

/** Input describing an identity returned by an OAuth provider. */
export interface OAuthProfileInput {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name?: string | null;
  profileImage?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find the user for an OAuth identity, creating them on first login and
   * refreshing their profile fields + lastLogin on every login.
   */
  async upsertFromOAuth(profile: OAuthProfileInput): Promise<User> {
    const data: Prisma.UserCreateInput = {
      email: profile.email,
      name: profile.name ?? null,
      profileImage: profile.profileImage ?? null,
      provider: profile.provider,
      providerId: profile.providerId,
      // OAuth providers return verified emails, so we trust them.
      isVerified: true,
      lastLogin: new Date(),
    };

    return this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      create: data,
      update: {
        name: data.name,
        profileImage: data.profileImage,
        lastLogin: new Date(),
      },
    });
  }

  /** Map a DB user to the client-safe shape (no secrets, dates as ISO). */
  static toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      role: user.role,
      provider: user.provider,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    };
  }
}
