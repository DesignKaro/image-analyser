"use client";

import Link from "next/link";
import { BrandMarkIcon } from "./icons";

type SiteFooterProps = {
  id?: string;
};

export function SiteFooter({ id = "site-footer" }: SiteFooterProps) {
  function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <footer className="footer footer-simple" id={id}>
      <div className="container footer-simple-inner">
        <div className="footer-simple-head">
          <div className="footer-simple-brand-block">
            <Link className="footer-simple-brand" href="/" aria-label="Image to Prompt brand">
              <BrandMarkIcon className="footer-simple-mark" />
              <span className="footer-simple-brand-text">
                <span className="footer-simple-brand-main">Image to Prompt</span>
                <span className="footer-simple-brand-sub">AI Image Prompt Generator</span>
              </span>
            </Link>
            <p className="footer-simple-tagline">
              Turn any image into AI-ready prompts for ChatGPT, Gemini, Grok, Leonardo, and more.
            </p>
          </div>

          <div className="footer-newsletter" id="newsletter">
            <p className="footer-newsletter-title">Subscribe to our newsletter</p>
            <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input type="email" placeholder="Enter your email" autoComplete="email" required />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-simple-top">
          <nav className="footer-simple-links" aria-label="Product and tool pages">
            <Link href="/">Image to Prompt</Link>
            <Link href="/image-to-prompt-converter">Image to Prompt Converter</Link>
            <Link href="/image-prompt-generator">Image Prompt Generator</Link>
            <Link href="/gemini-ai-photo-prompt">Gemini AI Photo Prompt</Link>
            <Link href="/ai-gemini-photo-prompt">AI Gemini Photo Prompt</Link>
            <Link href="/google-gemini-ai-photo-prompt">Google Gemini AI Photo Prompt</Link>
            <Link href="/gemini-prompt">Gemini Prompt</Link>
            <Link href="/bulk">Bulk Image to Prompt</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/chrome-extension">Chrome Extension</Link>
            <Link href="/faqs">FAQs</Link>
            <Link href="/contact">Contact</Link>
            <Link href="mailto:abhi@argro.co?subject=I%20need%20help%20for%20Image%20to%20Prompt">Help Center</Link>
          </nav>
        </div>

        <div className="footer-simple-divider" />

        <div className="footer-simple-bottom">
          <nav className="footer-simple-links" aria-label="Company">
            <Link href="/about">About</Link>
          </nav>
          <nav className="footer-simple-links footer-simple-links-right" aria-label="Legal and policies">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Settings</Link>
            <Link href="/accessibility">Accessibility</Link>
            <Link href="/security">Security</Link>
          </nav>
        </div>

        <div className="footer-simple-copy">
          <p>
            Image to Prompt Generator helps creators, marketers, and product teams turn visuals into structured
            prompts faster. Upload one image and produce reusable text instructions optimized for modern AI models.
          </p>
          <p>
            Use our image to prompt workflow to generate high-quality AI prompt from image inputs, streamline
            creative iteration, and maintain consistent output quality across ChatGPT, Gemini, Grok, Leonardo, and
            more.
          </p>
        </div>

        <div className="footer-simple-legal">
          <p>© 2026 Image to Prompt Generator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
