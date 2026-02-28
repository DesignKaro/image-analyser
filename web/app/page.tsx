import type { Metadata } from "next";
import { ImageAnalyserLanding } from "./ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Image to Prompt – Free Generator & Converter",
  description:
    "Turn any image into an AI-ready prompt. Upload a photo, get a text prompt for ChatGPT, Midjourney, Gemini, and more. Free to try, no signup.",
  keywords: [
    "image to prompt",
    "image to prompt converter",
    "convert image to prompt online",
    "image to prompt generator",
    "free image prompt tool"
  ],
  alternates: {
    canonical: "/image-to-prompt-converter"
  },
  openGraph: {
    title: "Image to Prompt – Free Generator & Converter",
    description:
      "Upload an image and get a text prompt for any AI. ChatGPT, Midjourney, Gemini, and more.",
    url: "/image-to-prompt-converter",
    type: "website"
  }
};

export default function HomePage() {
  return <ImageAnalyserLanding />;
}
