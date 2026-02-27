"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import { DEFAULT_PRICING_CONTEXT, PLAN_OPTION_META, formatCurrencySubunits, getPlanRank } from "../lib/pricing";
import {
  BillingCycle,
  PricingContextSnapshot,
  PricingPlanSnapshot,
  SubscriptionSnapshot,
  UsageSnapshot,
  UserPlanCode,
  UserSnapshot
} from "../lib/saas-types";
import { ArrowRightIcon, BrandMarkIcon } from "../ui/icons";

type ApiResponse = {
  ok?: boolean;
  error?: string;
  description?: string;
  url?: string;
  provider?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  message?: string;
  prefill?: {
    email?: string;
  };
  user?: Partial<UserSnapshot>;
  usage?: Partial<UsageSnapshot>;
  subscription?: Partial<SubscriptionSnapshot>;
  pricing?: Partial<PricingContextSnapshot>;
};

type RazorpayHandlerPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
};

type RazorpayCheckoutConstructor = new (options: {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (payload: RazorpayHandlerPayload) => void | Promise<void>;
}) => RazorpayCheckoutInstance;

export default function ProfilePage() {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [billingRedirecting, setBillingRedirecting] = useState(false);
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [pricingContext, setPricingContext] = useState<PricingContextSnapshot | null>(null);

  const backendUrl = useMemo(() => {
    return resolveBackendUrl();
  }, []);

  const currentPlanCode: UserPlanCode = subscription?.planCode || "free";
  const usagePercent = useMemo(() => {
    if (!usage || usage.limit === null || usage.limit <= 0) {
      return 100;
    }
    return Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)));
  }, [usage]);

  const usageText = useMemo(() => formatUsageLine(usage, subscription), [usage, subscription]);
  const isAdminUser = user?.role === "admin" || user?.role === "superadmin";
  const adminDashboardHref = user?.role === "superadmin" ? "/superadmin" : "/admin";
  const resolvedPricingContext = pricingContext || DEFAULT_PRICING_CONTEXT;
  const pricingByPlanCode = useMemo(() => {
    const output: Partial<Record<UserPlanCode, PricingPlanSnapshot>> = {};
    for (const plan of resolvedPricingContext.plans) {
      output[plan.code] = plan;
    }
    return output;
  }, [resolvedPricingContext]);
  const planOptions = useMemo(() => {
    return PLAN_OPTION_META.map((meta) => {
      const pricing = pricingByPlanCode[meta.code];
      const monthlyAmountSubunits = pricing?.monthlyAmountSubunits ?? 0;
      return {
        ...meta,
        price: `${formatCurrencySubunits(monthlyAmountSubunits, resolvedPricingContext.currency)}/mo`
      };
    });
  }, [pricingByPlanCode, resolvedPricingContext.currency]);

  const clearSession = useCallback((nextMessage = "") => {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setAuthToken("");
    setUser(null);
    setSubscription(null);
    setUsage(null);
    setMessage(nextMessage);
  }, []);

  const applySessionPayload = useCallback((payload: ApiResponse) => {
    const nextUser = normalizeUserSnapshot(payload.user);
    const nextSubscription = normalizeSubscriptionSnapshot(payload.subscription);
    const nextUsage = normalizeUsageSnapshot(payload.usage);
    setUser(nextUser);
    setSubscription(nextSubscription);
    setUsage(nextUsage);
  }, []);

  const refreshProfile = useCallback(
    async (token: string) => {
      const response = await fetch(`${backendUrl}/api/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        clearSession("Session expired. Please sign in again.");
        throw new Error(payload.error || "Could not load profile.");
      }

      applySessionPayload(payload);
    },
    [applySessionPayload, backendUrl, clearSession]
  );

  useEffect(() => {
    const controller = new AbortController();

    const loadPricingContext = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/pricing/context`, {
          method: "GET",
          signal: controller.signal
        });
        const payload = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!response.ok || !payload.ok) {
          return;
        }
        const normalized = normalizePricingContextSnapshot(payload.pricing);
        if (normalized) {
          setPricingContext(normalized);
        }
      } catch (pricingError) {
        if ((pricingError as { name?: string })?.name !== "AbortError") {
          setPricingContext(null);
        }
      }
    };

    void loadPricingContext();
    return () => controller.abort();
  }, [backendUrl]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setAuthToken(storedToken);
    void refreshProfile(storedToken)
      .catch((fetchError) => {
        const nextError = fetchError instanceof Error ? fetchError.message : "Could not load profile.";
        setError(nextError);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refreshProfile]);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const nextProgress = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((current) =>
        Math.abs(current - nextProgress) > 0.001 ? nextProgress : current
      );
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

  useEffect(() => {
    const url = new URL(window.location.href);
    const billingState = url.searchParams.get("billing");
    const plan = url.searchParams.get("plan");
    if (!billingState) {
      return;
    }

    if (billingState === "success") {
      setMessage(plan ? `Checkout started for ${plan}. Plan sync is in progress.` : "Checkout completed.");
    } else if (billingState === "cancel") {
      setMessage("Checkout canceled.");
    }

    url.searchParams.delete("billing");
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  async function onRefresh() {
    if (!authToken) {
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await refreshProfile(authToken);
      setMessage("Profile updated.");
    } catch (refreshError) {
      const nextError = refreshError instanceof Error ? refreshError.message : "Could not refresh profile.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  async function ensureRazorpayLoaded(): Promise<RazorpayCheckoutConstructor> {
    const scopedWindow = window as Window & { Razorpay?: RazorpayCheckoutConstructor };
    if (scopedWindow.Razorpay) {
      return scopedWindow.Razorpay;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load Razorpay checkout.")), {
          once: true
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.dataset.razorpayCheckout = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load Razorpay checkout."));
      document.body.appendChild(script);
    });

    if (!scopedWindow.Razorpay) {
      throw new Error("Razorpay checkout is unavailable.");
    }

    return scopedWindow.Razorpay;
  }

  async function onChangePlan(planCode: UserPlanCode, billingCycle: BillingCycle = "monthly") {
    if (!authToken || planCode === currentPlanCode) {
      return;
    }

    setPlanSubmitting(true);
    setError("");
    setMessage("");

    try {
      const isUpgrade = getPlanRank(planCode) > getPlanRank(currentPlanCode);

      if (!isUpgrade) {
        const response = await fetch(`${backendUrl}/api/subscription/plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({ planCode })
        });

        const payload = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Could not update plan.");
        }

        applySessionPayload(payload);
        setMessage("Moved to Free plan.");
        return;
      }

      const response = await fetch(`${backendUrl}/api/billing/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          planCode,
          billingCycle
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (
        !response.ok ||
        !payload.ok ||
        !payload.orderId ||
        !payload.keyId ||
        !Number.isFinite(payload.amount) ||
        !payload.currency
      ) {
        throw new Error(payload.error || "Could not start checkout.");
      }

      setBillingRedirecting(true);
      const Razorpay = await ensureRazorpayLoaded();
      await new Promise<void>((resolve, reject) => {
        let completed = false;
        const checkout = new Razorpay({
          key: payload.keyId || "",
          amount: Number(payload.amount),
          currency: payload.currency || "USD",
          name: "Image to Prompt",
          description: payload.description || `${planCode} ${billingCycle} plan`,
          order_id: payload.orderId || "",
          prefill: {
            email: payload.prefill?.email || user?.email || ""
          },
          theme: {
            color: "#2d6ae3"
          },
          modal: {
            ondismiss: () => {
              if (!completed) {
                reject(new Error("Payment canceled."));
              }
            }
          },
          handler: async (checkoutPayload: RazorpayHandlerPayload) => {
            try {
              const verifyResponse = await fetch(`${backendUrl}/api/billing/verify-payment`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify(checkoutPayload)
              });

              const verifyPayload = (await verifyResponse.json().catch(() => ({}))) as ApiResponse;
              if (!verifyResponse.ok || !verifyPayload.ok) {
                throw new Error(verifyPayload.error || "Payment verification failed.");
              }

              completed = true;
              applySessionPayload(verifyPayload);
              const planName = normalizeSubscriptionSnapshot(verifyPayload.subscription)?.planName || planCode.toUpperCase();
              const appliedCycle = verifyPayload.billingCycle || billingCycle;
              setMessage(`Plan updated to ${planName} (${appliedCycle}).`);
              resolve();
            } catch (verifyError) {
              const nextError =
                verifyError instanceof Error ? verifyError.message : "Payment verification failed.";
              reject(new Error(nextError));
            }
          }
        });
        checkout.open();
      });
    } catch (planError) {
      const nextError = planError instanceof Error ? planError.message : "Plan update failed.";
      setError(nextError);
    } finally {
      setBillingRedirecting(false);
      setPlanSubmitting(false);
    }
  }

  async function onOpenBillingPortal() {
    if (!authToken) {
      return;
    }

    setBillingRedirecting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${backendUrl}/api/billing/portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not open billing portal.");
      }

      if (payload.url && payload.url !== window.location.href) {
        window.location.href = payload.url;
        return;
      }

      setMessage(payload.message || "Billing is managed in-app. Use plan buttons to switch plans.");
      setBillingRedirecting(false);
    } catch (portalError) {
      const nextError = portalError instanceof Error ? portalError.message : "Could not open billing portal.";
      setError(nextError);
      setBillingRedirecting(false);
    }
  }

  function onSignOut() {
    clearSession("Signed out.");
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
            {user ? <span className="nav-usage-pill">{usageText}</span> : null}
            <Link className="nav-login" href="/">
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <section className="container profile-shell">
          <div className="profile-head">
            <h1>Profile</h1>
            <p>Manage your plan, usage, and billing from one clean dashboard.</p>
          </div>

          {!user ? (
            <article className="profile-card profile-empty">
              <h2>Sign in required</h2>
              <p>Log in from the home page to view and manage your SaaS account.</p>
              <Link href="/" className="profile-primary-btn">
                Go to Home
                <ArrowRightIcon className="button-icon" />
              </Link>
            </article>
          ) : (
            <>
              <div className="profile-grid">
                <article className="profile-card">
                  <h2>Account</h2>
                  <div className="profile-item">
                    <span>Email</span>
                    <strong>{user.email}</strong>
                  </div>
                  <div className="profile-item">
                    <span>Role</span>
                    <strong className="profile-pill">{user.role}</strong>
                  </div>
                  <div className="profile-item">
                    <span>Status</span>
                    <strong className="profile-pill">{user.status}</strong>
                  </div>
                </article>

                <article className="profile-card">
                  <h2>Current Plan</h2>
                  <div className="profile-item">
                    <span>Plan</span>
                    <strong>{subscription?.planName || "Free"}</strong>
                  </div>
                  <div className="profile-item">
                    <span>Quota</span>
                    <strong>{formatQuotaLabel(subscription?.monthlyQuota ?? 20)}</strong>
                  </div>
                  <div className="profile-usage-meter">
                    <div className="profile-usage-meter-bar" style={{ width: `${usagePercent}%` }} />
                  </div>
                  <p className="profile-usage-note">{usageText}</p>
                </article>
              </div>

              <article className="profile-card">
                <h2>Plans</h2>
                <div className="profile-plan-row">
                  {planOptions.map((plan) => (
                    <button
                      key={plan.code}
                      type="button"
                      className={`profile-plan-btn ${currentPlanCode === plan.code ? "is-active" : ""}`}
                      disabled={planSubmitting || billingRedirecting}
                      onClick={() => void onChangePlan(plan.code)}
                    >
                      <span>{plan.label}</span>
                      <span>{plan.price}</span>
                      <span>{plan.quota}</span>
                    </button>
                  ))}
                </div>

                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-secondary-btn"
                    disabled={billingRedirecting}
                    onClick={() => void onOpenBillingPortal()}
                  >
                    {billingRedirecting ? "Redirecting..." : "Manage billing"}
                  </button>
                  <button type="button" className="profile-secondary-btn" disabled={loading} onClick={() => void onRefresh()}>
                    Refresh
                  </button>
                  {isAdminUser ? (
                    <Link className="profile-secondary-btn" href={adminDashboardHref}>
                      {user?.role === "superadmin" ? "Superadmin dashboard" : "Admin dashboard"}
                    </Link>
                  ) : null}
                  <button type="button" className="profile-secondary-btn" onClick={onSignOut}>
                    Sign out
                  </button>
                </div>
              </article>
            </>
          )}

          {message ? <p className="profile-message">{message}</p> : null}
          {error ? <p className="profile-error">{error}</p> : null}
        </section>
      </main>

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
              Image to Prompt Generator helps creators and teams turn visuals into structured prompts. Upload an
              image and get AI-ready text for ChatGPT, Gemini, Grok, Leonardo, and more.
            </p>
          </div>

          <div className="footer-simple-legal">
            <p>© 2026 Image to Prompt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function normalizeInteger(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.round(num);
}

function normalizeUserSnapshot(value: Partial<UserSnapshot> | undefined): UserSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id = normalizeInteger(value.id);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = value.role;
  const status = typeof value.status === "string" ? value.status.trim() : "";

  if (
    id === null ||
    !email ||
    (role !== "subscriber" && role !== "admin" && role !== "superadmin") ||
    !status
  ) {
    return null;
  }

  return {
    id,
    email,
    role,
    status
  };
}

function normalizeSubscriptionSnapshot(
  value: Partial<SubscriptionSnapshot> | undefined
): SubscriptionSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const planCode = value.planCode;
  const planName = typeof value.planName === "string" ? value.planName.trim() : "";
  const status = typeof value.status === "string" ? value.status.trim() : "";
  const monthlyQuota = value.monthlyQuota === null ? null : normalizeInteger(value.monthlyQuota);
  const priceUsdCents = normalizeInteger(value.priceUsdCents);
  const id = value.id === null ? null : normalizeInteger(value.id);
  const userId = value.userId === null ? null : normalizeInteger(value.userId);
  const renewsAt = typeof value.renewsAt === "string" ? value.renewsAt : value.renewsAt === null ? null : null;

  if (
    (planCode !== "free" && planCode !== "pro" && planCode !== "unlimited") ||
    !planName ||
    !status ||
    priceUsdCents === null
  ) {
    return null;
  }

  return {
    id,
    userId,
    planCode,
    planName,
    status,
    monthlyQuota,
    priceUsdCents,
    renewsAt
  };
}

