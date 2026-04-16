"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import {
  DEFAULT_PRICING_CONTEXT,
  PRICING_CARDS,
  formatCurrencySubunits
} from "../lib/pricing";
import type { PricingContextSnapshot, PricingTopupSnapshot, UserPlanCode, UsageSnapshot } from "../lib/saas-types";
import { BrandMarkIcon, CheckIcon } from "../ui/icons";
import { SiteFooter } from "../ui/site-footer";

function normalizeUsageSnapshot(value: Partial<UsageSnapshot> | undefined): UsageSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const periodKey = typeof value.periodKey === "string" ? value.periodKey.trim() : "";
  const used = Number.isFinite(Number(value.used)) ? Number(value.used) : NaN;
  const limitRaw = value.limit;
  const remainingRaw = value.remaining;
  const limit = limitRaw === null ? null : Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : NaN;
  const remaining = remainingRaw === null ? null : Number.isFinite(Number(remainingRaw)) ? Number(remainingRaw) : NaN;
  if (!periodKey || !Number.isFinite(used)) return null;
  if (limit !== null && !Number.isFinite(limit)) return null;
  if (remaining !== null && !Number.isFinite(remaining)) return null;
  return {
    periodKey,
    used: Math.max(0, used),
    limit: limit === null ? null : Math.max(0, limit),
    remaining: remaining === null ? null : Math.max(0, remaining)
  };
}

function formatUsageLine(usage: UsageSnapshot | null): string {
  if (!usage) return "Usage";
  if (usage.limit === null) return `${usage.used} used • Unlimited`;
  const remaining = usage.remaining ?? Math.max(0, usage.limit - usage.used);
  return `${usage.used}/${usage.limit} used • ${remaining} left`;
}

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
  const topups = Array.isArray(v.topups) ? v.topups : [];
  const normalizedTopups = topups
    .filter((p): p is Record<string, unknown> => p && typeof p === "object")
    .map((p) => {
      const code = typeof p.code === "string" ? p.code.trim().toLowerCase() : "";
      const credits = Number(p.credits);
      const amount = Number(p.amountSubunits);
      const perCredit = Number(p.pricePerCreditSubunits);
      const topupCurrency =
        typeof p.currency === "string" && /^[A-Za-z]{3}$/.test(p.currency.trim())
          ? p.currency.trim().toUpperCase()
          : currency;
      if (!code || !Number.isFinite(credits) || !Number.isFinite(amount) || !Number.isFinite(perCredit) || !topupCurrency) {
        return null;
      }
      return {
        code,
        credits: Math.max(1, Math.round(credits)),
        amountSubunits: Math.max(1, Math.round(amount)),
        pricePerCreditSubunits: Math.max(1, Math.round(perCredit)),
        currency: topupCurrency
      } satisfies PricingTopupSnapshot;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.credits - b.credits);
  if (!currency || normalizedPlans.length === 0) return null;
  return { country, currency, plans: normalizedPlans, topups: normalizedTopups };
}

export default function PricingPage() {
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [pricingContext, setPricingContext] = useState<PricingContextSnapshot | null>(null);
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState<{ id?: number; email?: string } | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  const backendUrl = useMemo(() => resolveBackendUrl(), []);
  const usageLine = useMemo(() => formatUsageLine(usage), [usage]);
  const resolvedPricingContext = pricingContext || DEFAULT_PRICING_CONTEXT;
  const pricingByPlanCode = useMemo(() => {
    const out: Partial<Record<UserPlanCode, (typeof resolvedPricingContext.plans)[number]>> = {};
    for (const plan of resolvedPricingContext.plans) {
      out[plan.code] = plan;
    }
    return out;
  }, [resolvedPricingContext]);
  const topupOptions = useMemo(() => {
    return Array.isArray(resolvedPricingContext.topups)
      ? resolvedPricingContext.topups.slice().sort((a, b) => a.credits - b.credits)
      : [];
  }, [resolvedPricingContext.topups]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
    setAuthToken(token || "");
  }, []);

  useEffect(() => {
    if (!authToken || !backendUrl) return;
    const controller = new AbortController();
    fetch(`${backendUrl}/api/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${authToken}` },
      signal: controller.signal
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; user?: unknown; usage?: unknown; error?: string }) => {
        if (!data?.ok) {
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setAuthToken("");
          setUser(null);
          setUsage(null);
          return;
        }
        setUser((data.user && typeof data.user === "object") ? (data.user as { id?: number; email?: string }) : null);
        const nextUsage = normalizeUsageSnapshot(data.usage as Partial<UsageSnapshot> | undefined);
        setUsage(nextUsage);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [authToken, backendUrl]);

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
            {user ? (
              <>
                <span className="nav-usage-pill" title={usageLine}>{usageLine}</span>
                <Link className="nav-login" href="/profile">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link href="/" className="nav-login nav-login-btn">
                  Log in
                </Link>
                <Link href="/" className="nav-signup">
                  Sign up
                </Link>
              </>
            )}
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
          {topupOptions.length > 0 ? (
            <div className="pricing-topup-wrap">
              <div className="pricing-topup-head">
                <h2>Add more credits</h2>
                <p>Need more prompts? Buy top-up credits anytime after signup.</p>
              </div>
              <div className="pricing-topup-table-wrap">
                <table className="pricing-topup-table">
                  <thead>
                    <tr>
                      <th scope="col">Credits</th>
                      <th scope="col">Cost</th>
                      <th scope="col">Price / credit</th>
                      <th scope="col" aria-label="Action" />
                    </tr>
                  </thead>
                  <tbody>
                    {topupOptions.map((topup) => (
                      <tr key={topup.code}>
                        <td>{topup.credits.toLocaleString()}</td>
                        <td>{formatCurrencySubunits(topup.amountSubunits, resolvedPricingContext.currency)}</td>
                        <td>{formatCurrencySubunits(topup.pricePerCreditSubunits, resolvedPricingContext.currency)}</td>
                        <td>
                          <Link href="/" className="pricing-topup-buy-link">
                            Get started
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          <p className="pricing-signin-note">
            Already have an account? <Link href="/">Sign in</Link> to manage your plan.
          </p>
        </section>
      </main>

      <SiteFooter id="pricing-footer" />
    </div>
  );
}
