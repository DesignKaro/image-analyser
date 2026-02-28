import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Gemini AI Photo Prompt – Turn Any Image Into a Gemini-Ready Prompt",
  description:
    "Get a Gemini AI photo prompt from any image. Upload a photo, get a clean text prompt, then paste it into Google Gemini. Same tool, same flow—free to try.",
  keywords: [
    "gemini ai photo prompt",
    "ai gemini photo prompt",
    "google gemini photo prompt",
    "gemini prompt from image",
    "photo to prompt gemini"
  ],
  alternates: {
    canonical: "/gemini-ai-photo-prompt"
  },
  openGraph: {
    title: "Gemini AI Photo Prompt – From Any Image",
    description: "Upload a photo, get a text prompt for Gemini. Use it for image prompts, chat, or briefs.",
    url: "/gemini-ai-photo-prompt",
    type: "website"
  }
};

export default function GeminiAiPhotoPromptPage() {
  return <ImageAnalyserLanding variant="gemini-ai-photo-prompt" />;
}
