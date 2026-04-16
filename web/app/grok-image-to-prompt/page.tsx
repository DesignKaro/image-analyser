import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Grok Image to Prompt – Convert Images Into Grok Prompts",
  description:
    "Convert an image into a Grok-ready prompt in seconds. Upload your photo, generate detailed text prompts, and paste them into Grok.",
  keywords: [
    "grok image to prompt",
    "grok prompt from image",
    "image to grok prompt",
    "grok photo prompt generator",
    "convert image for grok"
  ],
  alternates: {
    canonical: "/grok-image-to-prompt"
  },
  openGraph: {
    title: "Grok Image to Prompt",
    description: "Upload an image and generate prompt text for Grok.",
    url: "/grok-image-to-prompt",
    type: "website"
  }
};

export default function GrokImageToPromptPage() {
  return <ImageAnalyserLanding variant="grok-image-to-prompt" />;
}
