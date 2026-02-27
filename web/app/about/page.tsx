import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "About | Image to Prompt",
  description:
    "Learn about Image to Prompt, our product mission, and how we help teams generate consistent prompts from images.",
  keywords: ["about image to prompt", "image prompt generator", "ai prompt workflow", "company info"],
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "About Image to Prompt",
    description: "See our mission, product focus, and how to contact the team.",
    url: "/about",
    type: "website"
  }
};

const sections: LegalSection[] = [
  {
    title: "Who we are",
    paragraphs: [
      "Image to Prompt is a focused product built to turn visual inputs into clear text prompts for modern AI tools.",
      "We serve creators, product teams, growth teams, and operators who need prompt output that is fast, consistent, and practical."
    ]
  },
  {
    title: "What we do",
    paragraphs: [
      "Our web app and extension let users upload or click an image and generate ready-to-use prompts in seconds.",
      "We also provide usage controls, account plans, and saved prompt workflows so teams can repeat outcomes without manual rewriting."
    ]
  },
  {
    title: "Product principles",
    bullets: [
      "Speed first: fast prompt generation with clear feedback.",
      "Simple controls: minimal UI friction and predictable actions.",
      "Responsible handling: secure account and billing flows.",
      "Consistency: output format designed for repeated team usage."
    ]
  },
  {
    title: "Contact",
    paragraphs: [
      "For partnerships, support, legal, or compliance questions, email us at abhi@argro.co."
    ]
  }
];

export default function AboutPage() {
  return (
    <LegalPageShell
      eyebrow="Company"
      title="About Image to Prompt"
      subtitle="Neat, practical tooling for generating better prompts from images."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
