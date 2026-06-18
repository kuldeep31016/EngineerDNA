import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";
import type {
  EngineeringTimeline,
  TimelineMilestone,
  TimelinePeriod,
  TimelineTech,
} from "@engineerdna/shared";
import { EvidenceService } from "../evidence/evidence.service";

// The category-firsts worth celebrating as milestones (skip LIBRARY/TOOL noise).
const FIRST_LABELS: Record<string, string> = {
  LANGUAGE: "First language",
  FRAMEWORK: "First framework",
  DATABASE: "First database",
  CLOUD: "First cloud platform",
  DEPLOYMENT: "First deployment",
  TESTING: "First tests written",
  AUTH: "First auth system",
};

@Injectable()
export class TimelineService {
  constructor(private readonly evidence: EvidenceService) {}

  /** Build the developer's growth timeline from their evidence (live). */
  async getTimeline(user: User): Promise<EngineeringTimeline> {
    const { items } = await this.evidence.getDeveloperEvidence(user);
    const used = items
      .filter((i) => i.strength === "USED" && i.firstSeenAt)
      .sort((a, b) => a.firstSeenAt!.localeCompare(b.firstSeenAt!));

    if (used.length === 0) {
      return {
        available: false,
        startedAt: null,
        yearsActive: 0,
        totalSkills: 0,
        categoriesCovered: 0,
        milestones: [],
        periods: [],
        generatedAt: new Date().toISOString(),
      };
    }

    // Notable "firsts": the earliest technology in each milestone category.
    const seenCategory = new Set<string>();
    const milestones: TimelineMilestone[] = [];
    const milestoneByKey = new Map<string, string>();
    for (const item of used) {
      const label = FIRST_LABELS[item.category];
      if (label && !seenCategory.has(item.category)) {
        seenCategory.add(item.category);
        milestones.push({ label, technology: item.technology, date: item.firstSeenAt! });
        milestoneByKey.set(`${item.technology}@${item.firstSeenAt}`, label);
      }
    }

    // Group by year, with a running cumulative skill count.
    const byYear = new Map<number, TimelineTech[]>();
    for (const item of used) {
      const year = new Date(item.firstSeenAt!).getUTCFullYear();
      const tech: TimelineTech = {
        technology: item.technology,
        category: item.category,
        firstSeenAt: item.firstSeenAt!,
        repositories: item.repositories,
        milestone: milestoneByKey.get(`${item.technology}@${item.firstSeenAt}`) ?? null,
      };
      const arr = byYear.get(year) ?? [];
      arr.push(tech);
      byYear.set(year, arr);
    }

    let cumulative = 0;
    const periods: TimelinePeriod[] = [...byYear.keys()]
      .sort((a, b) => a - b)
      .map((year) => {
        const techs = byYear.get(year)!;
        cumulative += techs.length;
        return { label: String(year), year, techs, cumulativeSkills: cumulative };
      });

    const startYear = periods[0]!.year;
    const endYear = periods[periods.length - 1]!.year;

    return {
      available: true,
      startedAt: used[0]!.firstSeenAt!,
      yearsActive: endYear - startYear + 1,
      totalSkills: used.length,
      categoriesCovered: new Set(used.map((i) => i.category)).size,
      milestones,
      periods,
      generatedAt: new Date().toISOString(),
    };
  }
}
