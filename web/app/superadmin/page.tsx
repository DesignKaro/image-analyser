"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import {
  BillingCycle,
  SubscriptionSnapshot,
  UsageSnapshot,
  UserPlanCode,
  UserRole,
  UserSnapshot,
  UserStatus
} from "../lib/saas-types";
import { BrandMarkIcon } from "../ui/icons";

type BillingOrder = {
  id: number;
  planCode: string;
  billingCycle: BillingCycle;
  amountSubunits: number;
  currency: string;
  status: string;
  createdAt: string | null;
};

type SuperadminOverview = {
  periodKey: string;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  paidUsers: number;
  freeUsers: number;
  newUsers30d: number;
  monthUsage: number;
  subscriberCount: number;
  adminCount: number;
  superadminCount: number;
  monthRevenueSubunits: number;
  weekRevenueSubunits: number;
  lifetimeRevenueSubunits: number;
  paidPayments30d: number;
  failedPayments30d: number;
  pendingPayments30d: number;
  adminActions24h: number;
  criticalActions24h: number;
};

type AdminUserRecord = {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  planCode: UserPlanCode;
  createdAt: string | null;
  usageUsed: number;
  usageLimit: number | null;
  subscriptionStatus: string;
  renewsAt: string | null;
};

type AdminAccountRecord = {
  id: number;
  email: string;
  role: UserRole;
  status: UserStatus;
  planCode: UserPlanCode;
  createdAt: string | null;
};

type AdminAuditEvent = {
  id: number;
  action: string;
  actorUserId: number | null;
  actorEmail: string;
  targetUserId: number | null;
  targetEmail: string;
  meta: Record<string, unknown> | null;
  createdAt: string | null;
};

type AdminUserSummary = {
  user: {
    id: number;
    email: string;
    role: UserRole;
    status: UserStatus;
    planCode: UserPlanCode;
    createdAt: string | null;
  };
  usage: UsageSnapshot | null;
  subscription: SubscriptionSnapshot | null;
  orders: BillingOrder[];
};

type ApiPayload = {
  ok?: boolean;
  error?: string;
  message?: string;
  user?: Partial<UserSnapshot>;
  users?: Array<Partial<AdminUserRecord>>;
  admins?: Array<Partial<AdminAccountRecord>>;
  overview?: Partial<SuperadminOverview>;
  events?: Array<Partial<AdminAuditEvent>>;
  usage?: Partial<UsageSnapshot>;
  subscription?: Partial<SubscriptionSnapshot>;
  orders?: Array<Partial<BillingOrder>>;
};

