import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "Cookie Settings | Image to Prompt",
  description:
    "Understand how cookies and similar technologies are used on Image to Prompt and how to manage cookie preferences.",
  keywords: ["cookie policy", "cookie settings", "site preferences", "tracking settings"],
  alternates: {
    canonical: "/cookies"
  },
  openGraph: {
    title: "Cookie Settings - Image to Prompt",
    description: "How we use cookies and how you can manage preferences.",
    url: "/cookies",
    type: "article"
  }
};

const sections: LegalSection[] = [
  {
    title: "What cookies are used for",
    paragraphs: [
      "Cookies and similar technologies help keep sessions active, improve performance, and maintain product preferences."
    ]
  },
  {
    title: "Types of cookies",
    bullets: [
      "Essential cookies for core product functionality.",
      "Preference cookies for UI and language behavior.",
      "Security cookies to help detect suspicious activity.",
      "Analytics cookies for aggregated usage insights."
    ]
  },
  {
    title: "Managing cookies",
    paragraphs: [
      "You can control cookies through browser settings. Disabling some cookie categories may affect sign-in, session continuity, or feature behavior."
    ]
  },
  {
    title: "Third-party services",
    paragraphs: [
      "Payment and authentication extensions may set their own cookies subject to their provider policies."
    ]
  },
  {
    title: "Contact",
    paragraphs: ["For cookie or preference questions, email abhi@argro.co."]
  }
];

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Cookie Settings"
      subtitle="How cookies are used and how you can manage them."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
