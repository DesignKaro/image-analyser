import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Google Gemini AI Photo Prompt – Image to Prompt for Gemini",
  description:
    "Turn any image into a Google Gemini AI photo prompt. Upload a photo, get a clean text prompt, paste it into Gemini. Same tool, free to try.",
  keywords: [
    "google gemini ai photo prompt",
    "gemini ai photo prompt",
    "google gemini photo prompt",
    "image to prompt gemini",
    "photo prompt for gemini"
  ],
  alternates: {
    canonical: "/google-gemini-ai-photo-prompt"
  },
  openGraph: {
    title: "Google Gemini AI Photo Prompt – From Any Image",
    description: "Get a text prompt for Google Gemini from any photo. Upload, generate, paste.",
    url: "/google-gemini-ai-photo-prompt",
    type: "website"
  }
};

export default function GoogleGeminiAiPhotoPromptPage() {
  return <ImageAnalyserLanding variant="google-gemini-ai-photo-prompt" />;
}
