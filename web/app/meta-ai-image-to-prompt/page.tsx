import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Meta AI Image to Prompt – Generate Prompt Text From Photos",
  description:
    "Generate a Meta AI-ready prompt from any image. Upload your photo, produce structured prompt text, and reuse it for Meta AI tasks.",
  keywords: [
    "meta ai image to prompt",
    "meta ai prompt from image",
    "image to meta ai prompt",
    "meta image prompt generator",
    "convert photo to meta ai prompt"
  ],
  alternates: {
    canonical: "/meta-ai-image-to-prompt"
  },
  openGraph: {
    title: "Meta AI Image to Prompt",
    description: "Upload a photo and generate prompt text for Meta AI.",
    url: "/meta-ai-image-to-prompt",
    type: "website"
  }
};

export default function MetaAiImageToPromptPage() {
  return <ImageAnalyserLanding variant="meta-ai-image-to-prompt" />;
}
