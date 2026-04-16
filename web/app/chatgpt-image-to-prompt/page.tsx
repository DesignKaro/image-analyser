import type { Metadata } from "next";
import { ImageAnalyserLanding } from "../ui/image-analyser-landing";

export const metadata: Metadata = {
  title: "ChatGPT Image to Prompt – Turn Photos Into ChatGPT Prompts",
  description:
    "Convert any image to a ChatGPT-ready prompt. Upload a photo, get structured prompt text, and paste it into ChatGPT in seconds.",
  keywords: [
    "chatgpt image to prompt",
    "chatgpt prompt from image",
    "image to chatgpt prompt",
    "convert photo to chatgpt prompt",
    "chatgpt image prompt generator"
  ],
  alternates: {
    canonical: "/chatgpt-image-to-prompt"
  },
  openGraph: {
    title: "ChatGPT Image to Prompt",
    description: "Upload an image and generate a ChatGPT-ready prompt instantly.",
    url: "/chatgpt-image-to-prompt",
    type: "website"
  }
};

export default function ChatgptImageToPromptPage() {
  return <ImageAnalyserLanding variant="chatgpt-image-to-prompt" />;
}
