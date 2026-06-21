// Demo seed — builds a complete, coherent hiring story so every surface
// (recruiter analytics funnel, application timeline, candidate comparison,
// student dashboard, company page) renders with real data for a live demo.
//
//   DATABASE_URL=... node prisma/seed.mjs
//
// Idempotent: deletes the demo users by email (cascades all their data) then
// recreates everything. Safe to re-run. Touches ONLY demo accounts.

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load DATABASE_URL from the monorepo .env if it isn't already in the
// environment, so the seed runs from any cwd (root or apps/api) with no deps.
if (!process.env.DATABASE_URL) {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "../.env"), join(here, "../../.env"), join(here, "../../../.env")];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    if (process.env.DATABASE_URL) break;
  }
}

const prisma = new PrismaClient();

/** Mirror PasswordService.hash (scrypt, `salt:derivedKey` hex) so the demo
 *  recruiter can log in with the same verifier the app uses. */
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

const DAY = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

const RECRUITER_EMAIL = "demo.recruiter@engineerdna.dev";
const RECRUITER_PASSWORD = "demo1234";

// technology → category (any valid TechCategory enum value is fine).
const CATEGORY = {
  TypeScript: "LANGUAGE", JavaScript: "LANGUAGE", Python: "LANGUAGE", Go: "LANGUAGE", Java: "LANGUAGE",
  "Node.js": "FRAMEWORK", Express: "FRAMEWORK", NestJS: "FRAMEWORK", React: "FRAMEWORK", "Next.js": "FRAMEWORK",
  FastAPI: "FRAMEWORK", Django: "FRAMEWORK",
  PostgreSQL: "DATABASE", Redis: "DATABASE", MongoDB: "DATABASE",
  AWS: "CLOUD", GCP: "CLOUD",
  Docker: "DEPLOYMENT", Kubernetes: "DEPLOYMENT", Terraform: "DEPLOYMENT",
  Jest: "TESTING",
  TensorFlow: "LIBRARY", "Tailwind CSS": "LIBRARY", CSS: "LIBRARY", GraphQL: "LIBRARY",
};

const candidates = [
  {
    key: "aarav", name: "Aarav Sharma", username: "aarav-sharma", login: "aaravsharma",
    headline: "Backend Engineer · Distributed Systems",
    location: "Bengaluru, India", college: "IIT Bombay", experienceYears: 4,
    availability: "Available in 30 days", expectedSalary: "₹30–36 LPA",
    techs: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "Redis", "AWS", "Jest"],
    repos: ["payments-ledger", "rate-limiter", "event-bus", "graphql-gateway"],
  },
  {
    key: "diya", name: "Diya Patel", username: "diya-patel", login: "diyapatel",
    headline: "Frontend Engineer · Design Systems",
    location: "Pune, India", college: "COEP Pune", experienceYears: 2,
    availability: "Immediately", expectedSalary: "₹18–22 LPA",
    techs: ["React", "Next.js", "TypeScript", "Tailwind CSS", "CSS", "JavaScript"],
    repos: ["design-system", "portfolio-next", "charts-react"],
  },
  {
    key: "rohan", name: "Rohan Mehta", username: "rohan-mehta", login: "rohanmehta",
    headline: "Full-Stack Engineer",
    location: "Remote, India", college: "NIT Trichy", experienceYears: 3,
    availability: "Available in 15 days", expectedSalary: "₹24–28 LPA",
    techs: ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "Docker"],
    repos: ["saas-starter", "realtime-chat", "url-shortener"],
  },
  {
    key: "ananya", name: "Ananya Iyer", username: "ananya-iyer", login: "ananyaiyer",
    headline: "ML Engineer · NLP",
    location: "Hyderabad, India", college: "IIIT Hyderabad", experienceYears: 3,
    availability: "Available in 60 days", expectedSalary: "₹28–34 LPA",
    techs: ["Python", "TensorFlow", "FastAPI", "PostgreSQL", "Docker"],
    repos: ["semantic-search", "ml-pipeline", "embeddings-api"],
  },
  {
    key: "kabir", name: "Kabir Singh", username: "kabir-singh", login: "kabirsingh",
    headline: "DevOps / Platform Engineer",
    location: "Gurugram, India", college: "DTU Delhi", experienceYears: 5,
    availability: "Available in 30 days", expectedSalary: "₹32–40 LPA",
    techs: ["Docker", "Kubernetes", "AWS", "Go", "Terraform", "PostgreSQL"],
    repos: ["k8s-operators", "infra-modules", "deploy-bot"],
  },
];

