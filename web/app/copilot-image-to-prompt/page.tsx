import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Copilot Image to Prompt – Convert Images Into Copilot Prompts",
  description:
    "Turn any photo into a Copilot-ready prompt. Upload an image, generate clean prompt text, and use it in Microsoft Copilot workflows.",
  keywords: [
    "copilot image to prompt",
    "microsoft copilot image prompt",
    "copilot prompt from image",
    "image to copilot prompt",
    "copilot prompt generator"
  ],
  alternates: {
    canonical: "/copilot-image-to-prompt"
  },
  openGraph: {
    title: "Copilot Image to Prompt",
    description: "Convert image references into prompts for Microsoft Copilot.",
    url: "/copilot-image-to-prompt",
    type: "website"
  }
};

export default function CopilotImageToPromptPage() {
  return <ImageAnalyserLanding variant="copilot-image-to-prompt" />;
}
