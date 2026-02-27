"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  ChromeIcon,
  FileTextIcon,
  ImageIcon,
  PlayIcon,
  SparkIcon,
  UploadIcon
} from "../ui/icons";

type StoredResult = {
  imageDataUrl: string;
  imageName: string;
  description: string;
};

const EXTENSION_DOWNLOAD_HREF = "/extension.zip";

export default function ResultPage() {
  const [result, setResult] = useState<StoredResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem("ipg:last-result");
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredResult>;
      if (
        typeof parsed.imageDataUrl === "string" &&
        typeof parsed.imageName === "string" &&
        typeof parsed.description === "string"
      ) {
        setResult({
          imageDataUrl: parsed.imageDataUrl,
          imageName: parsed.imageName,
          description: parsed.description
        });
      }
    } catch {
      // Ignore invalid storage payload
    }
  }, []);

  const hasResult = useMemo(() => Boolean(result?.imageDataUrl && result?.description), [result]);

  async function onCopy() {
    if (!result?.description) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.description);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="site-shell">
      <header
        className="top-nav is-scrolled"
        style={{ "--nav-scroll-progress": 1 } as CSSProperties}
      >
        <div className="container nav-inner">
          <a className="rb-brand" href="/" aria-label="Image to Prompt Generator">
            <span className="ipg-brand">
              <span className="ipg-brand-text">Image → Prompt</span>
              <span className="ipg-brand-flow" aria-hidden="true">
                <ImageIcon className="ipg-flow-icon" />
                <ArrowRightIcon className="ipg-flow-arrow" />
                <FileTextIcon className="ipg-flow-icon" />
              </span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <a href="/#upload">Image to Prompt</a>
            <a href="/bulk">Bulk</a>
            <a href="/chrome-extension">Extension</a>
            <a href="/pricing">Pricing</a>
            <a href="/faqs">FAQs</a>
          </nav>

          <div className="nav-auth">
            <a className="nav-login" href="#login">
              Log in
            </a>
            <button className="nav-signup" type="button">
              Sign up
              <ArrowRightIcon className="auth-icon" />
            </button>
          </div>
        </div>
      </header>

      <main className="result-page-main">
        <section className="container result-hero">
          {hasResult ? (
            <>
              <div className="result-image-col">
                <h1>Uploaded Image</h1>
                <figure className="result-image-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={result?.imageDataUrl} alt={result?.imageName || "Uploaded image"} />
                  <figcaption>{result?.imageName}</figcaption>
                </figure>
              </div>

              <div className="result-output-col" role="status" aria-live="polite">
                <div className="result-output-head">
                  <h2>
                    <FileTextIcon className="label-icon" />
                    GPT Prompt Output
                  </h2>
                  <button type="button" onClick={onCopy}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="result-output-box">
                  <p>{result?.description}</p>
                </div>
                <div className="result-page-actions">
                  <Link href="/" className="upload-button">
                    <UploadIcon className="button-icon" />
                    Upload Another Image
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="result-empty-state">
              <h1>No generated result found</h1>
              <p>Upload an image and generate a prompt first.</p>
              <Link href="/" className="upload-button">
                <UploadIcon className="button-icon" />
                Go to Upload
              </Link>
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <section className="footer-cta" id="how">
          <div className="footer-grid-pattern" aria-hidden="true" />
          <div className="footer-cta-inner">
            <SparkIcon className="cta-spark-icon" />
            <h2>Let&apos;s get started on something great</h2>
            <p>Join over 4,000+ startups already growing with Image Analyser.</p>

            <div className="cta-actions">
              <button type="button" className="cta-btn cta-btn-outline">
                <PlayIcon className="button-icon" />
                View demo
              </button>
              <button type="button" className="cta-btn cta-btn-primary">
                Get started
                <ArrowRightIcon className="button-icon" />
              </button>
            </div>
          </div>
        </section>

        <section className="footer-links-wrap">
          <div className="container footer-links-grid">
            <div className="footer-col" id="pricing">
              <h3>Product</h3>
              <a href="#overview">Overview</a>
              <a href="#features">Features</a>
              <a href="#solutions">
                Solutions <span className="new-pill">New</span>
              </a>
              <a href="#tutorials">Tutorials</a>
              <a href="#pricing-plans">Pricing</a>
              <a href="#releases">Releases</a>
            </div>

            <div className="footer-col">
              <h3>Company</h3>
              <a href="#about">About us</a>
              <a href="#careers">Careers</a>
              <a href="#press">Press</a>
              <a href="#news">News</a>
              <a href="#media-kit">Media kit</a>
              <a href="#contact-company">Contact</a>
            </div>

            <div className="footer-col" id="api">
              <h3>Resources</h3>
              <a href="#blog">Blog</a>
              <a href="#newsletter">Newsletter</a>
              <a href="#events">Events</a>
              <a href="#help">Help centre</a>
              <a href="#guides">Tutorials</a>
              <a href="#support">Support</a>
            </div>

            <div className="footer-col">
              <h3>Social</h3>
              <a href="#twitter">Twitter</a>
              <a href="#linkedin">LinkedIn</a>
              <a href="#facebook">Facebook</a>
              <a href="#github">GitHub</a>
              <a href="#angellist">AngelList</a>
              <a href="#dribbble">Dribbble</a>
            </div>

            <div className="footer-col">
              <h3>Legal</h3>
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
              <a href="#cookies">Cookies</a>
              <a href="#licenses">Licenses</a>
              <a href="#settings">Settings</a>
              <a href="#contact-legal">Contact</a>
            </div>

            <div className="footer-col footer-app-col">
              <h3>Get extension</h3>
              <a
                href={EXTENSION_DOWNLOAD_HREF}
                className="store-badge chrome-badge"
                aria-label="Download Chrome Extension"
                download
              >
                <span className="store-badge-row">
                  <ChromeIcon className="store-icon" />
                  <strong>Chrome Extension</strong>
                </span>
                <span>Download now</span>
              </a>
            </div>
          </div>

          <div className="container footer-bottom">
            <a className="footer-brand" href="/" aria-label="Image to Prompt Generator">
              <span className="ipg-brand">
                <span className="ipg-brand-text">IPG</span>
                <span className="ipg-brand-flow" aria-hidden="true">
                  <ImageIcon className="ipg-flow-icon" />
                  <ArrowRightIcon className="ipg-flow-arrow" />
                  <FileTextIcon className="ipg-flow-icon" />
                </span>
              </span>
            </a>
            <p>(c) 2077 Image Analyser. All rights reserved.</p>
          </div>
        </section>
      </footer>
    </div>
  );
}
