import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Image Prompt Generator – Free Photo to Prompt Tool",
  description:
    "Free image prompt generator: upload a photo and get a text prompt. Paste it into ChatGPT, Midjourney, Gemini, or any AI. No signup to try.",
  keywords: [
    "image prompt generator",
    "image prompt prompt generator",
    "photo to prompt generator",
    "free image prompt generator",
    "prompt generator from image"
  ],
  alternates: {
    canonical: "/image-prompt-generator"
  },
  openGraph: {
    title: "Image Prompt Generator – Free and Simple",
    description: "Upload an image, get a prompt. Use it in any AI. Same tool as the main converter.",
    url: "/image-prompt-generator",
    type: "website"
  }
};

export default function ImagePromptGeneratorPage() {
  return <ImageAnalyserLanding variant="image-prompt-generator" />;
}
