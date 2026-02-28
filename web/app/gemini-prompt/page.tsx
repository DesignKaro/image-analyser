import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Gemini Prompt From Image – Get a Gemini Prompt From Any Photo",
  description:
    "Have an image but need a Gemini prompt? Upload the photo, get a text prompt, paste it into Google Gemini. Free image-to-prompt tool.",
  keywords: [
    "gemini prompt",
    "gemini prompt from image",
    "image to gemini prompt",
    "get gemini prompt",
    "gemini image prompt"
  ],
  alternates: {
    canonical: "/gemini-prompt"
  },
  openGraph: {
    title: "Gemini Prompt From Image",
    description: "Upload an image, get a Gemini prompt. Paste into Google Gemini and go.",
    url: "/gemini-prompt",
    type: "website"
  }
};

export default function GeminiPromptPage() {
  return <ImageAnalyserLanding variant="gemini-prompt" />;
}
