import type { Metadata } from "next";
import { APP_NAME } from "@engineerdna/shared";
import { getPublicProfile } from "@/services/public-profile";
import ProfileClient from "./ProfileClient";

/** Per-request SEO + OpenGraph so shared verified-profile links render a rich card. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  try {
    const p = await getPublicProfile(username);
    const title = `${p.name} — Verified Engineer · ${APP_NAME}`;
    const description =
      p.headline ??
      `${p.name} has ${p.verifiedSkillCount} skills proven by real public code — engineering score ${p.overall}/100. Verified on ${APP_NAME}.`;
    const images = p.profileImage ? [{ url: p.profileImage }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: `/u/${p.username}` },
      openGraph: { title, description, type: "profile", url: `/u/${p.username}`, images },
      twitter: { card: images ? "summary" : "summary_large_image", title, description, images },
    };
  } catch {
    return {
      title: `Verified Engineer · ${APP_NAME}`,
      description: "A verified engineering profile — every skill proven by real public code.",
    };
  }
}

export default function PublicProfilePage() {
  return <ProfileClient />;
}
