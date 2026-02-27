import { PricingContextSnapshot, UserPlanCode } from "./saas-types";

export const PRICING_CARDS: Array<{
  code: UserPlanCode;
  title: string;
  description: string;
  features: string[];
  popular?: boolean;
  dark?: boolean;
  cta: string;
}> = [
  {
    code: "free",
    title: "Free",
    description: "For hobby projects and trying out",
    features: [
      "20 prompts per month",
      "ChatGPT, Gemini, Grok, Leonardo",
      "Single image upload",
      "Copy prompt to clipboard",
      "No credit card required"
    ],
    cta: "Get started for free"
  },
  {
    code: "pro",
    title: "Pro",
    description: "Great for creators and small teams",
    features: [
      "200 prompts per month",
      "All Free features",
      "Bulk upload support",
      "Priority processing",
      "Up to 3 seats"
    ],
    popular: true,
    cta: "Get started with Pro"
  },
  {
    code: "unlimited",
    title: "Unlimited",
    description: "For teams and heavy usage",
    features: [
      "Unlimited prompts",
      "Everything in Pro",
      "API access",
      "Up to 10 seats",
      "Dedicated support"
    ],
    dark: true,
    cta: "Get started with Unlimited"
  }
];

export const PLAN_OPTION_META: Array<{
  code: UserPlanCode;
  label: string;
  quota: string;
}> = [
  { code: "free", label: "Free", quota: "20 prompts/month" },
  { code: "pro", label: "Pro", quota: "200 prompts/month" },
  { code: "unlimited", label: "Unlimited", quota: "Unlimited prompts" }
];

export const DEFAULT_PRICING_CONTEXT: PricingContextSnapshot = {
  country: "UNKNOWN",
  currency: "USD",
  plans: [
    { code: "free", monthlyAmountSubunits: 0, annualAmountSubunits: 0, monthlyQuota: 20 },
    { code: "pro", monthlyAmountSubunits: 2000, annualAmountSubunits: 19200, monthlyQuota: 200 },
    { code: "unlimited", monthlyAmountSubunits: 6000, annualAmountSubunits: 57600, monthlyQuota: null }
  ]
};

export function formatCurrencySubunits(subunits: number, currency: string): string {
  const amount = Number.isFinite(subunits) ? subunits / 100 : 0;
  const code = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "USD";
  if (code === "USD" || code === "INR") {
    return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: code
    }).format(amount);
  }
  return `${code} ${amount.toFixed(2)}`;
}

export function getPlanRank(planCode: UserPlanCode): number {
  if (planCode === "unlimited") return 3;
  if (planCode === "pro") return 2;
  return 1;
}
