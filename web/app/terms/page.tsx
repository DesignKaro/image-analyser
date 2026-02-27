import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Image to Prompt",
  description:
    "Review the terms that govern use of Image to Prompt, including account use, plans, billing, and service limits.",
  keywords: ["terms of service", "usage terms", "billing terms", "image to prompt terms"],
  alternates: {
    canonical: "/terms"
  },
  openGraph: {
    title: "Terms of Service - Image to Prompt",
    description: "The rules and conditions for using Image to Prompt.",
    url: "/terms",
    type: "article"
  }
};

const sections: LegalSection[] = [
  {
    title: "Acceptance",
    paragraphs: [
      "By accessing or using Image to Prompt, you agree to these terms and our related legal policies."
    ]
  },
  {
    title: "Accounts and access",
    bullets: [
      "You are responsible for account credentials and activity under your account.",
      "You must provide accurate account information.",
      "We may suspend access for abuse, fraud, policy violation, or security risk."
    ]
  },
  {
    title: "Plans, credits, and billing",
    paragraphs: [
      "Plans include monthly limits unless marked as unlimited. Credits reset according to plan rules.",
      "Paid plan upgrades, cancellations, and billing operations are governed by the checkout and payment flow shown in product."
    ]
  },
  {
    title: "Prohibited use",
    bullets: [
      "Using the service for unlawful, deceptive, or abusive activities.",
      "Attempting to bypass limits, security controls, or access restrictions.",
      "Interfering with service stability, integrity, or availability."
    ]
  },
  {
    title: "Service availability and updates",
    paragraphs: [
      "We may update, improve, or modify features at any time. We aim for reliability but do not guarantee uninterrupted availability."
    ]
  },
  {
    title: "Liability",
    paragraphs: [
      "To the maximum extent permitted by law, service is provided as is without warranties of specific outcomes."
    ]
  },
  {
    title: "Contact",
    paragraphs: ["Questions regarding these terms can be sent to abhi@argro.co."]
  }
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Clear conditions for account usage, plans, and billing."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
