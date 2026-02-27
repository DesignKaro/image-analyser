"use client";

import Link from "next/link";
import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import { UsageSnapshot } from "../lib/saas-types";
import { BrandMarkIcon, CopyIcon, UploadIcon } from "../ui/icons";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_API_PAYLOAD_IMAGE_BYTES = 850 * 1024;
const MAX_BULK_FILES = 30;

type BulkItemStatus = "queued" | "processing" | "done" | "error" | "skipped";

type BulkItem = {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl: string;
  status: BulkItemStatus;
  prompt: string;
  error: string;
  requestId: string;
};

type DescribeApiPayload = {
  ok?: boolean;
  description?: string;
  error?: string;
  requestId?: string;
  usage?: Partial<UsageSnapshot>;
};

type RequestError = Error & {
  status?: number;
};

type GenerateResult = {
  description: string;
  requestId: string;
  usage: UsageSnapshot | null;
};

function createBulkId(file: File): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${file.name}-${file.size}-${file.lastModified}-${randomPart}`;
}

function normalizeUsageSnapshot(value: Partial<UsageSnapshot> | undefined): UsageSnapshot | null {
  if (!value) return null;
  const periodKey = typeof value.periodKey === "string" ? value.periodKey.trim() : "";
  const used = Number.isFinite(Number(value.used)) ? Number(value.used) : NaN;
  const limitRaw = value.limit;
  const remainingRaw = value.remaining;
  const limit = limitRaw === null ? null : Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : NaN;
  const remaining = remainingRaw === null ? null : Number.isFinite(Number(remainingRaw)) ? Number(remainingRaw) : NaN;
  if (!periodKey || !Number.isFinite(used)) return null;
  if (limit !== null && !Number.isFinite(limit)) return null;
  if (remaining !== null && !Number.isFinite(remaining)) return null;
  return { periodKey, used, limit, remaining };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatUsageLine(usage: UsageSnapshot | null): string {
  if (!usage) {
    return "Usage updates after generation";
  }
  if (usage.limit === null) {
    return `${usage.used} used this month • Unlimited plan`;
  }
  const remaining = usage.remaining ?? Math.max(0, usage.limit - usage.used);
  return `${usage.used}/${usage.limit} used • ${remaining} left`;
}

function navUsageLineFrom(usageLine: string): string {
  if (!usageLine) return usageLine;
  if (usageLine.endsWith("Unlimited plan"))
    return usageLine.replace(/ used this month • Unlimited plan$/, " used • Unlimited");
  if (usageLine === "Unlimited monthly generations") return "Unlimited";
  return usageLine;
}

function statusLabel(status: BulkItemStatus): string {
  if (status === "processing") return "Generating";
  if (status === "done") return "Done";
  if (status === "error") return "Failed";
  if (status === "skipped") return "Skipped";
  return "Queued";
}

function isLimitReachedError(status?: number, message?: string): boolean {
  if (status === 402) return true;
  const lower = (message || "").toLowerCase();
  return lower.includes("monthly usage limit reached") || lower.includes("upgrade your plan");
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Invalid file result."));
    };
    reader.onerror = () => reject(new Error("File read failed."));
    reader.readAsDataURL(file);
  });
}

function stringSizeInBytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image decode failed."));
    image.src = dataUrl;
  });
}

function renderCompressedDataUrl(image: HTMLImageElement, maxDimension: number, quality: number): string {
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, maxDimension / longestEdge);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas context unavailable.");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function prepareImageDataUrlForApi(file: File): Promise<string> {
  const originalDataUrl = await fileToDataUrl(file);
  if (stringSizeInBytes(originalDataUrl) <= MAX_API_PAYLOAD_IMAGE_BYTES) {
    return originalDataUrl;
  }

  const image = await loadImageElement(originalDataUrl);
  const maxDimensions = [1600, 1280, 1024, 896, 768, 640];
  const qualities = [0.86, 0.76, 0.66];
  let smallestCandidate = originalDataUrl;

  for (const maxDimension of maxDimensions) {
    for (const quality of qualities) {
      const candidate = renderCompressedDataUrl(image, maxDimension, quality);
      if (stringSizeInBytes(candidate) < stringSizeInBytes(smallestCandidate)) {
        smallestCandidate = candidate;
      }
      if (stringSizeInBytes(candidate) <= MAX_API_PAYLOAD_IMAGE_BYTES) {
        return candidate;
      }
    }
  }

  if (stringSizeInBytes(smallestCandidate) <= MAX_API_PAYLOAD_IMAGE_BYTES) {
    return smallestCandidate;
  }
  throw new Error("Image payload too large after compression.");
}

export default function BulkPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<BulkItem[]>([]);

  const [authToken, setAuthToken] = useState("");
  const [items, setItems] = useState<BulkItem[]>([]);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const backendUrl = useMemo(() => resolveBackendUrl(), []);

  const usageLine = useMemo(
    () => formatUsageLine(usage),
    [usage]
  );
  const navUsageLine = useMemo(() => navUsageLineFrom(usageLine), [usageLine]);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    setAuthToken(token || "");
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const next = Math.min(1, Math.max(0, window.scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((current) => (Math.abs(current - next) > 0.001 ? next : current));
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

  const stats = useMemo(() => {
    const total = items.length;
    const done = items.filter((item) => item.status === "done").length;
    const failed = items.filter((item) => item.status === "error").length;
    const queued = items.filter((item) => item.status === "queued").length;
    const processing = items.filter((item) => item.status === "processing").length;
    const skipped = items.filter((item) => item.status === "skipped").length;
    return { total, done, failed, queued, processing, skipped };
  }, [items]);

  function onSubscribeNewsletter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) return;
    setNewsletterMessage("Subscribed. Thank you for joining our newsletter.");
    setNewsletterEmail("");
  }

  const canRun = !running && items.some((item) => item.status === "queued" || item.status === "error" || item.status === "skipped");

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const imageFiles = selected.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setError("Only image files are supported.");
      event.target.value = "";
      return;
    }

    const current = itemsRef.current;
    const room = Math.max(0, MAX_BULK_FILES - current.length);
    const accepted = imageFiles.slice(0, room);

    if (!accepted.length) {
      setError(`You can upload up to ${MAX_BULK_FILES} images per batch.`);
      event.target.value = "";
      return;
    }

    const rejectedLarge = accepted.filter((file) => file.size > MAX_UPLOAD_BYTES);
    const finalFiles = accepted.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    if (!finalFiles.length) {
      setError(`Each image must be under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
      event.target.value = "";
      return;
    }

    const nextItems: BulkItem[] = finalFiles.map((file) => ({
      id: createBulkId(file),
      file,
      name: file.name,
      sizeBytes: file.size,
      previewUrl: URL.createObjectURL(file),
      status: "queued",
      prompt: "",
      error: "",
      requestId: ""
    }));

    setItems((prev) => [...prev, ...nextItems]);
    setError("");
    setMessage(
      rejectedLarge.length
        ? `${nextItems.length} image(s) added. ${rejectedLarge.length} skipped for size limit.`
        : `${nextItems.length} image(s) added to batch.`
    );
    event.target.value = "";
  }

  function onOpenFilePicker() {
    inputRef.current?.click();
  }

  function onRemoveItem(id: string) {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return next;
    });
  }

  function onClearAll() {
    for (const item of itemsRef.current) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setItems([]);
    setMessage("Batch cleared.");
    setError("");
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function requestPromptForItem(item: BulkItem): Promise<GenerateResult> {
    const imageDataUrl = await prepareImageDataUrlForApi(item.file);
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${backendUrl}/api/describe-image`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        imageDataUrl
      })
    });

    const payload = (await response.json().catch(() => ({}))) as DescribeApiPayload;
    if (!response.ok || !payload.ok || !payload.description) {
      const requestError = new Error(payload.error || "Could not generate prompt.") as RequestError;
      requestError.status = response.status;
      throw requestError;
    }

    return {
      description: payload.description,
      requestId: typeof payload.requestId === "string" ? payload.requestId : "",
      usage: normalizeUsageSnapshot(payload.usage)
    };
  }

  async function runGeneration(targetIds?: string[]) {
    const ids = targetIds?.length
      ? targetIds
      : itemsRef.current
          .filter((item) => item.status === "queued" || item.status === "error" || item.status === "skipped")
          .map((item) => item.id);

    if (!ids.length) {
      setError("Add images before generating prompts.");
      return;
    }

    setRunning(true);
    setError("");
    setMessage(`Processing ${ids.length} image(s)...`);

    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) {
        continue;
      }

      updateItem(id, { status: "processing", error: "" });

      try {
        const result = await requestPromptForItem(item);
        updateItem(id, {
          status: "done",
          prompt: result.description,
          error: "",
          requestId: result.requestId
        });
        if (result.usage) {
          setUsage(result.usage);
        }
      } catch (generationError) {
        const requestError = generationError as RequestError;
        const messageText = requestError?.message || "Prompt generation failed.";
        const reachedLimit = isLimitReachedError(requestError?.status, messageText);

        updateItem(id, {
          status: "error",
          error: messageText
        });

        if (reachedLimit) {
          const remainingIds = new Set(ids.slice(index + 1));
          setItems((prev) =>
            prev.map((entry) =>
              remainingIds.has(entry.id)
                ? {
                    ...entry,
                    status: "skipped",
                    error: "Skipped because your monthly prompt limit is reached."
                  }
                : entry
            )
          );
          setError("Usage limit reached. Upgrade your plan to continue this batch.");
          break;
        }
      }
    }

    setMessage("Batch run finished. Review results below.");
    setRunning(false);
  }

  async function onCopyPrompt(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Prompt copied to clipboard.");
    } catch {
      setError("Could not copy prompt.");
    }
  }

  async function onCopyAll() {
    const compiled = items
      .filter((item) => item.status === "done" && item.prompt)
      .map((item, idx) => `# ${idx + 1}. ${item.name}\n${item.prompt}`)
      .join("\n\n");
    if (!compiled) {
      setError("No generated prompts to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(compiled);
      setMessage("All prompts copied.");
    } catch {
      setError("Could not copy prompts.");
    }
  }

  function onDownloadCsv() {
    if (!items.length) {
      setError("No rows to export.");
      return;
    }
    const escapeCsv = (value: string) => `"${String(value).replace(/"/g, "\"\"")}"`;
    const lines = [
      ["file_name", "status", "request_id", "prompt", "error"].map(escapeCsv).join(","),
      ...items.map((item) =>
        [item.name, item.status, item.requestId, item.prompt, item.error].map(escapeCsv).join(",")
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bulk-image-prompts-${Date.now()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="site-shell bulk-page" data-nav-scrolled={headerScrollProgress > 0.08 ? "" : undefined}>
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
            <span className="nav-usage-pill" title={usageLine}>{navUsageLine}</span>
          </div>
        </div>
      </header>

      <main className="profile-main bulk-main">
        <section className="container profile-shell bulk-shell">
          <div className="profile-head bulk-head">
            <h1>Bulk Image to Prompt Converter</h1>
            <p>Upload multiple images, generate prompts in one run, then copy or export all results.</p>
          </div>

          <article className="profile-card bulk-upload-card">
            <div className="bulk-upload-row">
              <input
                ref={inputRef}
                className="bulk-file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={onFilesSelected}
              />
              <button type="button" className="upload-button" onClick={onOpenFilePicker} disabled={running}>
                <UploadIcon className="button-icon" />
                Add Images
              </button>
              <button type="button" className="profile-secondary-btn" onClick={() => void runGeneration()} disabled={!canRun}>
                {running ? "Generating..." : "Generate All Prompts"}
              </button>
              <button type="button" className="profile-secondary-btn" onClick={onCopyAll} disabled={!stats.done}>
                <CopyIcon className="button-icon" />
                Copy All
              </button>
              <button type="button" className="profile-secondary-btn" onClick={onDownloadCsv} disabled={!items.length}>
                Export CSV
              </button>
              <button type="button" className="profile-secondary-btn" onClick={onClearAll} disabled={!items.length || running}>
                Clear
              </button>
            </div>
            <p className="bulk-upload-help">
              Supports up to {MAX_BULK_FILES} images per batch. Max file size {Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB each.
            </p>
          </article>

          <article className="profile-card bulk-stats-card">
            <div className="bulk-stats-grid">
              <p>
                <strong>{stats.total}</strong>
                <span>Total</span>
              </p>
              <p>
                <strong>{stats.done}</strong>
                <span>Done</span>
              </p>
              <p>
                <strong>{stats.processing}</strong>
                <span>Running</span>
              </p>
              <p>
                <strong>{stats.failed}</strong>
                <span>Failed</span>
              </p>
              <p>
                <strong>{stats.skipped}</strong>
                <span>Skipped</span>
              </p>
            </div>
            {message ? <p className="profile-message">{message}</p> : null}
            {error ? <p className="profile-error">{error}</p> : null}
          </article>

          <article className="profile-card bulk-results-card">
            {!items.length ? (
              <div className="profile-empty">
                <h2>No images in batch</h2>
                <p>Add images to start bulk prompt generation.</p>
              </div>
            ) : (
              <div className="bulk-grid">
                {items.map((item) => (
                  <article key={item.id} className="bulk-item-card">
                    <div className="bulk-item-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt={item.name} />
                      <div>
                        <p className="bulk-item-name">{item.name}</p>
                        <p className="bulk-item-meta">{formatBytes(item.sizeBytes)}</p>
                      </div>
                      <span className={`bulk-status bulk-status-${item.status}`}>{statusLabel(item.status)}</span>
                    </div>

                    <div className="bulk-item-body">
                      {item.prompt ? (
                        <p>{item.prompt}</p>
                      ) : item.error ? (
                        <p className="bulk-item-error">{item.error}</p>
                      ) : (
                        <p className="bulk-item-muted">Prompt will appear here after generation.</p>
                      )}
                    </div>

                    <div className="bulk-item-actions">
                      <button
                        type="button"
                        className="profile-secondary-btn"
                        onClick={() => void runGeneration([item.id])}
                        disabled={running || item.status === "processing"}
                      >
                        {item.status === "done" ? "Regenerate" : "Generate"}
                      </button>
                      <button
                        type="button"
                        className="profile-secondary-btn"
                        onClick={() => void onCopyPrompt(item.prompt)}
                        disabled={!item.prompt}
                      >
                        <CopyIcon className="button-icon" />
                        Copy
                      </button>
                      <button
                        type="button"
                        className="profile-secondary-btn"
                        onClick={() => onRemoveItem(item.id)}
                        disabled={running}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>

      <footer className="footer footer-simple" id="pricing">
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
