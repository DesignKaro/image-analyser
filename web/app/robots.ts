import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/"
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}

function resolveSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://img.connectiqworld.cloud";
  try {
    return new URL(candidate).toString().replace(/\/+$/, "");
  } catch {
    return "https://img.connectiqworld.cloud";
  }
}
