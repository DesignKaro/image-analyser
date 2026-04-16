"use client";

import Link from "next/link";
import { ChangeEvent, CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import { UsageSnapshot } from "../lib/saas-types";
import { BrandMarkIcon, CopyIcon, FileTextIcon, TrashIcon, UploadIcon, WandIcon } from "../ui/icons";
import { SiteFooter } from "../ui/site-footer";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_API_PAYLOAD_IMAGE_BYTES = 850 * 1024;
const MAX_BULK_FILES = 30;

const BULK_TRANSLATE_LANGUAGES: { code: string; label: string }[] = [
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" }
];

const BULK_FORMAT_OPTIONS = [
  { id: "structured", label: "Structured Prompt" },
  { id: "graphic-design", label: "Graphic Design" },
  { id: "json", label: "JSON" }
] as const;

const BULK_INTERFACE_CARDS = [
  {
    title: "Batch Upload and Queue",
    description: "Upload multiple images in one go and review file size, count, and queue status before you run generation."
  },
  {
    title: "One-Click Batch Generation",
    description: "Generate prompts for every queued image with a single action, then track done, failed, and skipped states in real time."
  },
  {
    title: "Export and Reuse Output",
    description: "Copy individual prompts, copy all prompts, or export a CSV so your team can reuse prompts in ChatGPT, Midjourney, and Gemini."
  }
];

const BULK_STEPS = [
  {
    title: "Step 1: Add your image set",
    description: "Upload up to 30 images in one batch. Keep each image below 15MB for stable processing."
  },
  {
    title: "Step 2: Select optional batch settings",
    description: "Choose one output format and one target language for all images when you need consistent prompt structure."
  },
  {
    title: "Step 3: Run bulk generation",
    description: "Start generation once and let the queue process each image. Failed rows stay visible so you can retry specific files."
  },
  {
    title: "Step 4: Copy, export, and publish",
    description: "Copy individual prompts for quick use or export a CSV to hand off prompts to content, design, or ad teams."
  }
];

const BULK_FEATURES = [
  {
    title: "Bulk image to prompt conversion",
    description: "Convert multiple images to prompts in one workflow instead of repeating the same single-image process."
  },
  {
    title: "Per-image status tracking",
    description: "See queue state for each file: queued, generating, done, failed, or skipped."
  },
  {
    title: "Flexible output formats",
    description: "Generate prompts in structured, graphic design, or JSON format for different production pipelines."
  },
  {
    title: "Built-in translation workflow",
    description: "Translate generated prompts into Hindi, Spanish, French, German, or Japanese when campaigns run across regions."
  },
  {
    title: "CSV export for operations",
    description: "Download file name, request ID, prompt output, and error notes in CSV for documentation and QA."
  },
  {
    title: "Usage-aware generation",
    description: "The interface shows usage feedback during runs so teams can manage quota before large production batches."
  }
];

const BULK_EXAMPLES = [
  {
    title: "Ecommerce product batch",
    imageUrl: "/Assets/stock-photo-159533631-1500x1000.jpg",
    imageAlt: "Product photography setup for bulk ecommerce listing generation",
    prompt:
      "Generate a clean ecommerce product prompt with front angle framing, accurate material texture, neutral backdrop, and conversion-focused visual hierarchy for marketplace listings."
  },
  {
    title: "Travel and landscape batch",
    imageUrl: "/Assets/reflective-sunset-lake-tahoe_t20_1WNjlO_86d68dec-479a-4ac2-bf10-fc5f7f5add34_1155x.webp",
    imageAlt: "Landscape photo used for travel prompt generation workflow",
    prompt:
      "Generate a travel scene prompt that preserves location depth, natural light direction, season mood, and foreground-to-background composition for editorial tourism content."
  },
  {
    title: "Portrait content batch",
    imageUrl: "/Assets/young-woman-admiring-beauty-of-an-almond-tree-free-photo.webp",
    imageAlt: "Portrait image used in bulk portrait prompt output example",
    prompt:
      "Generate a portrait prompt with accurate facial detail, natural skin texture, realistic background separation, and editorial-ready framing for social and campaign assets."
  }
];

const BULK_USE_CASES = [
  {
    title: "Ecommerce catalog teams",
    description: "Generate prompt-ready descriptions for large product image sets used in marketplace and D2C listings."
  },
  {
    title: "Creative and ad agencies",
    description: "Convert campaign moodboards and reference boards into reusable prompts for concept iteration."
  },
  {
    title: "Social media operations",
    description: "Process weekly content banks in one run and ship platform-ready prompt libraries faster."
  },
  {
    title: "Photography post-production",
    description: "Turn photo sets into structured prompt notes for editing direction, style matching, and client revisions."
  },
  {
    title: "Localization teams",
    description: "Create source prompts once and translate output for multilingual campaigns without redoing analysis."
  },
  {
    title: "In-house AI tooling teams",
    description: "Export prompt results to CSV and feed downstream automation or prompt management pipelines."
  }
];

const BULK_BENEFITS = [
  {
    title: "Faster turnaround on large image sets",
    description: "Replace repetitive single-image processing with a repeatable batch workflow."
  },
  {
    title: "Consistent prompt quality",
    description: "Apply one format and one language policy across an entire batch for cleaner outputs."
  },
  {
    title: "Lower manual copy effort",
    description: "Use copy-all and CSV export to reduce time spent moving prompt text between tools."
  },
  {
    title: "Better team handoff",
    description: "Request IDs, status, and exports make review and QA easier for distributed teams."
  },
  {
    title: "Scalable content production",
    description: "Run recurring bulk prompt generation for product launches, seasonal catalogs, and campaign bursts."
  },
  {
    title: "Clear operational visibility",
    description: "Track batch progress and errors at a glance without opening separate logs."
  }
];

const BULK_PRICING_CARDS = [
  {
    title: "Free",
    price: "Starter access",
    description: "Best for testing small batches and validating output style.",
    features: ["Single account usage", "Core bulk workflow", "Manual copy and CSV export"],
    cta: "Start Free",
    href: "/pricing",
    popular: false,
    dark: false
  },
  {
    title: "Pro",
    price: "Higher monthly quota",
    description: "Best for active teams running bulk image to prompt jobs every week.",
    features: ["Larger monthly capacity", "Priority-ready workflow", "Bulk format and language controls"],
    cta: "View Pro Pricing",
    href: "/pricing",
    popular: true,
    dark: false
  },
  {
    title: "Scale",
    price: "For heavy operations",
    description: "Best for high-volume catalogs, campaign operations, and agency pipelines.",
    features: ["Bulk-first workflow", "CSV-based handoff", "Designed for repeat production runs"],
    cta: "See All Plans",
    href: "/pricing",
    popular: false,
    dark: true
  }
];

const BULK_FAQS = [
  {
    question: "How many images can I process in one bulk run?",
    answer: "The bulk page accepts up to 30 images in one batch. You can run multiple batches back to back."
  },
  {
    question: "What file size limit applies to each image?",
    answer: "Each image can be up to 15MB. If a file is larger, it is skipped before the run starts."
  },
  {
    question: "Can I export all generated prompts at once?",
    answer: "Yes. Use Export CSV to download file name, status, request ID, prompt output, and error notes."
  },
  {
    question: "Can I rerun only failed images?",
    answer: "Yes. Failed rows stay in the list so you can regenerate only the files that need another attempt."
  },
  {
    question: "Does bulk mode support translation?",
    answer: "Yes. You can apply one target language to the full batch or translate prompts per item after generation."
  },
  {
    question: "Which prompt formats are available in bulk mode?",
    answer: "Bulk mode supports Structured Prompt, Graphic Design, and JSON output formats."
  },
  {
    question: "Is this suitable for ecommerce image libraries?",
    answer: "Yes. Bulk mode is built for repeating workflows such as product catalogs, ad creatives, and social asset banks."
  },
  {
    question: "Where can I view current plan limits and billing?",
    answer: "Open the Pricing and Billing pages to see active plan details, quota, and upgrade options."
  }
];

const BULK_SEO_GUIDE = [
  {
    heading: "What is a bulk image to prompt converter?",
    paragraphs: [
      "A bulk image to prompt converter analyzes multiple images and produces text prompts in one queue. It is useful when teams need consistent prompt output across large image sets.",
      "Instead of repeating one-image workflows, bulk conversion keeps naming, formatting, and export steps in one place."
    ]
  },
  {
    heading: "How to get better bulk prompt output",
    paragraphs: [
      "Use clear, high-resolution source images and group similar visual categories in the same run. This improves consistency in generated language and style.",
      "Choose one prompt format for the whole batch when outputs are meant for the same downstream tool or team."
    ]
  },
  {
    heading: "Bulk workflow for teams and agencies",
    paragraphs: [
      "Agencies and in-house teams often run weekly image batches for product launches, paid campaigns, and social calendars.",
      "CSV export makes it easier to route prompt output to reviewers, editors, and production teams without manual copy work."
    ]
  },
  {
    heading: "When to use bulk mode vs single image mode",
    paragraphs: [
      "Use single image mode when you need deep iteration on one asset. Use bulk mode when you need speed, consistency, and organized exports across many assets.",
      "Most teams combine both: bulk for first-pass prompt generation, then single mode for final refinements on top performers."
    ]
  }
];

const BULK_TRUST_CARDS = [
  {
    title: "Built for repeatable operations",
    description: "The workflow is optimized for recurring batches, not one-off demos."
  },
  {
    title: "Transparent batch status",
    description: "Every file shows a clear status so teams can quickly identify completed and failed items."
  },
  {
    title: "Export-ready output",
    description: "CSV output keeps prompt generation auditable and usable in production workflows."
  }
];

const BULK_REVIEWS = [
  {
    name: "Ananya S.",
    location: "Ecommerce Content Lead",
    date: "Jan 2026",
    title: "Cut our prompt prep time by more than half",
    body: "We process product launches in batches. Bulk mode removed repetitive manual prompt writing and made handoff cleaner."
  },
  {
    name: "David R.",
    location: "Creative Operations Manager",
    date: "Dec 2025",
    title: "CSV export made team review practical",
    body: "The export fields are straightforward. Our reviewers can validate prompts quickly and send edits back without extra tooling."
  },
  {
    name: "Meera K.",
    location: "Performance Marketing Team",
    date: "Nov 2025",
    title: "Useful for high-volume campaign assets",
    body: "We run image sets weekly for ads. Bulk generation with one format setting keeps output consistent across channels."
  }
];

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
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [batchFormat, setBatchFormat] = useState<string | null>(null);
  const [batchLanguage, setBatchLanguage] = useState<string | null>(null);
  const [headerScrollProgress, setHeaderScrollProgress] = useState(0);

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

  const selectedFormatLabel = useMemo(
    () => BULK_FORMAT_OPTIONS.find((entry) => entry.id === batchFormat)?.label || "Standard",
    [batchFormat]
  );
  const selectedLanguageLabel = useMemo(
    () => BULK_TRANSLATE_LANGUAGES.find((entry) => entry.code === batchLanguage)?.label || "English",
    [batchLanguage]
  );
  const batchBytesTotal = useMemo(
    () => items.reduce((total, item) => total + Math.max(0, item.sizeBytes), 0),
    [items]
  );
  const extraCreditsPerImage = (batchFormat ? 1 : 0) + (batchLanguage ? 1 : 0);
  const estimatedExtraCredits = extraCreditsPerImage * stats.total;

  const canRun = !running && items.length > 0;

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

  async function requestPromptForItem(
    item: BulkItem,
    options?: { promptFormat?: string; targetLanguage?: string }
  ): Promise<GenerateResult> {
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
        imageDataUrl,
        ...(options?.promptFormat ? { promptFormat: options.promptFormat } : {}),
        ...(options?.targetLanguage ? { targetLanguage: options.targetLanguage } : {})
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

  async function runGeneration(
    targetIds?: string[],
    options?: { promptFormat?: string; targetLanguage?: string }
  ) {
    const ids = targetIds?.length
      ? targetIds
      : itemsRef.current.map((item) => item.id);

    if (!ids.length) {
      setError("Add images before generating prompts.");
      return;
    }

    setRunning(true);
    setError("");
    setMessage(`Processing ${ids.length} image(s)...`);

    // Track generated results locally so we don't rely on async ref sync for translation
    const generatedItems: Array<{ id: string; file: File; prompt: string }> = [];

    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) {
        continue;
      }

      updateItem(id, { status: "processing", error: "" });

      try {
        const result = await requestPromptForItem(item, {
          promptFormat: options?.promptFormat,
          targetLanguage: options?.targetLanguage
        });
        updateItem(id, {
          status: "done",
          prompt: result.description,
          error: "",
          requestId: result.requestId
        });
        if (result.usage) {
          setUsage(result.usage);
        }
        generatedItems.push({ id, file: item.file, prompt: result.description });
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

    // No separate translate step needed — language is baked into describe-image now

    setMessage("Batch run finished. Review results below.");
    setRunning(false);
  }

  async function translateItem(itemId: string, targetLangCode: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item?.prompt || item.status !== "done") return;
    if (!authToken) {
      setError("Sign in to translate prompts.");
      return;
    }
    setTranslatingId(itemId);
    setError("");
    try {
      const imageDataUrl = await prepareImageDataUrlForApi(item.file);
      const response = await fetch(`${backendUrl}/api/translate-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          imageDataUrl,
          description: item.prompt,
          targetLanguage: targetLangCode,
          model: DEFAULT_MODEL
        })
      });
      const payload = (await response.json().catch(() => ({}))) as DescribeApiPayload & { description?: string };
      if (!response.ok || !payload.ok || !payload.description) {
        setError(payload?.error || "Translation failed.");
        return;
      }
      const text = typeof payload.description === "string" ? payload.description.trim() : "";
      if (text) {
        updateItem(itemId, { prompt: text });
        setMessage(`Prompt translated to ${BULK_TRANSLATE_LANGUAGES.find((l) => l.code === targetLangCode)?.label || targetLangCode}.`);
      }
      if (payload.usage) {
        setUsage(normalizeUsageSnapshot(payload.usage));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setTranslatingId(null);
    }
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
            <div className="bulk-upload-top">
              <div className="bulk-intake-column">
                <input
                  ref={inputRef}
                  className="bulk-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onFilesSelected}
                />
                <button type="button" className="upload-button bulk-add-btn" onClick={onOpenFilePicker} disabled={running}>
                  <UploadIcon className="button-icon" />
                  Add Images
                </button>
                <div className="bulk-intake-meta" aria-live="polite">
                  <p>
                    <strong>{stats.total}</strong> image{stats.total === 1 ? "" : "s"} in queue
                  </p>
                  <span>{formatBytes(batchBytesTotal)} selected</span>
                </div>
              </div>

              <div className="bulk-batch-options" aria-label="Batch settings">
                <div className="bulk-batch-options-head">
                  <h3>Batch settings</h3>
                  <p>Choose one format and one language for all queued images.</p>
                </div>
                <div className="bulk-batch-option-grid">
                <div className="bulk-batch-option-group">
                  <span className="bulk-batch-option-label">Format</span>
                  <div className="bulk-batch-tags">
                    {BULK_FORMAT_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        className={`bulk-batch-tag ${batchFormat === id ? "is-active" : ""}`}
                        onClick={() => setBatchFormat(batchFormat === id ? null : id)}
                        disabled={running}
                        title="+1 credit per image"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bulk-batch-option-group">
                  <span className="bulk-batch-option-label">Language</span>
                  <div className="bulk-batch-tags">
                    <button
                      type="button"
                      className={`bulk-batch-tag ${!batchLanguage ? "is-active" : ""}`}
                      onClick={() => setBatchLanguage(null)}
                      disabled={running}
                    >
                      English
                    </button>
                    {BULK_TRANSLATE_LANGUAGES.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        className={`bulk-batch-tag ${batchLanguage === code ? "is-active" : ""}`}
                        onClick={() => setBatchLanguage(batchLanguage === code ? null : code)}
                        disabled={running}
                        title="+1 credit per image"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                </div>
                <div className="bulk-batch-selection-summary">
                  <span className="bulk-batch-selection-chip">Format: {selectedFormatLabel}</span>
                  <span className="bulk-batch-selection-chip">Language: {selectedLanguageLabel}</span>
                  <span className="bulk-batch-selection-chip">
                    Extra credits: {extraCreditsPerImage > 0 ? `+${extraCreditsPerImage}/image` : "None"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bulk-upload-actions">
              <div className="bulk-upload-actions-primary">
                <button
                  type="button"
                  className="bulk-generate-btn"
                  onClick={() =>
                    void runGeneration(undefined, {
                      promptFormat: batchFormat ?? undefined,
                      targetLanguage: batchLanguage ?? undefined
                    })
                  }
                  disabled={!canRun}
                >
                  <WandIcon className="button-icon" />
                  {running ? "Generating…" : "Generate All Prompts"}
                </button>
                <p className="bulk-run-note">
                  {stats.total
                    ? `Ready to run on ${stats.total} image${stats.total === 1 ? "" : "s"}`
                    : "Add images to start a batch"}
                </p>
              </div>
              <div className="bulk-upload-actions-secondary">
                <button type="button" className="profile-secondary-btn bulk-action-btn" onClick={onCopyAll} disabled={!stats.done}>
                  <CopyIcon className="button-icon" />
                  Copy All
                </button>
                <button type="button" className="profile-secondary-btn bulk-action-btn" onClick={onDownloadCsv} disabled={!items.length}>
                  <FileTextIcon className="button-icon" />
                  Export CSV
                </button>
                <button
                  type="button"
                  className="profile-secondary-btn bulk-action-btn"
                  onClick={onClearAll}
                  disabled={!items.length || running}
                >
                  <TrashIcon className="button-icon" />
                  Clear
                </button>
              </div>
            </div>

            <p className="bulk-upload-help">
              Up to {MAX_BULK_FILES} images per batch. Max file size {Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB each.
              {" "}
              {estimatedExtraCredits > 0
                ? `Current batch options add about +${estimatedExtraCredits} extra credits.`
                : "No additional option credits selected."}
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

                    <div className="bulk-item-options">
                      <div className="bulk-item-format-row">
                        <span className="bulk-item-option-label">Format</span>
                        <div className="bulk-item-format-tags">
                          {BULK_FORMAT_OPTIONS.map(({ id, label }) => {
                            const isGenerating = running && item.status === "processing";
                            return (
                              <button
                                key={id}
                                type="button"
                                className="bulk-item-format-tag"
                                onClick={() => void runGeneration([item.id], { promptFormat: id })}
                                disabled={running}
                                title="+1 credit"
                              >
                                {isGenerating ? "Generating…" : label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {item.prompt && item.status === "done" ? (
                        <div className="bulk-item-lang-row">
                          <span className="bulk-item-option-label">Translate</span>
                          <div className="bulk-item-lang-tags">
                            {BULK_TRANSLATE_LANGUAGES.map(({ code, label }) => {
                              const isTranslating = translatingId === item.id;
                              return (
                                <button
                                  key={code}
                                  type="button"
                                  className="bulk-item-lang-tag"
                                  onClick={() => void translateItem(item.id, code)}
                                  disabled={!!translatingId}
                                  title="1 credit"
                                >
                                  {isTranslating ? "…" : label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
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

        <section className="container tool-interface-section" id="bulk-tool-interface" aria-label="How bulk image to prompt works">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Bulk workflow</p>
            <h2>How the bulk image to prompt converter works</h2>
            <p>
              This page is designed for teams that need to convert multiple images into prompts in one repeatable process.
            </p>
          </div>
          <div className="tool-interface-grid">
            {BULK_INTERFACE_CARDS.map((card) => (
              <article key={card.title} className="tool-interface-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-how-section" id="bulk-how-to-use" aria-label="How to use bulk converter">
          <div className="tool-section-head">
            <p className="tool-section-kicker">How to use</p>
            <h2>Step-by-step bulk prompt generation</h2>
            <p>Follow this process to generate, review, and export prompts for large image sets.</p>
          </div>
          <ol className="tool-step-list">
            {BULK_STEPS.map((step) => (
              <li key={step.title} className="tool-step-card">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container tool-features-section" id="bulk-features" aria-label="Bulk image to prompt features">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Features</p>
            <h2>Bulk image to prompt features for production teams</h2>
          </div>
          <div className="tool-feature-grid">
            {BULK_FEATURES.map((feature) => (
              <article key={feature.title} className="tool-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-example-section" id="bulk-examples" aria-label="Bulk prompt examples">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Examples</p>
            <h2>Example outputs from bulk image prompt generation</h2>
          </div>
          <div className="tool-example-grid">
            {BULK_EXAMPLES.map((example, index) => (
              <article
                key={example.title}
                className={`tool-example-card ${index % 2 === 1 ? "tool-example-card-flip" : ""}`}
              >
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={example.imageUrl} alt={example.imageAlt} loading="lazy" />
                </figure>
                <div className="tool-example-output">
                  <h3>{example.title}</h3>
                  <p>{example.prompt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-usecases-section" id="bulk-use-cases" aria-label="Bulk mode use cases">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Use cases</p>
            <h2>Who uses bulk image to prompt workflows</h2>
          </div>
          <div className="tool-usecase-grid">
            {BULK_USE_CASES.map((useCase) => (
              <article key={useCase.title} className="tool-usecase-card">
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-benefits-section" id="bulk-benefits" aria-label="Benefits of bulk prompt generation">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Benefits</p>
            <h2>Why teams choose bulk prompt generation</h2>
          </div>
          <div className="tool-benefit-grid">
            {BULK_BENEFITS.map((benefit) => (
              <article key={benefit.title} className="tool-benefit-card">
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-section container" id="bulk-pricing" aria-label="Bulk plans and pricing">
          <h2 className="pricing-heading">Plans for bulk image to prompt usage</h2>
          <p className="pricing-subtitle">
            Choose a plan based on monthly volume, then run batch workflows without changing your process.
          </p>
          <div className="pricing-grid">
            {BULK_PRICING_CARDS.map((card) => (
              <article
                key={card.title}
                className={`pricing-card ${card.popular ? "pricing-card-popular" : ""} ${card.dark ? "pricing-card-dark" : ""}`}
              >
                {card.popular ? <span className="pricing-card-badge">Popular</span> : null}
                <h3 className="pricing-card-title">{card.title}</h3>
                <p className="pricing-card-price">{card.price}</p>
                <p className="pricing-card-desc">{card.description}</p>
                <ul className="pricing-card-features" aria-label={`${card.title} plan features`}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link className={`pricing-card-cta ${card.dark ? "pricing-card-cta-dark" : ""}`} href={card.href}>
                  {card.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-faq-section" id="bulk-faqs" aria-label="Bulk image to prompt frequently asked questions">
          <div className="tool-faq-head">
            <p className="tool-section-kicker">FAQs</p>
            <h2>Bulk image to prompt FAQ</h2>
            <p className="tool-faq-subtitle">Clear answers for setup, limits, export, and team workflows.</p>
          </div>
          <div className="tool-faq-list">
            {BULK_FAQS.map((item, index) => (
              <details key={item.question} open={index === 0} className="tool-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="container tool-seo-content-section" id="bulk-seo-content" aria-label="Bulk image to prompt guide">
          <div className="tool-seo-guide-card">
            <div className="tool-seo-guide-header">
              <p className="tool-section-kicker">Guide</p>
              <h2 className="tool-seo-guide-title">Bulk image to prompt converter guide for teams</h2>
              <p className="tool-seo-guide-intro">
                Use this guide to set up a reliable bulk prompt process and improve output quality across repeated batches.
              </p>
            </div>
            <article className="tool-seo-article">
              {BULK_SEO_GUIDE.map((section) => (
                <div key={section.heading} className="tool-seo-guide-block">
                  <h3>{section.heading}</h3>
                  {section.paragraphs.map((paragraph) => (
                    <p key={`${section.heading}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                  ))}
                </div>
              ))}
            </article>
          </div>
        </section>

        <section className="container tool-trust-section" id="bulk-trust-signals" aria-label="Trust and reliability">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Reliability</p>
            <h2>Designed for reliable bulk prompt operations</h2>
          </div>
          <div className="tool-trust-grid">
            {BULK_TRUST_CARDS.map((card) => (
              <article key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container tool-reviews-section" id="bulk-reviews" aria-label="Bulk workflow reviews">
          <div className="tool-section-head">
            <p className="tool-section-kicker">Reviews</p>
            <h2>What teams say about the bulk workflow</h2>
          </div>
          <div className="tool-reviews-grid">
            {BULK_REVIEWS.map((review) => (
              <article key={`${review.name}-${review.title}`} className="tool-review-card">
                <div className="tool-review-header">
                  <div className="tool-review-meta">
                    <span className="tool-review-name">{review.name}</span>
                    <span className="tool-review-location">{review.location}</span>
                  </div>
                  <span className="tool-review-date">{review.date}</span>
                </div>
                <h3 className="tool-review-title">{review.title}</h3>
                <p className="tool-review-body">{review.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter id="bulk-footer" />
    </div>
  );
}
