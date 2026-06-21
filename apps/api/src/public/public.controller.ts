import { Controller, Get, Header, Param } from "@nestjs/common";
import type { PublicProfile } from "@engineerdna/shared";
import { PublicService } from "./public.service";

/** Public, UNAUTHENTICATED endpoints for shareable verified profiles + badges. */
@Controller("public")
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /** GET /api/public/profile/:username — the public verified profile data. */
  @Get("profile/:username")
  getProfile(@Param("username") username: string): Promise<PublicProfile> {
    return this.publicService.getProfile(username);
  }

  /** GET /api/public/profile/:username/badge.svg — embeddable verification badge. */
  @Get("profile/:username/badge.svg")
  @Header("Content-Type", "image/svg+xml")
  @Header("Cache-Control", "public, max-age=600")
  badge(@Param("username") username: string): Promise<string> {
    return this.publicService.getBadgeSvg(username);
  }
}
