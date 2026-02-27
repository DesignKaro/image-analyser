import type { Metadata } from "next";
import { LegalPageShell, type LegalSection } from "../ui/legal-page-shell";

export const metadata: Metadata = {
  title: "Accessibility | Image to Prompt",
  description:
    "Read the Image to Prompt accessibility commitment and how to report issues or request assistance.",
  keywords: ["accessibility statement", "inclusive design", "wcag", "assistive technology"],
  alternates: {
    canonical: "/accessibility"
  },
  openGraph: {
    title: "Accessibility - Image to Prompt",
    description: "Our commitment to inclusive and usable product experience.",
    url: "/accessibility",
    type: "article"
  }
};

const sections: LegalSection[] = [
  {
    title: "Our commitment",
    paragraphs: [
      "We aim to keep Image to Prompt usable and inclusive for people using assistive technologies and diverse input methods."
    ]
  },
  {
    title: "Design and engineering approach",
    bullets: [
      "Semantic page structure and readable content hierarchy.",
      "Keyboard-friendly controls for core actions.",
      "Color contrast and interactive focus visibility considerations.",
      "Continuous refinement based on real usage feedback."
    ]
  },
  {
    title: "Known limitations",
    paragraphs: [
      "Some advanced workflows may still require iterative improvements. We prioritize fixes that block core tasks."
    ]
  },
  {
    title: "Request support",
    paragraphs: [
      "If you encounter an accessibility barrier, email abhi@argro.co with details of the page, action, and device or assistive setup used."
    ]
  }
];

export default function AccessibilityPage() {
  return (
    <LegalPageShell
      eyebrow="Trust"
      title="Accessibility"
      subtitle="Building a product that is usable, readable, and inclusive."
      lastUpdated="February 27, 2026"
      sections={sections}
    />
  );
}
