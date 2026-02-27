"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import {
  DEFAULT_PRICING_CONTEXT,
  PRICING_CARDS,
  formatCurrencySubunits
} from "../lib/pricing";
import type { PricingContextSnapshot, UserPlanCode } from "../lib/saas-types";
import { BrandMarkIcon, CheckIcon } from "../ui/icons";

function normalizePricingContext(value: unknown): PricingContextSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const currency = typeof v.currency === "string" && /^[A-Za-z]{3}$/.test(v.currency.trim())
    ? v.currency.trim().toUpperCase()
    : "";
  const country = typeof v.country === "string" && v.country.trim()
    ? String(v.country).trim().toUpperCase()
    : "UNKNOWN";
  const plans = Array.isArray(v.plans) ? v.plans : [];
  const normalizedPlans = plans
    .filter((p): p is Record<string, unknown> => p && typeof p === "object")
    .map((p) => {
      const code = p.code;
      if (code !== "free" && code !== "pro" && code !== "unlimited") return null;
      const planCode: UserPlanCode = code;
      const monthly = Number(p.monthlyAmountSubunits);
      const annual = Number(p.annualAmountSubunits);
      const quota = p.monthlyQuota === null ? null : Number(p.monthlyQuota);
      if (!Number.isFinite(monthly) || !Number.isFinite(annual)) return null;
      return {
        code: planCode,
        monthlyAmountSubunits: Math.max(0, Math.round(monthly)),
        annualAmountSubunits: Math.max(0, Math.round(annual)),
        monthlyQuota: quota != null && Number.isFinite(quota) ? Math.max(0, Math.round(quota)) : null
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
  if (!currency || normalizedPlans.length === 0) return null;
  return { country, currency, plans: normalizedPlans };
}

export default function PricingPage() {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [pricingContext, setPricingContext] = useState<PricingContextSnapshot | null>(null);
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const backendUrl = useMemo(() => resolveBackendUrl(), []);
  const resolvedPricingContext = pricingContext || DEFAULT_PRICING_CONTEXT;
  const pricingByPlanCode = useMemo(() => {
    const out: Partial<Record<UserPlanCode, (typeof resolvedPricingContext.plans)[number]>> = {};
    for (const plan of resolvedPricingContext.plans) {
      out[plan.code] = plan;
    }
    return out;
  }, [resolvedPricingContext]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${backendUrl}/api/pricing/context`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { ok?: boolean; pricing?: unknown }) => {
        if (!data?.ok || !data.pricing) return;
        const normalized = normalizePricingContext(data.pricing);
        if (normalized) setPricingContext(normalized);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [backendUrl]);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((prev) => (Math.abs(prev - p) > 0.001 ? p : prev));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function onSubscribeNewsletter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMessage("Subscribed. Thank you for joining our newsletter.");
    setNewsletterEmail("");
  }

  return (
    <div className="site-shell pricing-page" data-nav-scrolled={headerScrollProgress > 0.08 ? "" : undefined}>
      <header
        className={`top-nav ${headerScrollProgress > 0.08 ? "is-scrolled" : ""}`}
        style={{ "--nav-scroll-progress": headerScrollProgress } as CSSProperties}
      >
        <div className="container nav-inner">
          <Link className="rb-brand" href="/" aria-label="Image to Prompt">
            <BrandMarkIcon className="rb-brand-mark" />
            <span className="rb-brand-text">Image to Prompt</span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            <Link href="/#upload">Image to Prompt</Link>
            <Link href="/bulk">Bulk</Link>
            <Link href="/chrome-extension">Extension</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faqs">FAQs</Link>
          </nav>

          <div className="nav-auth">
            <Link href="/" className="nav-login nav-login-btn">
              Log in
            </Link>
            <Link href="/" className="nav-signup">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main className="profile-main pricing-main">
        <section className="pricing-section container" aria-label="Plans and pricing">
          <h1 className="pricing-heading">Plans and Pricing</h1>
          <p className="pricing-subtitle">
            Save when you pay yearly. Switch plans anytime from your profile. Showing{" "}
            <strong>{resolvedPricingContext.currency}</strong> pricing for{" "}
            {resolvedPricingContext.country === "UNKNOWN" ? "your region" : resolvedPricingContext.country}.
          </p>
          <div className="pricing-toggle-wrap">
            <button
              type="button"
              className={`pricing-toggle-btn ${!billingAnnual ? "is-active" : ""}`}
              onClick={() => setBillingAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`pricing-toggle-btn ${billingAnnual ? "is-active" : ""}`}
              onClick={() => setBillingAnnual(true)}
            >
              Annual
              <span className="pricing-toggle-badge">Save 20%</span>
            </button>
          </div>
          <div className="pricing-grid">
            {PRICING_CARDS.map((card) => {
              const planPricing = pricingByPlanCode[card.code];
              const monthlyAmountSubunits = planPricing?.monthlyAmountSubunits ?? 0;
              const annualAmountSubunits = planPricing?.annualAmountSubunits ?? 0;
              const monthlyDisplaySubunits = billingAnnual
                ? Math.max(0, Math.round(annualAmountSubunits / 12))
                : monthlyAmountSubunits;
              const price = formatCurrencySubunits(monthlyDisplaySubunits, resolvedPricingContext.currency);
              return (
                <article
                  key={card.code}
                  className={`pricing-card ${card.popular ? "pricing-card-popular" : ""} ${card.dark ? "pricing-card-dark" : ""}`}
                >
                  {card.popular ? <span className="pricing-card-badge">Popular</span> : null}
                  <h2 className="pricing-card-title">{card.title}</h2>
                  <p className="pricing-card-price">
                    {price}
                    <span className="pricing-card-period">/mo</span>
                  </p>
                  <p className="pricing-card-billing">
                    {billingAnnual
                      ? `Billed annually in ${resolvedPricingContext.currency}`
                      : `Billed monthly in ${resolvedPricingContext.currency}`}
                  </p>
                  <p className="pricing-card-desc">{card.description}</p>
                  <ul className="pricing-card-features" aria-label={`${card.title} features`}>
                    {card.features.map((feature) => (
                      <li key={feature}>
                        <CheckIcon className="pricing-card-check" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/"
                    className={`pricing-card-cta ${card.dark ? "pricing-card-cta-dark" : ""} ${card.popular ? "pricing-card-cta-primary" : ""}`}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                  >
                    {card.cta}
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="pricing-signin-note">
            Already have an account? <Link href="/">Sign in</Link> to manage your plan.
          </p>
        </section>
      </main>

      <footer className="footer footer-simple" id="pricing-footer">
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
              <form className="footer-newsletter-form" onSubmit={onSubscribeNewsletter}>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
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
            <nav className="footer-simple-links" aria-label="Product and tool pages">
              <Link href="/">Image to Prompt</Link>
              <Link href="/bulk">Bulk Image to Prompt</Link>
              <Link href="/pricing">Pricing</Link>
              <a href="/chrome-extension">Chrome Extension</a>
              <a href="mailto:abhi@argro.co?subject=I%20need%20help%20for%20Image%20to%20Prompt">Help Center</a>
            </nav>
          </div>

          <div className="footer-simple-divider" />

          <div className="footer-simple-bottom">
            <nav className="footer-simple-links" aria-label="Company">
              <a href="/about">About</a>
            </nav>
            <nav className="footer-simple-links footer-simple-links-right" aria-label="Legal and policies">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Settings</a>
              <a href="/accessibility">Accessibility</a>
              <a href="/security">Security</a>
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
    </div>
  );
}
