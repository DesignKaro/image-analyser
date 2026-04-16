import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "Leonardo Image to Prompt – Turn Photos Into Leonardo Prompts",
  description:
    "Convert image references into Leonardo-ready prompt text. Upload a photo, generate structured prompts, and use them in Leonardo projects.",
  keywords: [
    "leonardo image to prompt",
    "leonardo prompt from image",
    "image to leonardo prompt",
    "leonardo ai image prompt",
    "convert photo for leonardo"
  ],
  alternates: {
    canonical: "/leonardo-image-to-prompt"
  },
  openGraph: {
    title: "Leonardo Image to Prompt",
    description: "Generate Leonardo-ready prompt text from any uploaded photo.",
    url: "/leonardo-image-to-prompt",
    type: "website"
  }
};

export default function LeonardoImageToPromptPage() {
  return <ImageAnalyserLanding variant="leonardo-image-to-prompt" />;
}