export default function SuperadminPage() {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [overview, setOverview] = useState<SuperadminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [admins, setAdmins] = useState<AdminAccountRecord[]>([]);
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<AdminUserSummary | null>(null);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchAdmins, setSearchAdmins] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "superadmin">("admin");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const backendUrl = useMemo(() => {
    return resolveBackendUrl();
  }, []);

  const isSuperadmin = user?.role === "superadmin";

  const filteredUsers = useMemo(() => {
    const query = searchUsers.trim().toLowerCase();
    if (!query) return users;
    return users.filter((entry) => {
      return (
        entry.email.toLowerCase().includes(query) ||
        entry.role.toLowerCase().includes(query) ||
        entry.status.toLowerCase().includes(query) ||
        entry.planCode.toLowerCase().includes(query) ||
        String(entry.id).includes(query)
      );
    });
  }, [searchUsers, users]);

  const filteredAdmins = useMemo(() => {
    const query = searchAdmins.trim().toLowerCase();
    if (!query) return admins;
    return admins.filter((entry) => {
      return (
        entry.email.toLowerCase().includes(query) ||
        entry.role.toLowerCase().includes(query) ||
        entry.status.toLowerCase().includes(query) ||
        entry.planCode.toLowerCase().includes(query) ||
        String(entry.id).includes(query)
      );
    });
  }, [searchAdmins, admins]);

  const loadSummary = useCallback(
    async (token: string, targetUserId: number) => {
      const response = await fetch(`${backendUrl}/api/admin/users/${targetUserId}/summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const payload = (await response.json().catch(() => ({}))) as ApiPayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not load user summary.");
      }

      const normalizedUser = normalizeAdminUserSummaryUser(payload.user);
      if (!normalizedUser) {
        throw new Error("Invalid user summary payload.");
      }

      return {
        user: normalizedUser,
        usage: normalizeUsageSnapshot(payload.usage),
        subscription: normalizeSubscriptionSnapshot(payload.subscription),
        orders: Array.isArray(payload.orders)
          ? payload.orders.map(normalizeBillingOrder).filter((value): value is BillingOrder => Boolean(value))
          : []
      } satisfies AdminUserSummary;
    },
    [backendUrl]
  );

  const loadDashboardData = useCallback(
    async (token: string) => {
      setDataLoading(true);
      try {
        const [overviewRes, usersRes, adminsRes, eventsRes] = await Promise.all([
          fetch(`${backendUrl}/api/superadmin/overview`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/admin/users`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/superadmin/admins`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/superadmin/audit`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const overviewPayload = (await overviewRes.json().catch(() => ({}))) as ApiPayload;
        const usersPayload = (await usersRes.json().catch(() => ({}))) as ApiPayload;
        const adminsPayload = (await adminsRes.json().catch(() => ({}))) as ApiPayload;
        const eventsPayload = (await eventsRes.json().catch(() => ({}))) as ApiPayload;

        if (!overviewRes.ok || !overviewPayload.ok) {
          throw new Error(overviewPayload.error || "Could not load platform overview.");
        }
        if (!usersRes.ok || !usersPayload.ok) {
          throw new Error(usersPayload.error || "Could not load users.");
        }
        if (!adminsRes.ok || !adminsPayload.ok) {
          throw new Error(adminsPayload.error || "Could not load admin accounts.");
        }
        if (!eventsRes.ok || !eventsPayload.ok) {
          throw new Error(eventsPayload.error || "Could not load audit log.");
        }

        const normalizedOverview = normalizeSuperadminOverview(overviewPayload.overview);
        const normalizedUsers = Array.isArray(usersPayload.users)
          ? usersPayload.users.map(normalizeAdminUser).filter((value): value is AdminUserRecord => Boolean(value))
          : [];
        const normalizedAdmins = Array.isArray(adminsPayload.admins)
          ? adminsPayload.admins
              .map(normalizeAdminAccount)
              .filter((value): value is AdminAccountRecord => Boolean(value))
          : [];
        const normalizedEvents = Array.isArray(eventsPayload.events)
          ? eventsPayload.events.map(normalizeAdminAuditEvent).filter((value): value is AdminAuditEvent => Boolean(value))
          : [];

        setOverview(normalizedOverview);
        setUsers(normalizedUsers);
        setAdmins(normalizedAdmins);
        setEvents(normalizedEvents);
      } finally {
        setDataLoading(false);
      }
    },
    [backendUrl]
  );

  const refreshAll = useCallback(
    async (token: string, keepSummary = true) => {
      await loadDashboardData(token);
      if (keepSummary && selectedUserId) {
        try {
          const summary = await loadSummary(token, selectedUserId);
          setSelectedSummary(summary);
        } catch {
          setSelectedSummary(null);
        }
      }
    },
    [loadDashboardData, loadSummary, selectedUserId]
  );

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
        const meRes = await fetch(`${backendUrl}/api/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${authToken}` }
        });

        const mePayload = (await meRes.json().catch(() => ({}))) as ApiPayload;
        if (!meRes.ok || !mePayload.ok) {
          throw new Error(mePayload.error || "Could not load account.");
        }

        const nextUser = normalizeUserSnapshot(mePayload.user);
        if (!nextUser) {
          throw new Error("Could not parse account data.");
        }

        if (cancelled) return;
        setUser(nextUser);

        if (nextUser.role !== "superadmin") {
          setError("Superadmin access only.");
          setLoading(false);
          return;
        }

        await refreshAll(authToken, false);
        if (!cancelled) {
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load superadmin dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDataLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken, backendUrl, refreshAll]);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const next = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((prev) => (Math.abs(prev - next) > 0.001 ? next : prev));
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

  const runPost = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      if (!authToken) {
        throw new Error("Authentication required.");
      }

      const response = await fetch(`${backendUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
      });

      const payload = (await response.json().catch(() => ({}))) as ApiPayload;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Request failed.");
      }
      return payload;
    },
    [authToken, backendUrl]
  );

  async function onInspectUser(targetUserId: number) {
    if (!authToken) return;
    setSelectedUserId(targetUserId);
    setSummaryLoading(true);
    setError("");
    try {
      const summary = await loadSummary(authToken, targetUserId);
      setSelectedSummary(summary);
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Could not load user details.");
      setSelectedSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function onRefresh() {
    if (!authToken) return;
    setActionKey("refresh");
    setError("");
    setMessage("");
    try {
      await refreshAll(authToken);
      setMessage("Dashboard refreshed.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not refresh dashboard.");
    } finally {
      setActionKey("");
    }
  }

  async function onSetPlan(targetUserId: number, planCode: UserPlanCode) {
    if (!authToken) return;
    setActionKey(`plan:${targetUserId}`);
    setError("");
    setMessage("");
    try {
      await runPost(`/api/admin/users/${targetUserId}/plan`, { planCode });
      await refreshAll(authToken);
      setMessage(`Plan updated to ${formatPlanLabel(planCode)}.`);
    } catch (planError) {
      setError(planError instanceof Error ? planError.message : "Could not update plan.");
    } finally {
      setActionKey("");
    }
  }

  async function onToggleStatus(targetUserId: number, currentStatus: UserStatus) {
    if (!authToken) return;
    const nextStatus: UserStatus = currentStatus === "active" ? "suspended" : "active";

    if (
      nextStatus === "suspended" &&
      typeof window !== "undefined" &&
      !window.confirm("Suspend this account?")
    ) {
      return;
    }

    setActionKey(`status:${targetUserId}`);
    setError("");
    setMessage("");
    try {
      await runPost(`/api/admin/users/${targetUserId}/status`, { status: nextStatus });
      await refreshAll(authToken);
      setMessage(`User status updated to ${nextStatus}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setActionKey("");
    }
  }

  async function onSetRole(targetUserId: number, role: UserRole) {
    if (!authToken) return;
    setActionKey(`role:${targetUserId}`);
    setError("");
    setMessage("");
    try {
      await runPost(`/api/admin/users/${targetUserId}/role`, { role });
      await refreshAll(authToken);
      setMessage(`Role updated to ${role}.`);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Could not update role.");
    } finally {
      setActionKey("");
    }
  }

  async function onCreateAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authToken) return;

    const email = createEmail.trim();
    const password = createPassword.trim();
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setCreateSubmitting(true);
    setError("");
    setMessage("");
    try {
      await runPost("/api/superadmin/admins", { email, password, role: createRole });
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("admin");
      await refreshAll(authToken, false);
      setMessage(`Created ${createRole} account for ${email}.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create admin account.");
    } finally {
      setCreateSubmitting(false);
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

      <main className="profile-main superadmin-main">
        <section className="container profile-shell superadmin-shell">
          <div className="profile-head">
            <h1>Superadmin dashboard</h1>
            <p>Manage platform metrics, privileged accounts, users, billing health, and security actions.</p>
          </div>

          {!authToken ? (
            <article className="profile-card profile-empty">
              <h2>Sign in required</h2>
              <p>Log in using your superadmin account to access platform controls.</p>
              <Link href="/" className="profile-primary-btn">
                Go to Home
              </Link>
            </article>
          ) : loading ? (
            <article className="profile-card profile-empty">
              <p>Loading superadmin dashboard…</p>
            </article>
          ) : !isSuperadmin ? (
            <article className="profile-card profile-empty">
              <h2>Access denied</h2>
              <p>{error || "Only superadmin users can access this page."}</p>
              <Link href="/profile" className="profile-secondary-btn">
                Back to Profile
              </Link>
            </article>
          ) : (
            <>
              <section className="admin-kpi-grid" aria-label="Platform overview">
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Total users</p>
                  <p className="admin-kpi-value">{overview?.totalUsers ?? 0}</p>
                  <p className="admin-kpi-foot">{overview?.newUsers30d ?? 0} new in last 30 days</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Paid users</p>
                  <p className="admin-kpi-value">{overview?.paidUsers ?? 0}</p>
                  <p className="admin-kpi-foot">Free users: {overview?.freeUsers ?? 0}</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Active / suspended</p>
                  <p className="admin-kpi-value">
                    {overview?.activeUsers ?? 0} / {overview?.suspendedUsers ?? 0}
                  </p>
                  <p className="admin-kpi-foot">Account lifecycle status</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Prompts this month</p>
                  <p className="admin-kpi-value">{overview?.monthUsage ?? 0}</p>
                  <p className="admin-kpi-foot">Period: {overview?.periodKey || "-"}</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Admin / superadmin</p>
                  <p className="admin-kpi-value">
                    {overview?.adminCount ?? 0} / {overview?.superadminCount ?? 0}
                  </p>
                  <p className="admin-kpi-foot">Subscribers: {overview?.subscriberCount ?? 0}</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Revenue (30d)</p>
                  <p className="admin-kpi-value">{formatAmount(overview?.monthRevenueSubunits ?? 0, "INR")}</p>
                  <p className="admin-kpi-foot">7d: {formatAmount(overview?.weekRevenueSubunits ?? 0, "INR")}</p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Payments (30d)</p>
                  <p className="admin-kpi-value">{overview?.paidPayments30d ?? 0} paid</p>
                  <p className="admin-kpi-foot">
                    Failed: {overview?.failedPayments30d ?? 0}, pending: {overview?.pendingPayments30d ?? 0}
                  </p>
                </article>
                <article className="admin-kpi-card">
                  <p className="admin-kpi-label">Audit actions (24h)</p>
                  <p className="admin-kpi-value">{overview?.adminActions24h ?? 0}</p>
                  <p className="admin-kpi-foot">Critical: {overview?.criticalActions24h ?? 0}</p>
                </article>
              </section>

              <section className="superadmin-top-grid" aria-label="Superadmin controls">
                <article className="profile-card">
                  <h2>Create admin account</h2>
                  <form className="superadmin-form" onSubmit={onCreateAdmin}>
                    <div className="superadmin-form-grid">
                      <input
                        className="superadmin-input"
                        type="email"
                        value={createEmail}
                        onChange={(event) => setCreateEmail(event.target.value)}
                        placeholder="Admin email"
                        autoComplete="email"
                        required
                      />
                      <input
                        className="superadmin-input"
                        type="password"
                        value={createPassword}
                        onChange={(event) => setCreatePassword(event.target.value)}
                        placeholder="Temporary password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      <select
                        className="superadmin-select"
                        value={createRole}
                        onChange={(event) => setCreateRole(event.target.value === "superadmin" ? "superadmin" : "admin")}
                        aria-label="Role for new admin"
                      >
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </div>
                    <div className="superadmin-form-actions">
                      <p className="billing-empty">New accounts start active on Free plan and can be reassigned instantly.</p>
                      <button
                        type="submit"
                        className="profile-secondary-btn"
                        disabled={createSubmitting}
                      >
                        {createSubmitting ? "Creating..." : "Create account"}
                      </button>
                    </div>
                  </form>
                </article>

                <article className="profile-card">
                  <div className="admin-controls">
                    <input
                      type="search"
                      className="admin-search-input"
                      placeholder="Search admin accounts"
                      value={searchAdmins}
                      onChange={(event) => setSearchAdmins(event.target.value)}
                      aria-label="Search admin accounts"
                    />
                    <button
                      type="button"
                      className="profile-secondary-btn"
                      onClick={() => void onRefresh()}
                      disabled={dataLoading || actionKey === "refresh"}
                    >
                      {dataLoading || actionKey === "refresh" ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table" aria-label="Admin accounts">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdmins.map((entry) => {
                          const rowBusy = actionKey === `status:${entry.id}` || actionKey === `role:${entry.id}`;
                          return (
                            <tr key={entry.id}>
                              <td>
                                <div className="admin-user-cell">
                                  <strong>{entry.email}</strong>
                                  <span>#{entry.id}</span>
                                </div>
                              </td>
                              <td>
                                <select
                                  className="admin-inline-select"
                                  value={entry.role}
                                  disabled={rowBusy || entry.id === user?.id}
                                  onChange={(event) => void onSetRole(entry.id, event.target.value as UserRole)}
                                  aria-label={`Change role for ${entry.email}`}
                                >
                                  <option value="admin">admin</option>
                                  <option value="superadmin">superadmin</option>
                                </select>
                              </td>
                              <td>
                                <div className="admin-status-cell">
                                  <span className={`admin-status-pill admin-status-${entry.status}`}>{entry.status}</span>
                                  <button
                                    type="button"
                                    className="admin-inline-btn"
                                    disabled={rowBusy || entry.id === user?.id}
                                    onClick={() => void onToggleStatus(entry.id, entry.status)}
                                  >
                                    {entry.status === "active" ? "Suspend" : "Activate"}
                                  </button>
                                </div>
                              </td>
                              <td>{formatDate(entry.createdAt)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-inline-btn"
                                  disabled={summaryLoading}
                                  onClick={() => void onInspectUser(entry.id)}
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredAdmins.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <p className="billing-empty">No admin accounts match this search.</p>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </article>
              </section>

              <article className="profile-card">
                <div className="admin-controls">
                  <input
                    type="search"
                    className="admin-search-input"
                    placeholder="Search all users by email, role, plan, status or id"
                    value={searchUsers}
                    onChange={(event) => setSearchUsers(event.target.value)}
                    aria-label="Search users"
                  />
                  <button
                    type="button"
                    className="profile-secondary-btn"
                    onClick={() => void onRefresh()}
                    disabled={dataLoading || actionKey === "refresh"}
                  >
                    {dataLoading || actionKey === "refresh" ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table" aria-label="Users">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Role</th>
                        <th>Usage</th>
                        <th>Joined</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((entry) => {
                        const rowBusy =
                          actionKey === `plan:${entry.id}` ||
                          actionKey === `status:${entry.id}` ||
                          actionKey === `role:${entry.id}`;
                        return (
                          <tr key={entry.id}>
                            <td>
                              <div className="admin-user-cell">
                                <strong>{entry.email}</strong>
                                <span>#{entry.id}</span>
                              </div>
                            </td>
                            <td>
                              <select
                                className="admin-inline-select"
                                value={entry.planCode}
                                disabled={rowBusy}
                                onChange={(event) =>
                                  void onSetPlan(entry.id, event.target.value as UserPlanCode)
                                }
                                aria-label={`Change plan for ${entry.email}`}
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="unlimited">Unlimited</option>
                              </select>
                            </td>
                            <td>
                              <div className="admin-status-cell">
                                <span className={`admin-status-pill admin-status-${entry.status}`}>
                                  {entry.status}
                                </span>
                                <button
                                  type="button"
                                  className="admin-inline-btn"
                                  disabled={rowBusy || entry.id === user?.id}
                                  onClick={() => void onToggleStatus(entry.id, entry.status)}
                                >
                                  {entry.status === "active" ? "Suspend" : "Activate"}
                                </button>
                              </div>
                            </td>
                            <td>
                              <select
                                className="admin-inline-select"
                                value={entry.role}
                                disabled={rowBusy || entry.id === user?.id}
                                onChange={(event) => void onSetRole(entry.id, event.target.value as UserRole)}
                                aria-label={`Change role for ${entry.email}`}
                              >
                                <option value="subscriber">subscriber</option>
                                <option value="admin">admin</option>
                                <option value="superadmin">superadmin</option>
                              </select>
                            </td>
                            <td>{formatUsage(entry.usageUsed, entry.usageLimit)}</td>
                            <td>{formatDate(entry.createdAt)}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-inline-btn"
                                disabled={summaryLoading}
                                onClick={() => void onInspectUser(entry.id)}
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7}>
                            <p className="billing-empty">No users match this search.</p>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="profile-card">
                <h2>User details</h2>
                {summaryLoading ? <p className="billing-empty">Loading user details…</p> : null}
                {!summaryLoading && !selectedSummary ? (
                  <p className="billing-empty">Select a user to inspect account, usage, and billing history.</p>
                ) : null}
                {!summaryLoading && selectedSummary ? (
                  <>
                    <div className="admin-summary-grid">
                      <div className="admin-summary-item">
                        <span>Email</span>
                        <strong>{selectedSummary.user.email}</strong>
                      </div>
                      <div className="admin-summary-item">
                        <span>Role</span>
                        <strong>{selectedSummary.user.role}</strong>
                      </div>
                      <div className="admin-summary-item">
                        <span>Status</span>
                        <strong>{selectedSummary.user.status}</strong>
                      </div>
                      <div className="admin-summary-item">
                        <span>Plan</span>
                        <strong>{formatPlanLabel(selectedSummary.user.planCode)}</strong>
                      </div>
                      <div className="admin-summary-item">
                        <span>Usage</span>
                        <strong>{formatUsage(selectedSummary.usage?.used ?? 0, selectedSummary.usage?.limit ?? null)}</strong>
                      </div>
                      <div className="admin-summary-item">
                        <span>Joined</span>
                        <strong>{formatDate(selectedSummary.user.createdAt)}</strong>
                      </div>
                    </div>

                    <div className="admin-mini-table-wrap">
                      <table className="admin-mini-table" aria-label="Recent billing orders">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Plan</th>
                            <th>Cycle</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSummary.orders.slice(0, 8).map((order) => (
                            <tr key={order.id}>
                              <td>{formatDate(order.createdAt)}</td>
                              <td>{formatPlanLabel(order.planCode)}</td>
                              <td>{order.billingCycle === "annual" ? "Annual" : "Monthly"}</td>
                              <td>{formatAmount(order.amountSubunits, order.currency)}</td>
                              <td>{order.status}</td>
                            </tr>
                          ))}
                          {selectedSummary.orders.length === 0 ? (
                            <tr>
                              <td colSpan={5}>No billing records for this user yet.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </article>

              <article className="profile-card">
                <h2>Recent platform audit</h2>
                <ul className="admin-audit-list" aria-label="Superadmin audit events">
                  {events.slice(0, 40).map((event) => (
                    <li key={event.id} className="admin-audit-item">
                      <div>
                        <p className="admin-audit-title">{event.action.replaceAll("_", " ")}</p>
                        <p className="admin-audit-meta">
                          {event.actorEmail || `admin#${event.actorUserId ?? "-"}`} →{" "}
                          {event.targetEmail || (event.targetUserId ? `user#${event.targetUserId}` : "system")}
                          {event.meta ? ` • ${formatAuditMeta(event.meta)}` : ""}
                        </p>
                      </div>
                      <span className="admin-audit-time">{formatDateTime(event.createdAt)}</span>
                    </li>
                  ))}
                  {events.length === 0 ? <li className="admin-audit-empty">No superadmin actions logged yet.</li> : null}
                </ul>
              </article>

              {message ? <p className="profile-message">{message}</p> : null}
              {error ? <p className="profile-error">{error}</p> : null}

              <div className="profile-actions">
                <Link href="/profile" className="profile-secondary-btn">
                  Back to Profile
                </Link>
                <Link href="/admin" className="profile-secondary-btn">
                  Admin dashboard
                </Link>
                <Link href="/" className="profile-secondary-btn">
                  Home
                </Link>
              </div>
            </>
          )}
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
              <Link href="/image-to-prompt-converter">Image to Prompt Converter</Link>
              <Link href="/image-prompt-generator">Image Prompt Generator</Link>
              <Link href="/gemini-ai-photo-prompt">Gemini AI Photo Prompt</Link>
              <Link href="/ai-gemini-photo-prompt">AI Gemini Photo Prompt</Link>
              <Link href="/google-gemini-ai-photo-prompt">Google Gemini AI Photo Prompt</Link>
              <Link href="/gemini-prompt">Gemini Prompt</Link>
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

