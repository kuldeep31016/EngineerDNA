import { Injectable } from "@nestjs/common";
import type { Repository } from "@prisma/client";
import { GithubApiService } from "../github/github-api.service";

/** Concrete, evidence-grounded facts about a repository, fed to the LLM. */
export interface RepoFacts {
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  stars: number;
  forks: number;
  primaryLanguages: string[];
  filePaths: string[];
  manifests: { path: string; content: string }[];
  readme: string | null;
}

// Manifest/config files that reveal stack, build, deploy, and dependencies.
const MANIFEST_FILES = new Set([
  "package.json",
  "pnpm-workspace.yaml",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "go.mod",
  "cargo.toml",
  "composer.json",
  "gemfile",
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "next.config.js",
  "next.config.mjs",
  "tsconfig.json",
  "vercel.json",
  "netlify.toml",
  "procfile",
]);

const MAX_FILE_PATHS = 250;
const MAX_MANIFESTS = 8;
const MAX_MANIFEST_CHARS = 4000;
const MAX_README_CHARS = 6000;

// Noise that wastes tokens without helping the model understand the project.
const NOISE_PATTERNS: RegExp[] = [
  /^node_modules\//,
  /^\.git\//,
  /^dist\//,
  /^build\//,
  /^\.next\//,
  /^out\//,
  /^coverage\//,
  /^vendor\//,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|composer\.lock|cargo\.lock)$/i,
  /\.(png|jpe?g|gif|svg|ico|webp|bmp|mp3|mp4|wav|woff2?|ttf|eot|pdf|map|min\.js|min\.css)$/i,
];

const isNoise = (path: string): boolean => NOISE_PATTERNS.some((re) => re.test(path));

@Injectable()
export class RepoFactsService {
  constructor(private readonly github: GithubApiService) {}

  /** Gather facts for a repo using a connected GitHub access token. */
  async gather(token: string, repo: Repository): Promise<RepoFacts> {
    const branch = repo.defaultBranch ?? "main";
    const [languages, rawPaths, readme] = await Promise.all([
      this.github.getLanguages(token, repo.fullName),
      this.github.getFileTree(token, repo.fullName, branch),
      this.github.getReadme(token, repo.fullName),
    ]);

    // Drop noise (lock files, build output, binaries) to keep the prompt lean.
    const filePaths = rawPaths.filter((p) => !isNoise(p));

    // Pick the manifest files that actually exist, then fetch their contents.
    const manifestPaths = filePaths
      .filter((p) => MANIFEST_FILES.has(p.split("/").pop()!.toLowerCase()))
      .slice(0, MAX_MANIFESTS);

    const manifests = (
      await Promise.all(
        manifestPaths.map(async (path) => {
          const content = await this.github.getFileContent(token, repo.fullName, path);
          return content ? { path, content: content.slice(0, MAX_MANIFEST_CHARS) } : null;
        }),
      )
    ).filter((m): m is { path: string; content: string } => m !== null);

    return {
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      isPrivate: repo.isPrivate,
      stars: repo.stars,
      forks: repo.forks,
      primaryLanguages: languages.slice(0, 10),
      filePaths: filePaths.slice(0, MAX_FILE_PATHS),
      manifests,
      readme: readme ? readme.slice(0, MAX_README_CHARS) : null,
    };
  }
}