function normalizeUsageSnapshot(value: Partial<UsageSnapshot> | undefined): UsageSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const periodKey = typeof value.periodKey === "string" ? value.periodKey.trim() : "";
  const used = normalizeInteger(value.used);
  const limit = value.limit === null ? null : normalizeInteger(value.limit);
  const remaining = value.remaining === null ? null : normalizeInteger(value.remaining);

  if (!periodKey || used === null) {
    return null;
  }

  return {
    periodKey,
    used: Math.max(0, used),
    limit: limit === null ? null : Math.max(0, limit),
    remaining: remaining === null ? null : Math.max(0, remaining)
  };
}

function normalizePricingPlanSnapshot(value: Partial<PricingPlanSnapshot> | undefined): PricingPlanSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const code = value.code;
  const monthlyAmountSubunits = normalizeInteger(value.monthlyAmountSubunits);
  const annualAmountSubunits = normalizeInteger(value.annualAmountSubunits);
  const monthlyQuota = value.monthlyQuota === null ? null : normalizeInteger(value.monthlyQuota);

  if (
    (code !== "free" && code !== "pro" && code !== "unlimited") ||
    monthlyAmountSubunits === null ||
    annualAmountSubunits === null
  ) {
    return null;
  }

  return {
    code,
    monthlyAmountSubunits: Math.max(0, monthlyAmountSubunits),
    annualAmountSubunits: Math.max(0, annualAmountSubunits),
    monthlyQuota: monthlyQuota === null ? null : Math.max(0, monthlyQuota)
  };
}

