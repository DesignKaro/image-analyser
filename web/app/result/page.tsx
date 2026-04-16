"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  FileTextIcon,
  ImageIcon,
  UploadIcon
} from "../ui/icons";
import { SiteFooter } from "../ui/site-footer";

type StoredResult = {
  imageDataUrl: string;
  imageName: string;
  description: string;
};

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

      <SiteFooter id="result-footer" />
    </div>
  );
}
