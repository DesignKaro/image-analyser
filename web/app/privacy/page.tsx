import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Image to Prompt",
  description:
    "Read how Image to Prompt collects, uses, stores, and protects personal information and service data.",
  keywords: ["privacy policy", "data handling", "image to prompt privacy", "user data rights"],
  alternates: {
    canonical: "/privacy"
  },
  openGraph: {
    title: "Privacy Policy - Image to Prompt",
    description: "Understand what data we collect and how it is used.",
    url: "/privacy",
    type: "article"
  }
};

const sections: LegalSection[] = [
  {
    title: "Data we collect",
    bullets: [
      "Account information such as email and authentication details.",
      "Service usage data such as generation events, quotas, and billing actions.",
      "Prompt outputs and saved prompt records when users choose to save them.",
      "Basic technical data needed for security, reliability, and abuse prevention."
    ]
  },
  {
    title: "How we use data",
    paragraphs: [
      "We use collected data to deliver the product, manage plans and credits, secure accounts, troubleshoot issues, and improve service quality.",
      "We do not sell personal information."
    ]
  },
  {
    title: "Storage and retention",
    paragraphs: [
      "Data is stored only for operational and legal purposes. We retain account and billing records as required for support, auditing, and compliance.",
      "Saved prompts remain available in your account until deleted by you or removed according to retention policy."
    ]
  },
  {
    title: "Your controls",
    bullets: [
      "You can view and manage account details in your profile.",
      "You can delete saved prompts from the saved prompts page.",
      "You can request account-related privacy support by contacting us."
    ]
  },
  {
    title: "Contact for privacy requests",
    paragraphs: [
      "For privacy or data requests, email abhi@argro.co with the subject line Privacy Request."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your data."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
