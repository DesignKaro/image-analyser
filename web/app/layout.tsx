import type { Metadata } from "next";
import localFont from "next/font/local";
import { LocaleProvider } from "./ui/LocaleProvider";
import { StickyShare } from "./ui/StickyShare";
import "./globals.css";

const geoFont = localFont({
  src: [
    {
      path: "../public/fonts/geo-wf-3.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../public/fonts/geo-wf-4.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "../public/fonts/geo-wf-5.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../public/fonts/geo-wf-6.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-geo",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Image to Prompt – Free Image to Prompt Generator Online",
    template: "%s | Image to Prompt"
  },
  description:
    "Free image to prompt generator: upload an image and get AI-ready prompts for ChatGPT, Midjourney, Gemini, and more. Convert image to prompt online in seconds.",
  keywords: ["image to prompt", "image to prompt generator", "image to prompt ai", "convert image to prompt online", "free image to prompt converter"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    images: [{ url: "/home-hero-icons.png", width: 1200, height: 630, alt: "Image to Prompt – turn images into AI prompts" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to Prompt – Free Image to Prompt Generator Online",
    description: "Upload an image and get AI-ready prompts for ChatGPT, Midjourney, Gemini, and more."
  }
};

function resolveMetadataBase() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://imagetopromptgenerator.one";
  try {
    return new URL(candidate);
  } catch {
    return new URL("https://imagetopromptgenerator.one");
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geoFont.variable}>
        <LocaleProvider>
          {children}
          <StickyShare />
        </LocaleProvider>
      </body>
    </html>
  );
}
