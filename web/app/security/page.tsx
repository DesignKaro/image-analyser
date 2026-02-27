import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "Security | Image to Prompt",
  description:
    "Learn about Image to Prompt security controls, account protections, and how to report potential vulnerabilities.",
  keywords: ["security", "account protection", "data security", "vulnerability reporting"],
  alternates: {
    canonical: "/security"
  },
  openGraph: {
    title: "Security - Image to Prompt",
    description: "How we approach platform and account security.",
    url: "/security",
    type: "article"
  }
};

const sections: LegalSection[] = [
  {
    title: "Security focus",
    paragraphs: [
      "Security is treated as a product requirement across authentication, billing, data handling, and service operations."
    ]
  },
  {
    title: "Controls in place",
    bullets: [
      "Authenticated API access for account-scoped endpoints.",
      "Role-based access controls for admin and superadmin functionality.",
      "Session handling and token validation for account protection.",
      "Operational monitoring and server-side error handling for reliability."
    ]
  },
  {
    title: "User responsibilities",
    bullets: [
      "Use strong passwords and keep account credentials private.",
      "Sign out from shared devices.",
      "Report suspicious account activity immediately."
    ]
  },
  {
    title: "Vulnerability reporting",
    paragraphs: [
      "If you identify a security concern, disclose it responsibly by emailing abhi@argro.co with reproduction details and impact."
    ]
  },
  {
    title: "Response",
    paragraphs: [
      "We review reports promptly, validate severity, and prioritize remediation according to risk and user impact."
    ]
  }
];

export default function SecurityPage() {
  return (
    <LegalPageShell
      eyebrow="Trust"
      title="Security"
      subtitle="Practical controls for secure accounts, billing, and platform operations."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