function normalizeUserSnapshot(value: Partial<UserSnapshot> | undefined): UserSnapshot | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = normalizeUserRole(value.role);
  const status = normalizeUserStatus(value.status);
  if (!Number.isFinite(id) || id <= 0 || !email || !role || !status) return null;
  return { id, email, role, status };
}

function normalizeSuperadminOverview(value: Partial<SuperadminOverview> | undefined): SuperadminOverview | null {
  if (!value) return null;
  return {
    periodKey: typeof value.periodKey === "string" ? value.periodKey : "",
    totalUsers: Number.parseInt(String(value.totalUsers || 0), 10) || 0,
    activeUsers: Number.parseInt(String(value.activeUsers || 0), 10) || 0,
    suspendedUsers: Number.parseInt(String(value.suspendedUsers || 0), 10) || 0,
    paidUsers: Number.parseInt(String(value.paidUsers || 0), 10) || 0,
    freeUsers: Number.parseInt(String(value.freeUsers || 0), 10) || 0,
    newUsers30d: Number.parseInt(String(value.newUsers30d || 0), 10) || 0,
    monthUsage: Number.parseInt(String(value.monthUsage || 0), 10) || 0,
    subscriberCount: Number.parseInt(String(value.subscriberCount || 0), 10) || 0,
    adminCount: Number.parseInt(String(value.adminCount || 0), 10) || 0,
    superadminCount: Number.parseInt(String(value.superadminCount || 0), 10) || 0,
    monthRevenueSubunits: Number.parseInt(String(value.monthRevenueSubunits || 0), 10) || 0,
    weekRevenueSubunits: Number.parseInt(String(value.weekRevenueSubunits || 0), 10) || 0,
    lifetimeRevenueSubunits: Number.parseInt(String(value.lifetimeRevenueSubunits || 0), 10) || 0,
    paidPayments30d: Number.parseInt(String(value.paidPayments30d || 0), 10) || 0,
    failedPayments30d: Number.parseInt(String(value.failedPayments30d || 0), 10) || 0,
    pendingPayments30d: Number.parseInt(String(value.pendingPayments30d || 0), 10) || 0,
    adminActions24h: Number.parseInt(String(value.adminActions24h || 0), 10) || 0,
    criticalActions24h: Number.parseInt(String(value.criticalActions24h || 0), 10) || 0
  };
}

