import type { Metadata } from "next";
import localFont from "next/font/local";
import { LocaleProvider } from "./ui/LocaleProvider";
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
  title: "Image Analyser | Web",
  description: "Upload an image and generate a GPT description using the same backend as the extension.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg"
  }
};

function resolveMetadataBase() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://img.connectiqworld.cloud";
  try {
    return new URL(candidate);
  } catch {
    return new URL("https://img.connectiqworld.cloud");
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
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
