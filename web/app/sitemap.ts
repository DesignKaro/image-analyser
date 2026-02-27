import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = resolveSiteUrl();
  const now = new Date();
  const routes = [
    "/",
    "/image-to-prompt-converter",
    "/chrome-extension",
    "/pricing",
    "/bulk",
    "/profile",
    "/billing",
    "/saved-prompts",
    "/about",
    "/privacy",
    "/terms",
    "/cookies",
    "/accessibility",
    "/security",
    "/tools/ai-image-generator",
    "/tools/prompt-enhancer",
    "/tools/background-remover",
    "/tools/image-upscaler"
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7
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