function normalizeAdminUser(value: Partial<AdminUserRecord> | undefined): AdminUserRecord | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = normalizeUserRole(value.role);
  const status = normalizeUserStatus(value.status);
  const planCode = normalizePlanCode(value.planCode);
  if (!Number.isFinite(id) || id <= 0 || !email || !role || !status || !planCode) return null;

  const usageUsed = Number.parseInt(String(value.usageUsed || 0), 10) || 0;
  const usageLimitRaw = value.usageLimit;
  const usageLimit =
    usageLimitRaw === null || usageLimitRaw === undefined
      ? null
      : Number.isFinite(Number(usageLimitRaw))
        ? Number(usageLimitRaw)
        : null;

  return {
    id,
    email,
    role,
    status,
    planCode,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null,
    usageUsed,
    usageLimit,
    subscriptionStatus: typeof value.subscriptionStatus === "string" ? value.subscriptionStatus : "",
    renewsAt: typeof value.renewsAt === "string" ? value.renewsAt : null
  };
}

function normalizeAdminAccount(value: Partial<AdminAccountRecord> | undefined): AdminAccountRecord | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = normalizeUserRole(value.role);
  const status = normalizeUserStatus(value.status);
  const planCode = normalizePlanCode(value.planCode);

  if (!Number.isFinite(id) || id <= 0 || !email || !role || !status || !planCode) {
    return null;
  }

  return {
    id,
    email,
    role,
    status,
    planCode,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null
  };
}

