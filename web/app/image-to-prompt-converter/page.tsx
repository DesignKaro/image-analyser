import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Free Image to Prompt Converter Online (AI Tool)",
  description:
    "Use our free image to prompt converter online. Upload an image, generate AI-ready prompts, and use them for ChatGPT, Midjourney, Gemini, and more.",
  keywords: [
    "free image to prompt converter online",
    "image to prompt converter tool",
    "how to convert image to prompt",
    "prompt from image generator",
    "ai image prompt converter"
  ],
  alternates: {
    canonical: "/image-to-prompt-converter"
  },
  openGraph: {
    title: "Free Image to Prompt Converter Online (AI Tool)",
    description:
      "Convert image to prompt in one click and generate cleaner AI instructions for your creative workflow.",
    url: "/image-to-prompt-converter",
    type: "website"
  }
};

export default function ImageToPromptConverterPage() {
  return <ImageAnalyserLanding variant="image-to-prompt-converter" />;
}
