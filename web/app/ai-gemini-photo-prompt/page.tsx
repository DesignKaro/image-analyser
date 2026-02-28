import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "AI Gemini Photo Prompt – Turn Photos Into Gemini Prompts",
  description:
    "Get an AI Gemini photo prompt from any image. Upload a photo, get a text prompt, paste it into Google Gemini. Free to try, no signup required.",
  keywords: [
    "ai gemini photo prompt",
    "gemini ai photo prompt",
    "gemini photo prompt",
    "photo to prompt gemini",
    "ai prompt from image gemini"
  ],
  alternates: {
    canonical: "/ai-gemini-photo-prompt"
  },
  openGraph: {
    title: "AI Gemini Photo Prompt – From Any Photo",
    description: "Upload a photo, get an AI-written prompt for Gemini. Paste and use in Google Gemini.",
    url: "/ai-gemini-photo-prompt",
    type: "website"
  }
};

export default function AiGeminiPhotoPromptPage() {
  return <ImageAnalyserLanding variant="ai-gemini-photo-prompt" />;
}