function normalizeUsageSnapshot(value: Partial<UsageSnapshot> | undefined): UsageSnapshot | null {
  if (!value) return null;
  const periodKey = typeof value.periodKey === "string" ? value.periodKey : "";
  const used = Number.parseInt(String(value.used || 0), 10);
  const limitRaw = value.limit;
  const remainingRaw = value.remaining;
  const limit = limitRaw === null || limitRaw === undefined ? null : Number(limitRaw);
  const remaining = remainingRaw === null || remainingRaw === undefined ? null : Number(remainingRaw);

  if (!periodKey || !Number.isFinite(used)) return null;
  return {
    periodKey,
    used,
    limit: limit === null || !Number.isFinite(limit) ? null : limit,
    remaining: remaining === null || !Number.isFinite(remaining) ? null : remaining
  };
}

function normalizeSubscriptionSnapshot(
  value: Partial<SubscriptionSnapshot> | undefined
): SubscriptionSnapshot | null {
  if (!value) return null;
  const planCode = normalizePlanCode(value.planCode);
  const planName = typeof value.planName === "string" ? value.planName.trim() : "";
  const status = typeof value.status === "string" ? value.status.trim() : "";
  const monthlyQuotaRaw = value.monthlyQuota;
  const monthlyQuota =
    monthlyQuotaRaw === null || monthlyQuotaRaw === undefined
      ? null
      : Number.isFinite(Number(monthlyQuotaRaw))
        ? Number(monthlyQuotaRaw)
        : null;
  const priceUsdCents = Number.parseInt(String(value.priceUsdCents || 0), 10);

  if (!planCode || !planName || !status || !Number.isFinite(priceUsdCents)) {
    return null;
  }

  return {
    id: Number.parseInt(String(value.id || 0), 10) || null,
    userId: Number.parseInt(String(value.userId || 0), 10) || null,
    planCode,
    planName,
    status,
    monthlyQuota,
    priceUsdCents,
    renewsAt: typeof value.renewsAt === "string" ? value.renewsAt : null
  };
}

