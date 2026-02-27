import type { Metadata } from "next";
import { ImageAnalyserLanding } from "./ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Free Image to Prompt Converter Online (AI Tool)",
  description:
    "Convert image to prompt online in seconds. Upload JPG, PNG, or WebP, generate AI-ready prompts, and use them in ChatGPT, Midjourney, and more. Try it free.",
  keywords: [
    "image to prompt converter",
    "convert image to prompt online",
    "image to prompt online",
    "ai prompt generator from image",
    "free image prompt tool"
  ],
  alternates: {
    canonical: "/image-to-prompt-converter"
  },
  openGraph: {
    title: "Free Image to Prompt Converter Online (AI Tool)",
    description:
      "Upload an image and generate structured prompts instantly for ChatGPT, Midjourney, and other AI tools.",
    url: "/image-to-prompt-converter",
    type: "website"
  }
};

export default function HomePage() {
  return <ImageAnalyserLanding />;
}
