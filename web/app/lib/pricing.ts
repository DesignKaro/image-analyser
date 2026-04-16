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
    description: "For serious creators and teams",
    features: [
      "200 prompts per month",
      "All Free features",
      "Bulk upload support",
      "Priority processing",
      "Add top-up credits anytime"
    ],
    popular: true,
    cta: "Get started with Pro"
  }
];

export const PLAN_OPTION_META: Array<{
  code: UserPlanCode;
  label: string;
  quota: string;
}> = [
  { code: "free", label: "Free", quota: "20 prompts/month" },
  { code: "pro", label: "Pro", quota: "200 prompts/month" }
];

export const DEFAULT_PRICING_CONTEXT: PricingContextSnapshot = {
  country: "UNKNOWN",
  currency: "USD",
  plans: [
    { code: "free", monthlyAmountSubunits: 0, annualAmountSubunits: 0, monthlyQuota: 20 },
    { code: "pro", monthlyAmountSubunits: 2000, annualAmountSubunits: 19200, monthlyQuota: 200 }
  ],
  topups: [
    { code: "topup_100", credits: 100, amountSubunits: 1000, pricePerCreditSubunits: 10, currency: "USD" },
    { code: "topup_250", credits: 250, amountSubunits: 2300, pricePerCreditSubunits: 9, currency: "USD" },
    { code: "topup_500", credits: 500, amountSubunits: 4500, pricePerCreditSubunits: 9, currency: "USD" },
    { code: "topup_1000", credits: 1000, amountSubunits: 8500, pricePerCreditSubunits: 9, currency: "USD" },
    { code: "topup_10000", credits: 10000, amountSubunits: 90000, pricePerCreditSubunits: 9, currency: "USD" },
    { code: "topup_50000", credits: 50000, amountSubunits: 400000, pricePerCreditSubunits: 8, currency: "USD" },
    { code: "topup_100000", credits: 100000, amountSubunits: 450000, pricePerCreditSubunits: 5, currency: "USD" },
    { code: "topup_200000", credits: 200000, amountSubunits: 490000, pricePerCreditSubunits: 2, currency: "USD" }
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
