"use client";

import Link from "next/link";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import { UserRole } from "../lib/saas-types";
import { BrandMarkIcon, TrashIcon } from "../ui/icons";

type ApiResponse = {
  ok?: boolean;
  error?: string;
  prompts?: unknown;
  user?: Partial<UserSnapshot>;
};

type UserSnapshot = {
  email: string;
  role: UserRole;
};

type SavedPromptSnapshot = {
  id: number;
  requestId: string;
  model: string;
  description: string;
  imageUrl: string;
  sourcePageUrl: string;
  createdAt: string;
};

type PromptGroup = {
  key: string;
  label: string;
  order: number;
  prompts: SavedPromptSnapshot[];
};

export default function SavedPromptsPage() {
  const [authToken, setAuthToken] = useState("");
  const [prompts, setPrompts] = useState<SavedPromptSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPromptId, setDeletingPromptId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);

  const backendUrl = useMemo(() => resolveBackendUrl(), []);

  const loadPrompts = useCallback(
    async (token: string, options?: { refresh?: boolean }) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        setPrompts([]);
        return;
      }

      if (options?.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const [meResponse, promptsResponse] = await Promise.all([
          fetch(`${backendUrl}/api/me`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${backendUrl}/api/prompts/saved?limit=200`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const mePayload = (await meResponse.json().catch(() => ({}))) as ApiResponse;
        const promptsPayload = (await promptsResponse.json().catch(() => ({}))) as ApiResponse;

        if (!meResponse.ok || !mePayload.ok) {
          throw new Error(mePayload.error || "Could not load account.");
        }
        if (!promptsResponse.ok || !promptsPayload.ok) {
          throw new Error(promptsPayload.error || "Could not load saved prompts.");
        }

        setPrompts(normalizeSavedPromptList(promptsPayload.prompts));
      } catch (loadError) {
        const nextError =
          loadError instanceof Error ? loadError.message : "Could not load saved prompts.";
        setError(nextError);
        setPrompts([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [backendUrl]
  );

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
    const normalized = typeof token === "string" ? token.trim() : "";
    setAuthToken(normalized);
    if (!normalized) {
      setLoading(false);
      return;
    }
    void loadPrompts(normalized);
  }, [loadPrompts]);

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

  async function onRefresh() {
    if (!authToken) {
      return;
    }
    setMessage("");
    await loadPrompts(authToken, { refresh: true });
    setMessage("Saved prompts refreshed.");
    window.setTimeout(() => setMessage(""), 1400);
  }

  async function onCopyPrompt(text: string) {
    const promptText = typeof text === "string" ? text.trim() : "";
    if (!promptText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(promptText);
      setMessage("Prompt copied.");
      setError("");
      window.setTimeout(() => setMessage(""), 1400);
    } catch {
      setError("Could not copy prompt.");
    }
  }

  async function onDeletePrompt(promptId: number) {
    if (
      !authToken ||
      !Number.isFinite(promptId) ||
      promptId <= 0 ||
      (deletingPromptId !== null && deletingPromptId === promptId)
    ) {
      return;
    }
    setError("");
    setDeletingPromptId(promptId);
    try {
      const res = await fetch(`${backendUrl}/api/prompts/saved/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not delete prompt.");
      }
      setPrompts((prev) => prev.filter((p) => p.id !== promptId));
      setMessage("Prompt deleted.");
      window.setTimeout(() => setMessage(""), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete prompt.");
    } finally {
      setDeletingPromptId((current) => (current === promptId ? null : current));
    }
  }

  const filteredPrompts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return prompts;
    }

    return prompts.filter((prompt) => {
      const haystack = [
        prompt.description,
        prompt.model,
        prompt.sourcePageUrl,
        prompt.imageUrl,
        prompt.requestId
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [prompts, query]);

  const groupedPrompts = useMemo<PromptGroup[]>(() => {
    const groups = new Map<string, PromptGroup>();

    for (const prompt of filteredPrompts) {
      const bucket = getPromptBucket(prompt.createdAt);
      const existing = groups.get(bucket.key);
      if (existing) {
        existing.prompts.push(prompt);
      } else {
        groups.set(bucket.key, {
          key: bucket.key,
          label: bucket.label,
          order: bucket.order,
          prompts: [prompt]
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.order - a.order);
  }, [filteredPrompts]);

  return (
    <div className="site-shell profile-page saved-prompts-page">
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
        <section className="container profile-shell saved-prompts-shell">
          <div className="profile-head">
            <h1>Saved prompts</h1>
            <p>Organized prompt history from web and extension saves.</p>
          </div>

          {!authToken ? (
            <article className="profile-card profile-empty">
              <h2>Sign in required</h2>
              <p>Log in from home to view your saved prompts.</p>
              <Link href="/" className="profile-primary-btn">
                Go to Home
              </Link>
            </article>
          ) : loading ? (
            <article className="profile-card profile-empty">
              <p>Loading saved prompts…</p>
            </article>
          ) : (
            <article className="profile-card saved-prompts-page-card">
              <div className="saved-prompts-page-toolbar">
                <input
                  type="search"
                  className="saved-prompts-page-search"
                  placeholder="Search prompt text, model, source URL, request id..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <button
                  type="button"
                  className="profile-secondary-btn"
                  onClick={() => void onRefresh()}
                  disabled={refreshing}
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {message ? <p className="profile-message">{message}</p> : null}
              {error ? <p className="profile-error">{error}</p> : null}

              {groupedPrompts.length === 0 ? (
                <p className="saved-prompts-page-empty">
                  {query.trim() ? "No prompts match this search." : "No saved prompts yet. Save one to see it here."}
                </p>
              ) : (
                <div className="saved-prompts-page-groups">
                  {groupedPrompts.map((group) => (
                    <section className="saved-prompts-page-group" key={group.key}>
                      <h2>{group.label}</h2>
                      <div className="saved-prompts-page-list">
                        {group.prompts.map((prompt) => (
                          <article className="saved-prompts-page-item" key={`${prompt.id}-${prompt.requestId}`}>
                            <div className="saved-prompts-page-item-head">
                              <p>{formatSavedPromptTime(prompt.createdAt)}</p>
                              <div className="saved-prompts-page-item-actions">
                                <button type="button" onClick={() => void onCopyPrompt(prompt.description)}>
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void onDeletePrompt(prompt.id)}
                                  className="saved-prompts-page-item-delete"
                                  title={deletingPromptId === prompt.id ? "Deleting..." : "Delete prompt"}
                                  aria-label={deletingPromptId === prompt.id ? "Deleting prompt" : "Delete prompt"}
                                  disabled={deletingPromptId === prompt.id}
                                >
                                  <span className="saved-prompts-page-item-delete-label">
                                    {deletingPromptId === prompt.id ? "Deleting..." : "Delete"}
                                  </span>
                                  <TrashIcon className="saved-prompts-page-item-delete-icon" />
                                </button>
                              </div>
                            </div>
                            <p className="saved-prompts-page-item-text">{prompt.description}</p>
                            <div className="saved-prompts-page-item-foot">
                              {prompt.requestId ? <span>Request: {trimRequestId(prompt.requestId)}</span> : <span />}
                              {prompt.imageUrl ? (
                                <a href={prompt.imageUrl} target="_blank" rel="noreferrer">
                                  Open image
                                </a>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </article>
          )}
        </section>
      </main>
    </div>
  );
}

function normalizeSavedPromptList(value: unknown): SavedPromptSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => normalizeSavedPromptSnapshot(entry))
    .filter((entry): entry is SavedPromptSnapshot => Boolean(entry))
    .sort((a, b) => {
      const aTs = toTimestamp(a.createdAt);
      const bTs = toTimestamp(b.createdAt);
      return bTs - aTs;
    });
}

function normalizeSavedPromptSnapshot(value: unknown): SavedPromptSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const id = normalizeInteger(row.id);
  const requestId = typeof row.requestId === "string" ? row.requestId.trim() : "";
  const model = typeof row.model === "string" ? row.model.trim() : "";
  const description = typeof row.description === "string" ? row.description.trim() : "";
  const imageUrl = typeof row.imageUrl === "string" ? row.imageUrl.trim() : "";
  const sourcePageUrl = typeof row.sourcePageUrl === "string" ? row.sourcePageUrl.trim() : "";
  const createdAt = typeof row.createdAt === "string" ? row.createdAt.trim() : "";

  if (id === null || !description) {
    return null;
  }

  return {
    id,
    requestId,
    model,
    description,
    imageUrl,
    sourcePageUrl,
    createdAt
  };
}

function getPromptBucket(createdAt: string): { key: string; label: string; order: number } {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return { key: "unknown", label: "Recent", order: 0 };
  }

  const dayStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  const order = dayStart.getTime();
  const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;

  if (order === todayStart.getTime()) {
    return { key, label: "Today", order };
  }
  if (order === yesterdayStart.getTime()) {
    return { key, label: "Yesterday", order };
  }

  return {
    key,
    label: parsed.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }),
    order
  };
}

function formatSavedPromptTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recent";
  }

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function trimRequestId(value: string): string {
  if (value.length <= 14) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function toTimestamp(value: string): number {
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizeInteger(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.round(num);
}
