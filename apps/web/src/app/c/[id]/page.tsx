import type { Metadata } from "next";
import { APP_NAME } from "@engineerdna/shared";
import { getPublicCompany } from "@/services/public-company";
import CompanyClient from "./CompanyClient";

/** Per-request SEO + OpenGraph so shared company links render a rich card. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const c = await getPublicCompany(id);
    const title = `${c.name} — Hiring on ${APP_NAME}`;
    const roles = c.openRoleCount === 1 ? "1 open role" : `${c.openRoleCount} open roles`;
    const description =
      c.description ?? `${c.name} has ${roles} on ${APP_NAME}, hiring engineers by verified evidence — not resume claims.`;
    const images = c.logo ? [{ url: c.logo }] : undefined;
    return {
      title,
      description,
      alternates: { canonical: `/c/${c.id}` },
      openGraph: { title, description, type: "website", url: `/c/${c.id}`, images },
      twitter: { card: images ? "summary" : "summary_large_image", title, description, images },
    };
  } catch {
    return {
      title: `Hiring on ${APP_NAME}`,
      description: "Open engineering roles — candidates matched by verified evidence, not resume claims.",
    };
  }
}

export default function PublicCompanyPage() {
  return <CompanyClient />;
}
