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

type AdminTab = "overview" | "users" | "user-details" | "activity";

type BillingOrder = {
  id: number;
  planCode: string;
  billingCycle: BillingCycle;
  amountSubunits: number;
  currency: string;
  status: string;
  createdAt: string | null;
};

type AdminOverview = {
  periodKey: string;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  paidUsers: number;
  freeUsers: number;
  newUsers30d: number;
  monthUsage: number;
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
  overview?: Partial<AdminOverview>;
  events?: Array<Partial<AdminAuditEvent>>;
  usage?: Partial<UsageSnapshot>;
  subscription?: Partial<SubscriptionSnapshot>;
  orders?: Array<Partial<BillingOrder>>;
};

export default function AdminPage() {
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<AdminUserSummary | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");

  const backendUrl = useMemo(() => {
    return resolveBackendUrl();
  }, []);

  const isAdminActor = user?.role === "admin" || user?.role === "superadmin";
  const isSuperadmin = user?.role === "superadmin";

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
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
  }, [search, users]);

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

  const loadAdminData = useCallback(
    async (token: string) => {
      setDataLoading(true);
      try {
        const [overviewRes, usersRes, eventsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/overview`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/admin/users`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/admin/audit`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const overviewPayload = (await overviewRes.json().catch(() => ({}))) as ApiPayload;
        const usersPayload = (await usersRes.json().catch(() => ({}))) as ApiPayload;
        const eventsPayload = (await eventsRes.json().catch(() => ({}))) as ApiPayload;

        if (!overviewRes.ok || !overviewPayload.ok) {
          throw new Error(overviewPayload.error || "Could not load admin overview.");
        }
        if (!usersRes.ok || !usersPayload.ok) {
          throw new Error(usersPayload.error || "Could not load users.");
        }
        if (!eventsRes.ok || !eventsPayload.ok) {
          throw new Error(eventsPayload.error || "Could not load audit log.");
        }

        const normalizedOverview = normalizeAdminOverview(overviewPayload.overview);
        const normalizedUsers = Array.isArray(usersPayload.users)
          ? usersPayload.users.map(normalizeAdminUser).filter((value): value is AdminUserRecord => Boolean(value))
          : [];
        const normalizedEvents = Array.isArray(eventsPayload.events)
          ? eventsPayload.events.map(normalizeAdminAuditEvent).filter((value): value is AdminAuditEvent => Boolean(value))
          : [];

        setOverview(normalizedOverview);
        setUsers(normalizedUsers);
        setEvents(normalizedEvents);
      } finally {
        setDataLoading(false);
      }
    },
    [backendUrl]
  );

  const refreshAll = useCallback(
    async (token: string, keepSummary = true) => {
      await loadAdminData(token);
      if (keepSummary && selectedUserId) {
        try {
          const summary = await loadSummary(token, selectedUserId);
          setSelectedSummary(summary);
        } catch {
          setSelectedSummary(null);
        }
      }
    },
    [loadAdminData, loadSummary, selectedUserId]
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

        if (nextUser.role !== "admin" && nextUser.role !== "superadmin") {
          setError("Admin access only.");
          setLoading(false);
          return;
        }

        await refreshAll(authToken, false);
        if (!cancelled) {
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load admin dashboard.");
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

  const runAdminPost = useCallback(
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
    setAdminTab("user-details");
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
      await runAdminPost(`/api/admin/users/${targetUserId}/plan`, { planCode });
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
      !window.confirm("Suspend this user account?")
    ) {
      return;
    }

    setActionKey(`status:${targetUserId}`);
    setError("");
    setMessage("");
    try {
      await runAdminPost(`/api/admin/users/${targetUserId}/status`, { status: nextStatus });
      await refreshAll(authToken);
      setMessage(`User status updated to ${nextStatus}.`);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update status.");
    } finally {
      setActionKey("");
    }
  }

  async function onSetRole(targetUserId: number, role: UserRole) {
    if (!authToken || !isSuperadmin) return;
    setActionKey(`role:${targetUserId}`);
    setError("");
    setMessage("");
    try {
      await runAdminPost(`/api/admin/users/${targetUserId}/role`, { role });
      await refreshAll(authToken);
      setMessage(`Role updated to ${role}.`);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Could not update role.");
    } finally {
      setActionKey("");
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

      <main className="profile-main admin-main">
        <section className="container profile-shell admin-shell">
          <div className="profile-head">
            <h1>Admin dashboard</h1>
            <p>Manage users, plans, roles, account status, and operational activity.</p>
          </div>

          {!authToken ? (
            <article className="profile-card profile-empty">
              <h2>Sign in required</h2>
              <p>Log in using your admin account to open this dashboard.</p>
              <Link href="/" className="profile-primary-btn">
                Go to Home
              </Link>
            </article>
          ) : loading ? (
            <article className="profile-card profile-empty">
              <p>Loading admin dashboard…</p>
            </article>
          ) : !isAdminActor ? (
            <article className="profile-card profile-empty">
              <h2>Access denied</h2>
              <p>{error || "Only admin and superadmin users can access this page."}</p>
              <Link href="/profile" className="profile-secondary-btn">
                Back to Profile
              </Link>
            </article>
          ) : (
            <>
              <div className="admin-layout">
                <aside className="admin-sidebar" aria-label="Admin navigation">
                  <nav className="admin-sidebar-nav">
                    <button
                      type="button"
                      className={`admin-sidebar-item ${adminTab === "overview" ? "is-active" : ""}`}
                      onClick={() => setAdminTab("overview")}
                      aria-current={adminTab === "overview" ? "page" : undefined}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      className={`admin-sidebar-item ${adminTab === "users" ? "is-active" : ""}`}
                      onClick={() => setAdminTab("users")}
                      aria-current={adminTab === "users" ? "page" : undefined}
                    >
                      Users
                    </button>
                    <button
                      type="button"
                      className={`admin-sidebar-item ${adminTab === "user-details" ? "is-active" : ""}`}
                      onClick={() => setAdminTab("user-details")}
                      aria-current={adminTab === "user-details" ? "page" : undefined}
                    >
                      User details
                      {selectedSummary ? (
                        <span className="admin-sidebar-badge" title={selectedSummary.user.email}>
                          1
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      className={`admin-sidebar-item ${adminTab === "activity" ? "is-active" : ""}`}
                      onClick={() => setAdminTab("activity")}
                      aria-current={adminTab === "activity" ? "page" : undefined}
                    >
                      Activity
                    </button>
                  </nav>
                  <div className="admin-sidebar-footer">
                    <button
                      type="button"
                      className="profile-secondary-btn admin-sidebar-refresh"
                      onClick={() => void onRefresh()}
                      disabled={dataLoading || actionKey === "refresh"}
                    >
                      {dataLoading || actionKey === "refresh" ? "Refreshing…" : "Refresh data"}
                    </button>
                    <Link href="/profile" className="profile-secondary-btn admin-sidebar-back">
                      Back to Profile
                    </Link>
                  </div>
                </aside>

                <div className="admin-content">
                  {message ? <p className="profile-message admin-content-message">{message}</p> : null}
                  {error ? <p className="profile-error admin-content-message">{error}</p> : null}

                  {adminTab === "overview" ? (
                    <section className="admin-tab-panel" aria-label="Overview">
                      <h2 className="admin-panel-title">Overview</h2>
                      <section className="admin-kpi-grid" aria-label="Key metrics">
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
                          <p className="admin-kpi-foot">Account health</p>
                        </article>
                        <article className="admin-kpi-card">
                          <p className="admin-kpi-label">Prompts this month</p>
                          <p className="admin-kpi-value">{overview?.monthUsage ?? 0}</p>
                          <p className="admin-kpi-foot">Period: {overview?.periodKey || "-"}</p>
                        </article>
                      </section>
                    </section>
                  ) : null}

                  {adminTab === "users" ? (
                    <section className="admin-tab-panel" aria-label="Users">
                      <h2 className="admin-panel-title">Users</h2>
                      <article className="profile-card">
                        <div className="admin-controls">
                          <input
                            type="search"
                            className="admin-search-input"
                            placeholder="Search by email, plan, role, status or id"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search users"
                          />
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
                                          disabled={rowBusy}
                                          onClick={() => void onToggleStatus(entry.id, entry.status)}
                                        >
                                          {entry.status === "active" ? "Suspend" : "Activate"}
                                        </button>
                                      </div>
                                    </td>
                                    <td>
                                      {isSuperadmin ? (
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
                                      ) : (
                                        <span className="admin-role-text">{entry.role}</span>
                                      )}
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
                    </section>
                  ) : null}

                  {adminTab === "user-details" ? (
                    <section className="admin-tab-panel" aria-label="User details">
                      <h2 className="admin-panel-title">User details</h2>
                      <article className="profile-card">
                        {summaryLoading ? <p className="billing-empty">Loading user details…</p> : null}
                        {!summaryLoading && !selectedSummary ? (
                          <p className="billing-empty">
                            Select a user from the Users tab and click Inspect to view their account.
                          </p>
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
                    </section>
                  ) : null}

                  {adminTab === "activity" ? (
                    <section className="admin-tab-panel" aria-label="Activity">
                      <h2 className="admin-panel-title">Recent admin actions</h2>
                      <article className="profile-card">
                        <ul className="admin-audit-list" aria-label="Admin audit events">
                          {events.slice(0, 20).map((event) => (
                            <li key={event.id} className="admin-audit-item">
                              <div>
                                <p className="admin-audit-title">{event.action.replaceAll("_", " ")}</p>
                                <p className="admin-audit-meta">
                                  {event.actorEmail || `admin#${event.actorUserId ?? "-"}`} →{" "}
                                  {event.targetEmail || (event.targetUserId ? `user#${event.targetUserId}` : "system")}
                                </p>
                              </div>
                              <span className="admin-audit-time">{formatDateTime(event.createdAt)}</span>
                            </li>
                          ))}
                          {events.length === 0 ? (
                            <li className="admin-audit-empty">No admin actions logged yet.</li>
                          ) : null}
                        </ul>
                      </article>
                    </section>
                  ) : null}
                </div>
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

function normalizeAdminOverview(value: Partial<AdminOverview> | undefined): AdminOverview | null {
  if (!value) return null;
  return {
    periodKey: typeof value.periodKey === "string" ? value.periodKey : "",
    totalUsers: Number.parseInt(String(value.totalUsers || 0), 10) || 0,
    activeUsers: Number.parseInt(String(value.activeUsers || 0), 10) || 0,
    suspendedUsers: Number.parseInt(String(value.suspendedUsers || 0), 10) || 0,
    paidUsers: Number.parseInt(String(value.paidUsers || 0), 10) || 0,
    freeUsers: Number.parseInt(String(value.freeUsers || 0), 10) || 0,
    newUsers30d: Number.parseInt(String(value.newUsers30d || 0), 10) || 0,
    monthUsage: Number.parseInt(String(value.monthUsage || 0), 10) || 0
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
      ? ((value as { createdAt: string }).createdAt)
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
