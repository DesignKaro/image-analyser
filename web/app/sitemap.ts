import type { MetadataRoute } from "next";

const SITE_URL = resolveSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const productPages = [
    "/",
    "/image-to-prompt-converter",
    "/image-prompt-generator",
    "/gemini-ai-photo-prompt",
    "/ai-gemini-photo-prompt",
    "/google-gemini-ai-photo-prompt",
    "/gemini-prompt"
  ];

  const toolPages = [
    "/bulk",
    "/chrome-extension",
    "/pricing",
    "/result"
  ];

  const accountPages = [
    "/profile",
    "/billing",
    "/saved-prompts"
  ];

  const infoPages = [
    "/about",
    "/contact",
    "/faqs"
  ];

  const legalPages = [
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/security"
  ];

  const toolsSubPages = [
    "/tools/ai-image-generator",
    "/tools/prompt-enhancer",
    "/tools/background-remover",
    "/tools/image-upscaler"
  ];

  const routes: { path: string; priority: number; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    ...productPages.map((path) => ({ path, priority: path === "/" ? 1 : 0.9, changeFrequency: "weekly" as const })),
    ...toolPages.map((path) => ({ path, priority: 0.85, changeFrequency: "weekly" as const })),
    ...accountPages.map((path) => ({ path, priority: 0.6, changeFrequency: "monthly" as const })),
    ...infoPages.map((path) => ({ path, priority: 0.75, changeFrequency: "monthly" as const })),
    ...legalPages.map((path) => ({ path, priority: 0.5, changeFrequency: "yearly" as const })),
    ...toolsSubPages.map((path) => ({ path, priority: 0.7, changeFrequency: "monthly" as const }))
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? ("daily" as const) : changeFrequency,
    priority
  }));
}

function resolveSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://imagetopromptgenerator.one";
  try {
    return new URL(candidate).toString().replace(/\/+$/, "");
  } catch {
    return "https://imagetopromptgenerator.one";
  }
}
