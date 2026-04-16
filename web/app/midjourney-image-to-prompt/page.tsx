import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Midjourney Image to Prompt – Convert Photos Into Midjourney Prompts",
  description:
    "Turn any image into a Midjourney-ready prompt. Upload a photo, generate detailed prompt text, and use it in your Midjourney workflow.",
  keywords: [
    "midjourney image to prompt",
    "midjourney prompt from image",
    "image to midjourney prompt",
    "midjourney prompt generator",
    "convert photo to midjourney prompt"
  ],
  alternates: {
    canonical: "/midjourney-image-to-prompt"
  },
  openGraph: {
    title: "Midjourney Image to Prompt",
    description: "Generate Midjourney prompt text from any uploaded image.",
    url: "/midjourney-image-to-prompt",
    type: "website"
  }
};

export default function MidjourneyImageToPromptPage() {
  return <ImageAnalyserLanding variant="midjourney-image-to-prompt" />;
}
