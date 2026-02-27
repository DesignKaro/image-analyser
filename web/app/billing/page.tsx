"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import { BillingCycle, UserPlanCode, UserRole } from "../lib/saas-types";
import { BrandMarkIcon, CloseIcon } from "../ui/icons";

type SubscriptionSnapshot = {
  planCode: UserPlanCode;
  planName: string;
  monthlyQuota: number | null;
};

type UserSnapshot = {
  id: number;
  email: string;
  role: UserRole;
  status: string;
};

type BillingOrder = {
  id: number;
  planCode: string;
  billingCycle: BillingCycle;
  amountSubunits: number;
  currency: string;
  status: string;
  createdAt: string | null;
};

export default function BillingPage() {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [orders, setOrders] = useState<BillingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const backendUrl = useMemo(() => {
    return resolveBackendUrl();
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
    setAuthToken(token || "");
  }, []);

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch(`${backendUrl}/api/me`, {
            headers: { Authorization: `Bearer ${authToken}` }
          }),
          fetch(`${backendUrl}/api/billing/orders`, {
            headers: { Authorization: `Bearer ${authToken}` }
          })
        ]);

        const mePayload = await meRes.json().catch(() => ({}));
        const ordersPayload = await ordersRes.json().catch(() => ({}));

        if (cancelled) return;

        if (!meRes.ok || !mePayload.ok) {
          setError(mePayload.error || "Could not load account.");
          setUser(null);
          setSubscription(null);
          setOrders([]);
          return;
        }

        setUser(mePayload.user || null);
        setSubscription(mePayload.subscription || null);
        setOrders(Array.isArray(ordersPayload.orders) ? ordersPayload.orders : []);
        setError("");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load billing.");
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authToken, backendUrl]);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const next = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((p) => (Math.abs(p - next) > 0.001 ? next : p));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    };
    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function formatAmount(subunits: number, currency: string): string {
    const value = subunits / 100;
    if (currency === "USD" || currency === "INR") {
      return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency: currency || "USD"
      }).format(value);
    }
    return `${currency} ${value.toFixed(2)}`;
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return iso;
    }
  }

  const planName = subscription?.planName || "Free";
  const canCancelPaidPlan = subscription?.planCode === "pro" || subscription?.planCode === "unlimited";

  async function doCancelSubscription() {
    if (!authToken) {
      setCancelError("Sign in is required to manage billing.");
      return;
    }

    if (!canCancelPaidPlan) {
      setCancelError("No active paid subscription to cancel.");
      return;
    }

    setCancelSubmitting(true);
    setCancelMessage("");
    setCancelError("");

    try {
      const response = await fetch(`${backendUrl}/api/billing/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not cancel subscription.");
      }

      if (payload?.subscription) {
        setSubscription(payload.subscription);
      }

      setCancelMessage(
        typeof payload?.message === "string" && payload.message.trim()
          ? payload.message
          : "Subscription canceled. No refund will be given for current month."
      );
    } catch (cancelRequestError) {
      setCancelError(cancelRequestError instanceof Error ? cancelRequestError.message : "Could not cancel subscription.");
    } finally {
      setCancelSubmitting(false);
    }
  }

  function onSubscribeNewsletter(event: FormEvent<HTMLFormElement>) {
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
    <div className="site-shell profile-page">
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
            <Link className="nav-login" href="/profile">
              Back to Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <section className="container profile-shell">
          <div className="profile-head">
            <h1>Manage billing &amp; history</h1>
            <p>View your current plan and payment history.</p>
          </div>

          {!authToken ? (
            <article className="profile-card profile-empty">
              <h2>Sign in required</h2>
              <p>Log in to view billing and payment history.</p>
              <Link href="/" className="profile-primary-btn">
                Go to Home
              </Link>
            </article>
          ) : loading ? (
            <article className="profile-card profile-empty">
              <p>Loading…</p>
            </article>
          ) : (
            <>
              <article className="profile-card">
                <h2>Current plan</h2>
                <div className="profile-item">
                  <span>Plan</span>
                  <strong>{planName}</strong>
                </div>
                {user?.email ? (
                  <div className="profile-item">
                    <span>Account</span>
                    <strong>{user.email}</strong>
                  </div>
                ) : null}
              </article>

              <article className="profile-card">
                <h2>Cancel subscription</h2>
                <p className="billing-cancel-note">You can cancel anytime. No refund will be given for current month.</p>
                <div className="billing-cancel-actions">
                  <button
                    type="button"
                    className="billing-cancel-btn"
                    onClick={() => canCancelPaidPlan && setCancelConfirmOpen(true)}
                    disabled={cancelSubmitting || !canCancelPaidPlan}
                  >
                    {cancelSubmitting ? "Canceling..." : "Cancel subscription"}
                  </button>
                </div>
                {!canCancelPaidPlan ? <p className="billing-cancel-muted">No active paid subscription.</p> : null}
                {cancelMessage ? <p className="profile-message">{cancelMessage}</p> : null}
                {cancelError ? <p className="profile-error">{cancelError}</p> : null}
              </article>

              <article className="profile-card billing-history-card">
                <h2>Billing history</h2>
                {error ? (
                  <p className="profile-error">{error}</p>
                ) : orders.length === 0 ? (
                  <p className="billing-empty">No billing history yet.</p>
                ) : (
                  <div className="billing-table-wrap">
                    <table className="billing-table" aria-label="Billing history">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Plan</th>
                          <th>Billing</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{order.planCode === "pro" ? "Pro" : order.planCode === "unlimited" ? "Unlimited" : order.planCode}</td>
                            <td>{order.billingCycle === "annual" ? "Annual" : "Monthly"}</td>
                            <td>{formatAmount(order.amountSubunits, order.currency)}</td>
                            <td>
                              <span className={`billing-status billing-status-${order.status}`}>
                                {order.status === "paid" ? "Paid" : order.status === "failed" ? "Failed" : order.status === "created" ? "Pending" : order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              <div className="profile-actions">
                <Link href="/profile" className="profile-secondary-btn">
                  Back to Profile
                </Link>
                <Link href="/" className="profile-secondary-btn">
                  Home
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      {cancelConfirmOpen ? (
        <div
          className="profile-modal-overlay cancel-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelConfirmOpen(false);
          }}
        >
          <div className="profile-modal cancel-confirm-modal">
            <div className="profile-modal-head">
              <h2 id="cancel-confirm-title" className="profile-modal-title">
                Cancel your subscription now?
              </h2>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Close"
                onClick={() => setCancelConfirmOpen(false)}
              >
                <CloseIcon className="profile-modal-close-icon" />
              </button>
            </div>
            <p className="profile-modal-subtitle cancel-confirm-note">
              No refund will be given for current month.
            </p>
            <div className="out-of-credits-modal-actions">
              <button
                type="button"
                className="out-of-credits-cta-secondary"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="out-of-credits-cta-primary"
                onClick={() => {
                  setCancelConfirmOpen(false);
                  void doCancelSubscription();
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="footer footer-simple">
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
              <Link href="/chrome-extension">Chrome Extension</Link>
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
    </div>
  );
}