function normalizePricingContextSnapshot(
  value: Partial<PricingContextSnapshot> | undefined
): PricingContextSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const country = typeof value.country === "string" && value.country.trim() ? value.country.trim().toUpperCase() : "UNKNOWN";
  const currency =
    typeof value.currency === "string" && /^[A-Za-z]{3}$/.test(value.currency.trim())
      ? value.currency.trim().toUpperCase()
      : "";
  const plans = Array.isArray(value.plans)
    ? value.plans.map(normalizePricingPlanSnapshot).filter((entry): entry is PricingPlanSnapshot => Boolean(entry))
    : [];

  if (!currency || plans.length === 0) {
    return null;
  }

  return {
    country,
    currency,
    plans
  };
}

function formatQuotaLabel(limit: number | null): string {
  if (limit === null) {
    return "Unlimited";
  }
  return `${limit} prompts / month`;
}

function formatUsageLine(
  usage: UsageSnapshot | null,
  subscription: SubscriptionSnapshot | null
): string {
  if (!usage) {
    if (subscription?.monthlyQuota === null) {
      return "Unlimited monthly usage";
    }
    return `0/${subscription?.monthlyQuota ?? 20} used this month`;
  }

  if (usage.limit === null) {
    return `${usage.used} used this month • Unlimited`;
  }

  const remaining = usage.remaining ?? Math.max(0, usage.limit - usage.used);
  return `${usage.used}/${usage.limit} used • ${remaining} left`;
}