async function main() {
  console.log("· clearing previous demo data…");
  await prisma.user.deleteMany({
    where: { email: { in: [RECRUITER_EMAIL, ...candidates.map((c) => `${c.key}@demo.engineerdna.dev`)] } },
  });

  // ---- Recruiter + company + subscription -------------------------------
  console.log("· creating recruiter + company…");
  const recruiter = await prisma.user.create({
    data: {
      email: RECRUITER_EMAIL,
      name: "Priya Nair",
      role: "RECRUITER",
      provider: "CREDENTIALS",
      providerId: RECRUITER_EMAIL,
      passwordHash: hashPassword(RECRUITER_PASSWORD),
      isVerified: true,
      profileImage: "https://api.dicebear.com/7.x/initials/png?seed=Priya%20Nair",
    },
  });
  await prisma.recruiterProfile.create({
    data: { userId: recruiter.id, companyName: "Northwind Labs", companyWebsite: "https://northwind.example.com", title: "Head of Engineering Hiring" },
  });
  await prisma.recruiterSubscription.create({
    data: {
      userId: recruiter.id, plan: "growth", status: "active",
      jobPostLimit: 25, jobPostsUsed: 3, amount: 9900, currency: "INR",
      startedAt: daysAgo(40), expiresAt: daysFromNow(325),
    },
  });
  const company = await prisma.company.create({
    data: {
      recruiterId: recruiter.id,
      name: "Northwind Labs",
      logo: "https://api.dicebear.com/7.x/initials/png?seed=Northwind%20Labs",
      website: "https://northwind.example.com",
      description:
        "Northwind Labs builds developer infrastructure used by thousands of engineering teams. We hire on proven engineering evidence — not resume claims.",
    },
  });

  // ---- Jobs --------------------------------------------------------------
  console.log("· creating job posts…");
  const job1 = await prisma.jobPost.create({
    data: {
      recruiterId: recruiter.id, companyId: company.id, title: "Senior Backend Engineer",
      description: "Own and scale the services behind our developer platform.",
      requirements: "4+ years building production backend systems.",
      skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
      location: "Remote (India)", type: "FULL_TIME", workMode: "REMOTE", status: "OPEN",
      salaryMin: 2800000, salaryMax: 3800000, experience: "4-7 years", createdAt: daysAgo(20),
    },
  });
  const job2 = await prisma.jobPost.create({
    data: {
      recruiterId: recruiter.id, companyId: company.id, title: "Full-Stack Engineer",
      description: "Ship end-to-end features across our web app and APIs.",
      skills: ["React", "Next.js", "TypeScript", "Node.js"],
      location: "Bengaluru", type: "FULL_TIME", workMode: "HYBRID", status: "OPEN",
      salaryMin: 2000000, salaryMax: 3000000, experience: "2-5 years", createdAt: daysAgo(15),
    },
  });
  const job3 = await prisma.jobPost.create({
    data: {
      recruiterId: recruiter.id, companyId: company.id, title: "Frontend Engineer (Intern)",
      description: "Build polished UI for our developer dashboard.",
      skills: ["React", "TypeScript", "CSS"],
      location: "Bengaluru", type: "INTERNSHIP", workMode: "ONSITE", status: "OPEN",
      createdAt: daysAgo(10),
    },
  });

  // ---- Candidates: users + profiles + evidence ---------------------------
  console.log("· creating verified candidates with evidence…");
  const byKey = {};
  for (const c of candidates) {
    const user = await prisma.user.create({
      data: {
        email: `${c.key}@demo.engineerdna.dev`,
        name: c.name, role: "STUDENT", provider: "GITHUB", providerId: `gh_${c.login}`,
        isVerified: true,
        profileImage: `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(c.name)}`,
      },
    });
    await prisma.profile.create({
      data: {
        userId: user.id, username: c.username, headline: c.headline, location: c.location,
        about: `${c.name} — ${c.headline}. Every skill below is proven by real public code.`,
        githubUsername: c.login, openToWork: true, isPublic: true,
        college: c.college, experienceYears: c.experienceYears,
        availability: c.availability, expectedSalary: c.expectedSalary,
      },
    });
    const account = await prisma.githubAccount.create({
      data: { userId: user.id, githubUserId: `id_${c.login}`, githubLogin: c.login, accessToken: "seed-no-token" },
    });

    // Repositories + one USED evidence row per tech, spread across repos.
    const repoRows = [];
    for (let i = 0; i < c.repos.length; i++) {
      const name = c.repos[i];
      repoRows.push(
        await prisma.repository.create({
          data: {
            githubAccountId: account.id, githubId: `${c.login}_${i}`, name,
            fullName: `${c.login}/${name}`, description: `${name} — production project by ${c.name}.`,
            language: ["TypeScript", "Python", "Go", "JavaScript"][i % 4],
            stars: 12 + i * 37, forks: 3 + i * 5, isPrivate: false, isFork: false, ownCommits: 40 + i * 25,
            htmlUrl: `https://github.com/${c.login}/${name}`, pushedAt: daysAgo(3 + i * 4),
            repoCreatedAt: daysAgo(400 - i * 30), selectedForAnalysis: true,
          },
        }),
      );
    }
    for (let i = 0; i < c.techs.length; i++) {
      const tech = c.techs[i];
      const repo = repoRows[i % repoRows.length];
      await prisma.techEvidence.create({
        data: {
          userId: user.id, repositoryId: repo.id, technology: tech,
          category: CATEGORY[tech] ?? "TOOL", strength: "USED",
          confidence: 0.78 + (i % 4) * 0.05, source: "GITHUB_REPO", proofs: [],
          firstSeenAt: daysAgo(300 - i * 20),
        },
      });
    }
    byKey[c.key] = user;
  }

  // ---- Applications + lifecycle (the funnel story) -----------------------
  console.log("· creating applications, interviews, offers, timelines…");

  // helper to create an application with a timeline of events.
  async function apply({ student, job, status, createdAt, resume = true, events, interview, offer }) {
    const app = await prisma.jobApplication.create({
      data: {
        jobId: job.id, studentId: student.id, status,
        resumeText: resume ? `${student.name}'s resume — verified engineer on EngineerDNA.` : null,
        coverLetter: "Excited about this role — my public work proves the required skills.",
        createdAt, updatedAt: events.length ? events[events.length - 1].at : createdAt,
      },
    });
    for (const e of events) {
      await prisma.applicationEvent.create({
        data: { applicationId: app.id, type: e.type, actorRole: e.role, note: e.note ?? null, createdAt: e.at },
      });
    }
    if (interview) {
      await prisma.interviewSchedule.create({
        data: {
          applicationId: app.id, scheduledAt: interview.at, status: interview.status,
          meetingLink: "https://meet.google.com/demo-northwind", notes: "Panel: 2 engineers, 1 hiring manager.",
          createdAt, updatedAt: createdAt,
        },
      });
    }
    if (offer) {
      await prisma.offer.create({
        data: {
          applicationId: app.id, salary: offer.salary, employmentType: "FULL_TIME",
          joiningDate: daysFromNow(30), message: "We'd love to have you on the team!",
          status: offer.status, createdAt, updatedAt: createdAt,
        },
      });
    }
    return app;
  }

  // Aarav → HIRED (the demo climax: full timeline + accepted interview + accepted offer)
  await apply({
    student: byKey.aarav, job: job1, status: "HIRED", createdAt: daysAgo(12),
    interview: { at: daysAgo(6), status: "ACCEPTED" },
    offer: { salary: "₹34 LPA", status: "ACCEPTED" },
    events: [
      { type: "applied", role: "student", at: daysAgo(12) },
      { type: "status_changed", role: "recruiter", note: "Shortlisted", at: daysAgo(10) },
      { type: "interview_scheduled", role: "recruiter", note: "Proposed for " + daysAgo(6).toDateString(), at: daysAgo(9) },
      { type: "interview_accepted", role: "student", at: daysAgo(8) },
      { type: "offer_sent", role: "recruiter", note: "₹34 LPA · FULL_TIME", at: daysAgo(4) },
      { type: "offer_accepted", role: "student", at: daysAgo(2) },
      { type: "status_changed", role: "recruiter", note: "Hired", at: daysAgo(1) },
    ],
  });

  // Rohan → OFFER_SENT (interview accepted, offer pending)
  await apply({
    student: byKey.rohan, job: job1, status: "OFFER_SENT", createdAt: daysAgo(9),
    interview: { at: daysAgo(4), status: "ACCEPTED" },
    offer: { salary: "₹26 LPA", status: "SENT" },
    events: [
      { type: "applied", role: "student", at: daysAgo(9) },
      { type: "status_changed", role: "recruiter", note: "Shortlisted", at: daysAgo(7) },
      { type: "interview_scheduled", role: "recruiter", at: daysAgo(6) },
      { type: "interview_accepted", role: "student", at: daysAgo(5) },
      { type: "offer_sent", role: "recruiter", note: "₹26 LPA · FULL_TIME", at: daysAgo(2) },
    ],
  });

  // Kabir → INTERVIEW_SCHEDULED (awaiting his response)
  await apply({
    student: byKey.kabir, job: job1, status: "INTERVIEW_SCHEDULED", createdAt: daysAgo(6),
    interview: { at: daysFromNow(2), status: "PROPOSED" },
    events: [
      { type: "applied", role: "student", at: daysAgo(6) },
      { type: "status_changed", role: "recruiter", note: "Shortlisted", at: daysAgo(4) },
      { type: "interview_scheduled", role: "recruiter", note: "Proposed for " + daysFromNow(2).toDateString(), at: daysAgo(3) },
    ],
  });

  // Ananya → SHORTLISTED
  await apply({
    student: byKey.ananya, job: job1, status: "SHORTLISTED", createdAt: daysAgo(5),
    events: [
      { type: "applied", role: "student", at: daysAgo(5) },
      { type: "status_changed", role: "recruiter", note: "Shortlisted", at: daysAgo(3) },
    ],
  });

  // Diya → APPLIED on job1
  await apply({
    student: byKey.diya, job: job1, status: "APPLIED", createdAt: daysAgo(2),
    events: [{ type: "applied", role: "student", at: daysAgo(2) }],
  });

  // Job 2 distribution
  await apply({
    student: byKey.rohan, job: job2, status: "SHORTLISTED", createdAt: daysAgo(8),
    events: [
      { type: "applied", role: "student", at: daysAgo(8) },
      { type: "status_changed", role: "recruiter", note: "Shortlisted", at: daysAgo(6) },
    ],
  });
  await apply({
    student: byKey.diya, job: job2, status: "VIEWED", createdAt: daysAgo(6),
    events: [
      { type: "applied", role: "student", at: daysAgo(6) },
      { type: "status_changed", role: "recruiter", note: "Viewed", at: daysAgo(5) },
    ],
  });
  await apply({
    student: byKey.kabir, job: job2, status: "REJECTED", createdAt: daysAgo(9),
    events: [
      { type: "applied", role: "student", at: daysAgo(9) },
      { type: "status_changed", role: "recruiter", note: "Not selected", at: daysAgo(7) },
    ],
  });

  // Job 3 (intern)
  await apply({
    student: byKey.diya, job: job3, status: "APPLIED", createdAt: daysAgo(3),
    events: [{ type: "applied", role: "student", at: daysAgo(3) }],
  });

  // ---- Shortlist + private notes -----------------------------------------
  console.log("· seeding shortlist + recruiter notes…");
  for (const key of ["aarav", "rohan", "ananya"]) {
    await prisma.shortlist.create({ data: { recruiterId: recruiter.id, candidateId: byKey[key].id } });
  }
  await prisma.recruiterNote.create({
    data: { recruiterId: recruiter.id, candidateId: byKey.aarav.id, rating: 5, body: "Outstanding systems depth — payments-ledger is production-grade. Moved to offer, accepted." },
  });
  await prisma.recruiterNote.create({
    data: { recruiterId: recruiter.id, candidateId: byKey.rohan.id, rating: 4, body: "Strong full-stack generalist. Great interview. Offer out." },
  });

  console.log("\n✓ Demo data seeded.");
  console.log(`  Recruiter login →  ${RECRUITER_EMAIL}  /  ${RECRUITER_PASSWORD}`);
  console.log(`  Company page    →  /c/${company.id}`);
  console.log(`  Public profiles →  ${candidates.map((c) => "/u/" + c.username).join("  ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