function normalizeBillingOrder(value: Partial<BillingOrder> | undefined): BillingOrder | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    planCode: typeof value.planCode === "string" ? value.planCode : "",
    billingCycle: value.billingCycle === "annual" ? "annual" : "monthly",
    amountSubunits: Number.parseInt(String(value.amountSubunits || 0), 10) || 0,
    currency: typeof value.currency === "string" ? value.currency.trim().toUpperCase() : "",
    status: typeof value.status === "string" ? value.status : "",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null
  };
}

function normalizeAdminAuditEvent(value: Partial<AdminAuditEvent> | undefined): AdminAuditEvent | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  const action = typeof value.action === "string" ? value.action.trim() : "";
  if (!Number.isFinite(id) || id <= 0 || !action) return null;

  const meta = normalizeMetaObject(value.meta);
  return {
    id,
    action,
    actorUserId: Number.parseInt(String(value.actorUserId || 0), 10) || null,
    actorEmail: typeof value.actorEmail === "string" ? value.actorEmail : "",
    targetUserId: Number.parseInt(String(value.targetUserId || 0), 10) || null,
    targetEmail: typeof value.targetEmail === "string" ? value.targetEmail : "",
    meta,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : null
  };
}

function normalizeAdminUserSummaryUser(
  value: Partial<UserSnapshot> | undefined
): AdminUserSummary["user"] | null {
  if (!value) return null;
  const id = Number.parseInt(String(value.id || 0), 10);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = normalizeUserRole(value.role);
  const status = normalizeUserStatus(value.status);
  const planCode = normalizePlanCode((value as { planCode?: unknown }).planCode);
  const createdAt =
    typeof (value as { createdAt?: unknown }).createdAt === "string"
      ? (value as { createdAt: string }).createdAt
      : null;

  if (!Number.isFinite(id) || id <= 0 || !email || !role || !status || !planCode) {
    return null;
  }

  return {
    id,
    email,
    role,
    status,
    planCode,
    createdAt
  };
}

function normalizeMetaObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeUserRole(value: unknown): UserRole | null {
  if (value === "subscriber" || value === "admin" || value === "superadmin") {
    return value;
  }
  return null;
}

function normalizeUserStatus(value: unknown): UserStatus | null {
  if (value === "active" || value === "suspended") {
    return value;
  }
  return null;
}

function normalizePlanCode(value: unknown): UserPlanCode | null {
  if (value === "free" || value === "pro" || value === "unlimited") {
    return value;
  }
  return null;
}

function formatPlanLabel(value: unknown): string {
  if (value === "free") return "Free";
  if (value === "pro") return "Pro";
  if (value === "unlimited") return "Unlimited";
  return String(value || "-");
}

function formatUsage(used: number, limit: number | null): string {
  if (limit === null) {
    return `${used} used / unlimited`;
  }
  return `${used}/${limit}`;
}

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

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

function formatAuditMeta(meta: Record<string, unknown>): string {
  const keys = ["role", "status", "planCode", "email"];
  const chunks: string[] = [];
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      chunks.push(`${key}: ${value.trim()}`);
    }
  }
  if (chunks.length > 0) {
    return chunks.join(" • ");
  }

  const serialized = JSON.stringify(meta);
  return serialized.length > 120 ? `${serialized.slice(0, 117)}...` : serialized;
}
