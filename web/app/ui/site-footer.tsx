"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMarkIcon } from "./icons";

type SiteFooterProps = {
  id?: string;
};

export function SiteFooter({ id = "site-footer" }: SiteFooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterMessage("Please enter an email address.");
      return;
    }
    setNewsletterMessage("Subscribed. Thank you for joining our newsletter.");
    setNewsletterEmail("");
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
          </div>

          <div className="footer-newsletter" id="newsletter">
            <p className="footer-newsletter-title">Subscribe to our newsletter</p>
            <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
              <button type="submit">Subscribe</button>
            </form>
            {newsletterMessage ? <p className="footer-newsletter-note">{newsletterMessage}</p> : null}
          </div>
        </div>

        <div className="footer-simple-top">
          <div className="footer-simple-links-grid" aria-label="Footer links">
            <nav className="footer-simple-link-col" aria-label="Product">
              <p className="footer-simple-link-heading">Product</p>
              <div className="footer-simple-links">
                <Link href="/">Image to Prompt</Link>
                <Link href="/image-to-prompt-converter">Image to Prompt Converter</Link>
                <Link href="/image-prompt-generator">Image Prompt Generator</Link>
                <Link href="/bulk">Bulk Image to Prompt</Link>
                <Link href="/pricing">Pricing</Link>
              </div>
            </nav>

            <nav className="footer-simple-link-col" aria-label="AI Tools">
              <p className="footer-simple-link-heading">AI Tools</p>
              <div className="footer-simple-links">
                <Link href="/gemini-ai-photo-prompt">Gemini AI Photo Prompt</Link>
                <Link href="/ai-gemini-photo-prompt">AI Gemini Photo Prompt</Link>
                <Link href="/google-gemini-ai-photo-prompt">Google Gemini AI Photo Prompt</Link>
                <Link href="/gemini-prompt">Gemini Prompt</Link>
                <Link href="/chrome-extension">Chrome Extension</Link>
              </div>
            </nav>

            <nav className="footer-simple-link-col" aria-label="AI Model Pages">
              <p className="footer-simple-link-heading">AI Model Pages</p>
              <div className="footer-simple-links">
                <Link href="/chatgpt-image-to-prompt">ChatGPT Image to Prompt</Link>
                <Link href="/copilot-image-to-prompt">Copilot Image to Prompt</Link>
                <Link href="/meta-ai-image-to-prompt">Meta AI Image to Prompt</Link>
                <Link href="/grok-image-to-prompt">Grok Image to Prompt</Link>
                <Link href="/leonardo-image-to-prompt">Leonardo Image to Prompt</Link>
                <Link href="/midjourney-image-to-prompt">Midjourney Image to Prompt</Link>
              </div>
            </nav>

            <nav className="footer-simple-link-col" aria-label="Company">
              <p className="footer-simple-link-heading">Company</p>
              <div className="footer-simple-links">
                <Link href="/faqs">FAQs</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/about">About</Link>
                <Link href="/security">Security</Link>
                <Link href="/accessibility">Accessibility</Link>
              </div>
            </nav>

            <nav className="footer-simple-link-col" aria-label="Legal and Support">
              <p className="footer-simple-link-heading">Legal and Support</p>
              <div className="footer-simple-links">
                <Link href="/privacy">Privacy Policy</Link>
                <Link href="/terms">Terms of Service</Link>
                <Link href="/cookies">Cookie Settings</Link>
                <Link href="mailto:imagetopromptgenerate@gmail.com?subject=I%20need%20help%20for%20Image%20to%20Prompt">
                  Help Center
                </Link>
              </div>
            </nav>
          </div>
        </div>

        <div className="footer-simple-divider" />

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

        <div className="footer-simple-legal-row">
          <div className="footer-simple-legal">
            <p>© 2026 Image to Prompt Generator. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
