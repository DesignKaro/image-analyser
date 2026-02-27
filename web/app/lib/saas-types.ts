export type UserRole = "subscriber" | "admin" | "superadmin";
export type UserStatus = "active" | "suspended";

export type UserPlanCode = "free" | "pro" | "unlimited";
export type AnyPlanCode = UserPlanCode | "guest";

export type BillingCycle = "monthly" | "annual";

export type UsageSnapshot = {
  periodKey: string;
  used: number;
  limit: number | null;
  remaining: number | null;
};

export type SubscriptionSnapshot = {
  id: number | null;
  userId: number | null;
  planCode: UserPlanCode;
  planName: string;
  status: string;
  monthlyQuota: number | null;
  priceUsdCents: number;
  renewsAt: string | null;
};

export type UserSnapshot = {
  id: number;
  email: string;
  role: UserRole;
  status: string;
};

export type PlanSnapshot = {
  code: AnyPlanCode;
  name: string;
  monthlyQuota: number | null;
  priceUsdCents: number;
};

export type PricingPlanSnapshot = {
  code: UserPlanCode;
  monthlyAmountSubunits: number;
  annualAmountSubunits: number;
  monthlyQuota: number | null;
};

export type PricingContextSnapshot = {
  country: string;
  currency: string;
  plans: PricingPlanSnapshot[];
};
