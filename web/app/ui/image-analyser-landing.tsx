"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, CSSProperties, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_TOKEN_STORAGE_KEY, SHRINK_DISTANCE, resolveBackendUrl } from "../lib/client-config";
import {
  DEFAULT_PRICING_CONTEXT,
  PLAN_OPTION_META,
  PRICING_CARDS,
  formatCurrencySubunits,
  getPlanRank
} from "../lib/pricing";
import {
  AnyPlanCode,
  BillingCycle,
  PlanSnapshot,
  PricingContextSnapshot,
  PricingPlanSnapshot,
  SubscriptionSnapshot,
  UsageSnapshot,
  UserPlanCode,
  UserRole,
  UserSnapshot
} from "../lib/saas-types";
import {
  ArrowRightIcon,
  BrandMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  GoogleIcon,
  ImageIcon,
  LayersIcon,
  PenIcon,
  PuzzleIcon,
  SaveIcon,
  ServerIcon,
  ShieldIcon,
  SparkIcon,
  SearchIcon,
  UploadIcon,
  UserIcon,
  BoxIcon
} from "./icons";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const MAX_API_PAYLOAD_IMAGE_BYTES = 850 * 1024;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
type LlmTarget = {
  label: string;
  url: string;
  thumb: string;
  prefillParam?: string;
};

type DemoImageSample = {
  label: string;
  imageUrl: string;
  thumb: string;
  fileName: string;
};

type CounterItem = {
  value: string;
  label: string;
  description: string;
};

const SAMPLE_IMAGES: LlmTarget[] = [
  {
    label: "ChatGPT",
    url: "https://chatgpt.com/",
    thumb: "https://www.google.com/s2/favicons?domain=chatgpt.com&sz=256",
    prefillParam: "q"
  },
  {
    label: "Gemini",
    url: "https://gemini.google.com/app",
    thumb: "https://www.google.com/s2/favicons?domain=gemini.google.com&sz=256",
    prefillParam: undefined
  },
  {
    label: "Leonardo",
    url: "https://app.leonardo.ai/",
    thumb: "https://www.google.com/s2/favicons?domain=leonardo.ai&sz=256"
  },
  {
    label: "Grok",
    url: "https://grok.com/",
    thumb: "https://www.google.com/s2/favicons?domain=grok.com&sz=256",
    prefillParam: "q"
  }
];
const MODAL_LLM_IMAGES = SAMPLE_IMAGES.filter(
  (item) => item.label === "ChatGPT" || item.label === "Grok"
);
const DEMO_SAMPLE_IMAGES: DemoImageSample[] = [
  {
    label: "Person demo",
    imageUrl: "https://picsum.photos/id/1027/1400/900",
    thumb: "https://picsum.photos/id/1027/320/220",
    fileName: "person-demo.jpg"
  },
  {
    label: "Wildlife demo",
    imageUrl: "https://picsum.photos/id/237/1400/900",
    thumb: "https://picsum.photos/id/237/320/220",
    fileName: "wildlife-demo.jpg"
  },
  {
    label: "Car demo",
    imageUrl: "https://picsum.photos/id/111/1400/900",
    thumb: "https://picsum.photos/id/111/320/220",
    fileName: "car-demo.jpg"
  },
  {
    label: "Viewpoint demo",
    imageUrl: "https://picsum.photos/id/1035/1400/900",
    thumb: "https://picsum.photos/id/1035/320/220",
    fileName: "viewpoint-demo.jpg"
  }
];
const COUNTER_ITEMS: CounterItem[] = [
  {
    value: "250K+",
    label: "prompts generated",
    description: "Image to prompt outputs created by teams, creators, and marketers."
  },
  {
    value: "75K+",
    label: "images analyzed",
    description: "Product shots, social creatives, screenshots, and design references processed."
  },
  {
    value: "4+",
    label: "LLMs supported",
    description: "Works with ChatGPT, Gemini, Grok, Leonardo, and more."
  }
];

type ToolStepItem = {
  title: string;
  description: string;
};

type ToolFeatureItem = {
  title: string;
  description: string;
};

type ToolUseCaseItem = {
  title: string;
  description: string;
};

type ToolBenefitItem = {
  title: string;
  description: string;
};

type ToolExampleItem = {
  title: string;
  imageUrl: string;
  imageAlt: string;
  prompt: string;
};

type ToolFaqItem = {
  question: string;
  answer: string;
};

type SeoCopySection = {
  heading: string;
  paragraphs: string[];
};

const TOOL_STEPS: ToolStepItem[] = [
  {
    title: "Step 1: Upload your image",
    description:
      "Drop a JPG, PNG, or WebP screenshot, product photo, or any visual reference into the uploader."
  },
  {
    title: "Step 2: Click Generate Prompt",
    description:
      "Our AI analyzes composition, subject, lighting, and style to create a structured prompt in seconds."
  },
  {
    title: "Step 3: Copy and use in your AI tool",
    description:
      "Copy the prompt, save it to your account, or paste it straight into ChatGPT, Midjourney, or any other AI model."
  }
];

const TOOL_FEATURES: ToolFeatureItem[] = [
  {
    title: "AI-powered prompt generation",
    description: "Transforms visual detail into structured text prompts designed for modern AI workflows."
  },
  {
    title: "Supports JPG, PNG, and WebP",
    description: "Upload common image formats used by creators, marketers, and design teams."
  },
  {
    title: "High-accuracy visual detection",
    description: "Captures subject, setting, color cues, mood, and style signals with clear language."
  },
  {
    title: "Instant processing",
    description: "Built for speed so users can move from image to usable prompt in one short cycle."
  },
  {
    title: "Privacy-safe account controls",
    description: "Signed-in sessions, plan-aware credits, and controlled saved prompts for accountable usage."
  },
  {
    title: "Web and extension sync",
    description: "Use the same login, subscription, and saved prompts across website and browser extension."
  }
];

const TOOL_USE_CASES: ToolUseCaseItem[] = [
  {
    title: "AI Artists",
    description: "Convert reference images into stylized generation prompts with better descriptive depth."
  },
  {
    title: "Designers",
    description: "Turn UI shots and moodboards into prompt-ready direction for rapid concept exploration."
  },
  {
    title: "Content Creators",
    description: "Generate reusable prompts for thumbnails, campaign visuals, and storytelling assets."
  },
  {
    title: "Game Developers",
    description: "Build prompts from environment references and character art for ideation pipelines."
  },
  {
    title: "Midjourney and ChatGPT users",
    description: "Use ready prompts faster without manual prompt drafting for each new image."
  },
  {
    title: "Marketing Teams",
    description: "Turn product photos and brand assets into consistent, on-brand prompt briefs for campaigns."
  }
];

const USE_CASE_ICONS = [
  SparkIcon,
  PenIcon,
  ImageIcon,
  PuzzleIcon,
  LayersIcon,
  BoxIcon
];

const TOOL_BENEFITS: ToolBenefitItem[] = [
  {
    title: "Save hours of manual prompt writing",
    description: "Start from structured output instead of writing every prompt block from scratch."
  },
  {
    title: "Beginner-friendly by design",
    description: "No prompt engineering background required to produce useful AI-ready instructions."
  },
  {
    title: "No technical setup required",
    description: "Upload, click generate, and copy in one interface with minimal friction."
  },
  {
    title: "Free online entry plan",
    description: "New users can start immediately and upgrade only when their workflow scales."
  }
];

const TOOL_EXAMPLES: ToolExampleItem[] = [
  {
    title: "Product hero image to marketing prompt",
    imageUrl: "https://picsum.photos/id/1060/1200/760",
    imageAlt: "Minimal desk with camera and notebook",
    prompt:
      "Create a clean product-focused scene: a modern camera on a minimalist desk, soft natural side lighting, muted neutral palette, shallow depth of field, editorial commercial photography style, high detail, premium brand atmosphere."
  },
  {
    title: "Street portrait to cinematic prompt",
    imageUrl: "https://picsum.photos/id/1005/1200/760",
    imageAlt: "Street portrait with natural light",
    prompt:
      "Generate a cinematic street portrait of a young professional walking through an urban lane, warm evening highlights, subtle film grain, realistic skin texture, candid expression, background bokeh, fashion editorial mood, 35mm lens perspective."
  },
  {
    title: "Landscape to atmospheric prompt",
    imageUrl: "https://picsum.photos/id/1018/1200/760",
    imageAlt: "Mountain landscape at golden hour",
    prompt:
      "Create a wide landscape with distant mountains, golden hour light, mist in the valleys, dramatic clouds, sense of scale and depth, cinematic composition, 16:9 aspect, nature documentary mood."
  },
  {
    title: "Still life to editorial prompt",
    imageUrl: "https://picsum.photos/id/1074/1200/760",
    imageAlt: "Still life with plants and ceramics",
    prompt:
      "Editorial still life: ceramic vessels and foliage on a textured surface, soft diffused window light, warm and cool tones, shallow depth of field, lifestyle magazine style, calm and curated mood."
  },
  {
    title: "Architecture to design prompt",
    imageUrl: "https://picsum.photos/id/111/1200/760",
    imageAlt: "Modern building exterior",
    prompt:
      "Architectural visualization: clean lines, strong shadows, minimal human presence, blue hour lighting, sharp detail on materials, symmetrical composition, contemporary design emphasis."
  }
];

const TOOL_FAQS: ToolFaqItem[] = [
  {
    question: "Is this image to prompt converter free?",
    answer:
      "Yes. A free plan is available so you can test the workflow and generate prompts without setup complexity. Paid plans offer more generations and saved prompts for heavier use."
  },
  {
    question: "Which AI models work with the generated prompts?",
    answer:
      "You can use the output in ChatGPT, Midjourney, DALL·E, Gemini, Stable Diffusion, Leonardo, Runway, and other text-to-image or multimodal tools. Prompts are written in plain language so you can paste and tweak as needed."
  },
  {
    question: "Is my image stored permanently?",
    answer:
      "Images are processed for generation only. Saved prompts are stored under your account and you can delete them anytime. Check our privacy policy for full details on retention and data handling."
  },
  {
    question: "Can I use generated prompts commercially?",
    answer:
      "Yes, in most cases. The prompts you generate are yours to use. Always review the terms of the AI platform you paste them into (e.g. Midjourney, OpenAI) for any commercial or licensing rules."
  },
  {
    question: "What image formats and sizes are supported?",
    answer:
      "Common formats like JPEG, PNG, and WebP are supported. Very large files may be resized for processing. For best results, use clear, well-lit images rather than heavily compressed or tiny thumbnails."
  },
  {
    question: "How accurate is the generated prompt?",
    answer:
      "Quality depends on the source image. Clear subjects, good lighting, and recognizable composition usually produce strong prompts. You can edit the text before copying or saving to add style, mood, or technical terms."
  },
  {
    question: "Do I need an account to try it?",
    answer:
      "You can generate prompts without signing in on the free plan. An account is required to save prompts, access higher limits, and use features like the Chrome extension with saved history."
  },
  {
    question: "Can I use this on mobile?",
    answer:
      "Yes. The web app works in mobile browsers. Upload from your camera or gallery, generate the prompt, then copy or save. For desktop workflows, the Chrome extension lets you capture images from any tab."
  },
  {
    question: "What’s the difference between monthly and annual pricing?",
    answer:
      "Annual billing is discounted (e.g. save 20%) compared to paying monthly. You get the same features; switching to annual reduces cost if you use the tool regularly. You can change or cancel from your profile."
  },
  {
    question: "Why did my prompt come out generic or vague?",
    answer:
      "Blurry images, cluttered scenes, or very low contrast can lead to vaguer prompts. Try a clearer reference image, crop to the main subject, or add a few words after generation to specify style, mood, or lens (e.g. “cinematic”, “flat lay”)."
  },
  {
    question: "Can I process multiple images in one go?",
    answer:
      "Depending on your plan, bulk or batch features may be available. Check the pricing page and your account for limits. For single-image workflow, generate one prompt per image and use “Save” to build a library."
  },
  {
    question: "Is there a Chrome extension?",
    answer:
      "Yes. The extension lets you capture an image from the current page and send it to the converter, then copy or save the prompt without leaving your workflow. Install it from the Chrome extension or product page."
  },
  {
    question: "How do I get better prompts for product or ecommerce photos?",
    answer:
      "Use clean product shots with simple backgrounds and even lighting. The tool will pick up objects, materials, and composition. You can then add terms like “white background”, “lifestyle shot”, or “hero image” in the generated text before copying."
  },
  {
    question: "Are prompts in English only?",
    answer:
      "Generated prompts are typically in English, which works well for most AI image models. You can paste the result into a translator or edit the text into another language if your target tool supports it."
  },
  {
    question: "What happens if I hit my generation limit?",
    answer:
      "When you reach your plan’s limit, you’ll need to wait until the limit resets (e.g. monthly) or upgrade for more generations. The interface will show your usage so you can plan accordingly."
  },
  {
    question: "Can I share or export my saved prompts?",
    answer:
      "Saved prompts are stored in your account. You can copy any prompt to share via email, docs, or team tools. Bulk export options may be available on higher plans; check the app or help for current features."
  },
  {
    question: "How is this different from describing the image myself?",
    answer:
      "The converter uses AI to turn the image into structured prompt text (subject, style, lighting, composition) in one step. That’s faster than writing from scratch and keeps wording consistent. You still have full control to edit before using the prompt elsewhere."
  }
];

const SEO_COPY: SeoCopySection[] = [
  {
    heading: "What is an image to prompt converter?",
    paragraphs: [
      "An image to prompt converter is a practical AI tool that reads visual information and translates it into usable text prompts. Instead of manually describing a scene line by line, users upload a photo and receive a structured prompt that can be pasted into models like ChatGPT, Midjourney, and other creative AI systems.",
      "This matters because prompt quality controls output quality. When your prompt misses composition, lighting, or style detail, generated results become generic. A strong converter helps close that gap by turning visual context into concise instruction blocks so the first output is already close to your intended direction."
    ]
  },
  {
    heading: "Why prompts matter for modern AI workflows",
    paragraphs: [
      "Teams now rely on AI for creative drafts, campaign production, UI concepting, and rapid iteration. In each workflow, prompt quality is a lever: better prompts reduce revision cycles, lower content waste, and increase consistency between team members. This is true whether you are producing marketing assets, ideating interfaces, or generating concept art.",
      "The challenge is that manual prompt writing takes time and requires repeated experimentation. People often know what they want visually but struggle to translate that intent into model-friendly language. Converting image to prompt online solves this by grounding text instructions in actual visual references."
    ]
  },
  {
    heading: "How to convert image to prompt online effectively",
    paragraphs: [
      "The best process is straightforward. Start with a clear source image that reflects your target style. Upload it, generate the prompt, then make light edits to adjust tone, lens language, or output format. This approach is faster than writing from a blank document because the converter already handles scene description and styling cues.",
      "For production usage, store prompts you plan to reuse, tag outputs by campaign or asset type, and keep a small library of high-performing prompts. Over time, this creates a reliable internal prompt system that scales across teammates and projects."
    ]
  },
  {
    heading: "Prompt engineering basics without complexity",
    paragraphs: [
      "You do not need deep technical prompt engineering to get strong outputs. In practice, high-performing prompts usually include five parts: primary subject, scene context, visual style, lighting and quality terms, and intent constraints. An image to prompt converter automatically drafts these blocks so beginners can work like advanced users.",
      "Once generated, users can tune specificity. If results feel broad, add constraints. If results feel too narrow, remove strict terms. This edit loop is short and predictable when your first draft is structured correctly."
    ]
  },
  {
    heading: "Image to prompt converter vs manual prompting",
    paragraphs: [
      "Manual prompting is useful for highly custom logic, but it is slow for everyday execution. Most teams are not blocked by ideas; they are blocked by throughput. A converter removes repetitive drafting and creates consistent language patterns that reduce decision fatigue.",
      "For many users, the right model is hybrid: generate the first prompt from an image, then apply manual refinement for brand voice, campaign constraints, or audience context. This keeps quality high without sacrificing speed."
    ]
  },
  {
    heading: "Privacy, trust, and performance signals",
    paragraphs: [
      "Trust influences both user retention and SEO outcomes. This tool emphasizes session-based authentication, explicit account controls, and user-managed saved prompts. Clear privacy notes reduce uncertainty, and predictable performance keeps workflows moving without friction.",
      "Fast loading and low interaction latency are equally important. Prompt tools are used in active creative sessions, so each second of delay interrupts thinking. Maintaining fast page delivery, secure transport, and stable generation flow improves both user satisfaction and search performance over time."
    ]
  },
  {
    heading: "Who should use this tool",
    paragraphs: [
      "This workflow is useful for AI artists, designers, marketers, ecommerce teams, product managers, and founders testing visual concepts quickly. If your process starts from references, screenshots, or inspiration boards, converting image to prompt online helps you move from idea to output faster.",
      "It also works well for teams that need repeatability. Shared prompt history, plan-aware usage, and the extension make it easy to run the same process across web browsing and production tasks while keeping output quality consistent."
    ]
  }
];

const SITE_BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://imagetopromptgenerator.one").replace(
  /\/+$/,
  ""
);

const SOFTWARE_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Image to Prompt Converter",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "Free image to prompt converter online. Upload an image, generate a structured AI prompt, and use it in ChatGPT, Midjourney, and more.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  url: `${SITE_BASE_URL}/image-to-prompt-converter`
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TOOL_FAQS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer
    }
  }))
};

const BREADCRUMB_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_BASE_URL}/`
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Image to Prompt Converter",
      item: `${SITE_BASE_URL}/image-to-prompt-converter`
    }
  ]
};

const COUNTER_DURATION_MS = 1400;
const COUNTER_EASE = (t: number) => 1 - Math.pow(1 - t, 3);

function parseCounterValue(value: string): { target: number; suffix: string } {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return { target: 0, suffix: value };
  return { target: parseInt(match[1], 10), suffix: match[2] || "" };
}

function CounterValue({ value }: { value: string }) {
  const { target, suffix } = parseCounterValue(value);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (started || target <= 0) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setStarted(true);
      },
      { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started, target]);

  useEffect(() => {
    if (!started || target <= 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      const eased = COUNTER_EASE(progress);
      setDisplay(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [started, target]);

  return (
    <p className="counter-value" ref={ref}>
      {display}
      {suffix}
    </p>
  );
}

type ApiResponse = {
  ok?: boolean;
  description?: string;
  requestId?: string;
  model?: string;
  error?: string;
  token?: string;
  url?: string;
  sessionId?: string;
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
  plan?: Partial<PlanSnapshot>;
  pricing?: Partial<PricingContextSnapshot>;
  prompts?: unknown;
  role?: string;
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

type AuthMode = "signup" | "signin";

type GoogleCredentialPayload = {
  credential?: string;
};

async function ensureGoogleIdentityLoaded() {
  const scopedWindow = window as Window & {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialPayload) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          prompt: (listener?: (notification: unknown) => void) => void;
          cancel?: () => void;
        };
      };
    };
  };

  if (scopedWindow.google?.accounts?.id) {
    return scopedWindow.google.accounts.id;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Google Sign-In.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Sign-In."));
    document.body.appendChild(script);
  });

  if (!scopedWindow.google?.accounts?.id) {
    throw new Error("Google Sign-In SDK is unavailable.");
  }

  return scopedWindow.google.accounts.id;
}

export function ImageAnalyserLanding() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageName, setImageName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [resultRequestId, setResultRequestId] = useState<string>("");
  const [resultModel, setResultModel] = useState<string>(DEFAULT_MODEL);
  const [resultImageUrl, setResultImageUrl] = useState<string>("");
  const [resultSaved, setResultSaved] = useState<boolean>(false);
  const [resultSaveBusy, setResultSaveBusy] = useState<boolean>(false);
  const [resultSaveError, setResultSaveError] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [resultModalOpen, setResultModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [copied, setCopied] = useState<boolean>(false);
  const [newsletterEmail, setNewsletterEmail] = useState<string>("");
  const [newsletterMessage, setNewsletterMessage] = useState<string>("");
  const [headerScrollProgress, setHeaderScrollProgress] = useState<number>(0);
  const [authToken, setAuthToken] = useState<string>("");
  const [authUser, setAuthUser] = useState<UserSnapshot | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [planSubmitting, setPlanSubmitting] = useState<boolean>(false);
  const [billingRedirecting, setBillingRedirecting] = useState<boolean>(false);
  const [planMessage, setPlanMessage] = useState<string>("");
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const [outOfCreditsModalOpen, setOutOfCreditsModalOpen] = useState<boolean>(false);
  const [dismissedNinetyPercentPopup, setDismissedNinetyPercentPopup] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem("image-prompt-90-dismissed") === "1";
  });
  const [profileRefreshLoading, setProfileRefreshLoading] = useState<boolean>(false);
  const [billingAnnual, setBillingAnnual] = useState<boolean>(false);
  const [useCaseSlide, setUseCaseSlide] = useState<number>(0);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [pricingContext, setPricingContext] = useState<PricingContextSnapshot | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const backendUrl = useMemo(() => resolveBackendUrl(), []);

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
      const planPricing = pricingByPlanCode[meta.code];
      const monthlyAmountSubunits = planPricing?.monthlyAmountSubunits ?? 0;
      return {
        ...meta,
        price: `${formatCurrencySubunits(monthlyAmountSubunits, resolvedPricingContext.currency)}/mo`
      };
    });
  }, [pricingByPlanCode, resolvedPricingContext.currency]);

  function persistAuthToken(token: string) {
    setAuthToken(token);
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      return;
    }
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  function clearAuthState() {
    persistAuthToken("");
    setAuthUser(null);
    setSubscription(null);
    setUsage(null);
  }

  function applySessionPayload(payload: ApiResponse, tokenFromPayload?: string) {
    const nextToken = tokenFromPayload ?? payload.token ?? authToken;
    if (nextToken) {
      persistAuthToken(nextToken);
    }

    const nextUser = normalizeUserSnapshot(payload.user);
    if (nextUser) {
      setAuthUser(nextUser);
    }

    const nextSubscription = normalizeSubscriptionSnapshot(payload.subscription);
    if (nextSubscription) {
      setSubscription(nextSubscription);
    } else if (payload.plan) {
      const planPatch = normalizePlanSnapshot(payload.plan);
      if (planPatch) {
        setSubscription((current) =>
          current
            ? {
                ...current,
                planCode: planPatch.code === "guest" ? "free" : planPatch.code,
                planName: planPatch.name,
                monthlyQuota: planPatch.monthlyQuota,
                priceUsdCents: planPatch.priceUsdCents
              }
            : null
        );
      }
    }

    const nextUsage = normalizeUsageSnapshot(payload.usage);
    if (nextUsage) {
      setUsage(nextUsage);
    }
  }

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

  async function onSubmitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setAuthMessage("Email and password are required.");
      return;
    }

    setAuthSubmitting(true);
    setAuthMessage("");

    try {
      const response = await fetch(`${backendUrl}/api/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error || "Authentication failed.");
      }

      applySessionPayload(payload, payload.token);
      setAuthPassword("");
      setAuthMessage("");
      setPlanMessage("");
      closeAuthModal();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Authentication failed.";
      setAuthMessage(message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function onGoogleAuth() {
    if (!GOOGLE_CLIENT_ID) {
      setAuthMessage("Google login is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    setAuthSubmitting(true);
    setAuthMessage("");

    try {
      const googleId = await ensureGoogleIdentityLoaded();
      const idToken = await new Promise<string>((resolve, reject) => {
        let finished = false;

        const done = (handler: () => void) => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeoutId);
          handler();
        };

        const timeoutId = window.setTimeout(() => {
          done(() => reject(new Error("Google sign-in timed out. Please try again.")));
        }, 60000);

        googleId.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: authMode === "signup" ? "signup" : "signin",
          callback: (response: GoogleCredentialPayload) => {
            const credential = typeof response?.credential === "string" ? response.credential.trim() : "";
            if (!credential) {
              done(() => reject(new Error("Google did not return a valid credential.")));
              return;
            }
            done(() => resolve(credential));
          }
        });

        googleId.prompt((notification: unknown) => {
          const info = notification as {
            isNotDisplayed?: () => boolean;
            isSkippedMoment?: () => boolean;
            isDismissedMoment?: () => boolean;
            getNotDisplayedReason?: () => string;
            getSkippedReason?: () => string;
            getDismissedReason?: () => string;
          };

          const notDisplayed = typeof info.isNotDisplayed === "function" && info.isNotDisplayed();
          if (notDisplayed) {
            const reason = (typeof info.getNotDisplayedReason === "function" && info.getNotDisplayedReason()) || "";
            done(() =>
              reject(
                new Error(
                  reason
                    ? `Google sign-in could not start (${reason}).`
                    : "Google sign-in could not start. Please allow popups and try again."
                )
              )
            );
            return;
          }

          const skipped = typeof info.isSkippedMoment === "function" && info.isSkippedMoment();
          if (skipped) {
            const reason = (typeof info.getSkippedReason === "function" && info.getSkippedReason()) || "";
            if (reason && reason !== "unknown_reason") {
              done(() => reject(new Error(`Google sign-in was skipped (${reason}). Please try again.`)));
            }
            return;
          }

          const dismissed = typeof info.isDismissedMoment === "function" && info.isDismissedMoment();
          if (dismissed) {
            const reason = (typeof info.getDismissedReason === "function" && info.getDismissedReason()) || "";
            if (reason && reason !== "credential_returned" && reason !== "unknown_reason") {
              done(() => reject(new Error(`Google sign-in was dismissed (${reason}). Please try again.`)));
            }
          }
        });
      });

      const response = await fetch(`${backendUrl}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idToken
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error || "Google authentication failed.");
      }

      applySessionPayload(payload, payload.token);
      setAuthPassword("");
      setAuthMessage("");
      setPlanMessage("");
      closeAuthModal();
    } catch (googleAuthError) {
      const message = googleAuthError instanceof Error ? googleAuthError.message : "Google authentication failed.";
      setAuthMessage(message);
    } finally {
      setAuthSubmitting(false);
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
    if (!authToken) {
      setPlanMessage("Sign in to switch plans.");
      openAuthModal("signin");
      return;
    }

    if (subscription?.planCode === planCode) {
      return;
    }

    setPlanSubmitting(true);
    setPlanMessage("");

    try {
      const currentCode: UserPlanCode = subscription?.planCode || "free";
      const isUpgrade = getPlanRank(planCode) > getPlanRank(currentCode);

      if (!isUpgrade) {
        const response = await fetch(`${backendUrl}/api/subscription/plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            planCode
          })
        });

        const payload = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Could not update plan.");
        }

        applySessionPayload(payload);
        const planName = normalizeSubscriptionSnapshot(payload.subscription)?.planName || planCode.toUpperCase();
        setPlanMessage(`Plan updated to ${planName}.`);
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
        throw new Error(payload.error || "Could not create checkout session.");
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
            email: payload.prefill?.email || authUser?.email || ""
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
              setPlanMessage(`Plan updated to ${planName} (${appliedCycle}).`);
              resolve();
            } catch (verifyError) {
              const nextMessage =
                verifyError instanceof Error ? verifyError.message : "Payment verification failed.";
              reject(new Error(nextMessage));
            }
          }
        });
        checkout.open();
      });
    } catch (planError) {
      const message = planError instanceof Error ? planError.message : "Could not update plan.";
      setPlanMessage(message);
    } finally {
      setBillingRedirecting(false);
      setPlanSubmitting(false);
    }
  }

  function openBillingPage() {
    if (!authToken) {
      openAuthModal("signin");
      return;
    }
    setProfileModalOpen(false);
    setPlanModalOpen(false);
    setOutOfCreditsModalOpen(false);
    router.push("/billing");
  }

  async function onRefreshProfile() {
    if (!authToken) return;
    setProfileRefreshLoading(true);
    setPlanMessage("");
    try {
      const response = await fetch(`${backendUrl}/api/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not load profile.");
      }
      applySessionPayload(payload);
      setPlanMessage("Profile updated.");
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : "Could not refresh profile.";
      setPlanMessage(message);
    } finally {
      setProfileRefreshLoading(false);
    }
  }

  function onOpenSavedPrompts() {
    setProfileMenuOpen(false);
    setProfileModalOpen(false);
    setPlanModalOpen(false);
    setOutOfCreditsModalOpen(false);
    router.push("/saved-prompts");
  }

  function onLogout() {
    clearAuthState();
    setPlanMessage("Signed out.");
  }

  useEffect(() => {
    let ticking = false;

    const BACK_TO_TOP_THRESHOLD = 400;

    const updateProgress = () => {
      const scrollY = window.scrollY;
      const nextProgress = Math.min(1, Math.max(0, scrollY / SHRINK_DISTANCE));
      setHeaderScrollProgress((current) =>
        Math.abs(current - nextProgress) > 0.001 ? nextProgress : current
      );
      setShowBackToTop(scrollY > BACK_TO_TOP_THRESHOLD);
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
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setSessionLoading(false);
      return;
    }

    const controller = new AbortController();

    const restore = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`
          },
          signal: controller.signal
        });

        const payload = (await response.json().catch(() => ({}))) as ApiResponse;
        if (!response.ok || !payload.ok) {
          setAuthToken("");
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setAuthUser(null);
          setSubscription(null);
          setUsage(null);
          setPlanMessage("Session expired. Please sign in again.");
          return;
        }

        setAuthToken(storedToken);
        window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, storedToken);
        const restoredUser = normalizeUserSnapshot(payload.user);
        const restoredSubscription = normalizeSubscriptionSnapshot(payload.subscription);
        const restoredUsage = normalizeUsageSnapshot(payload.usage);
        setAuthUser(restoredUser);
        setSubscription(restoredSubscription);
        setUsage(restoredUsage);
      } catch (sessionError) {
        if ((sessionError as { name?: string })?.name !== "AbortError") {
          setAuthToken("");
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setAuthUser(null);
          setSubscription(null);
          setUsage(null);
          setPlanMessage("Session expired. Please sign in again.");
        }
      } finally {
        setSessionLoading(false);
      }
    };

    void restore();

    return () => {
      controller.abort();
    };
  }, [backendUrl]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const billingState = url.searchParams.get("billing");
    const plan = url.searchParams.get("plan");

    if (!billingState) {
      return;
    }

    if (billingState === "success") {
      setPlanMessage(
        plan ? `Checkout started for ${plan}. We will sync your plan shortly.` : "Checkout completed. Syncing your plan."
      );
    } else if (billingState === "cancel") {
      setPlanMessage("Checkout was canceled.");
    } else {
      setPlanMessage("Billing update received.");
    }

    url.searchParams.delete("billing");
    url.searchParams.delete("plan");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const source = (url.searchParams.get("source") || "").trim().toLowerCase();
    if (source !== "extension" || authUser) {
      return;
    }

    const authParam = (url.searchParams.get("auth") || "").trim().toLowerCase();
    openAuthModal(authParam === "signup" ? "signup" : "signin");
  }, [authUser]);

  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function openAuthModal(mode: AuthMode) {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthModalOpen(true);
  }

  function closeAuthModal() {
    const scopedWindow = window as Window & { google?: { accounts?: { id?: { cancel?: () => void } } } };
    scopedWindow.google?.accounts?.id?.cancel?.();
    setAuthMessage("");
    setAuthModalOpen(false);
  }

  function clearSelectedImage() {
    setImageDataUrl("");
    setImageUrl("");
    setImageName("");
    setDescription("");
    setResultRequestId("");
    setResultModel(DEFAULT_MODEL);
    setResultImageUrl("");
    setResultSaved(false);
    setResultSaveBusy(false);
    setResultSaveError("");
    setError("");
    setLoading(false);
    setResultModalOpen(false);
    setCopied(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await applySelectedFile(file);
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    await applySelectedFile(file);
  }

  async function applySelectedFile(file: File) {
    setError("");
    setCopied(false);

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large. Please use an image smaller than 15MB.");
      return;
    }

    try {
      const dataUrl = await prepareImageDataUrlForApi(file);
      setImageDataUrl(dataUrl);
      setImageUrl("");
      setImageName(file.name);
      setDescription("");
      setResultModalOpen(false);
    } catch {
      setError("Could not process image. Try a smaller image.");
    }
  }

  async function onGenerate(source?: { imageDataUrl?: string; imageUrl?: string }) {
    const requestImageDataUrl = source?.imageDataUrl ?? imageDataUrl;
    const requestImageUrl = source?.imageUrl ?? imageUrl;

    if (!requestImageDataUrl && !requestImageUrl) {
      setError("Upload an image first.");
      return;
    }

    if (atUsageLimit) {
      setOutOfCreditsModalOpen(true);
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    setPlanMessage("");
    setResultRequestId("");
    setResultModel(DEFAULT_MODEL);
    setResultImageUrl("");
    setResultSaved(false);
    setResultSaveBusy(false);
    setResultSaveError("");

    try {
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
          imageDataUrl: requestImageDataUrl || "",
          imageUrl: requestImageUrl || ""
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        if (response.status === 401) {
          setPlanMessage("Please sign in to continue.");
          openAuthModal("signin");
        } else if (response.status === 402) {
          setOutOfCreditsModalOpen(true);
          setPlanMessage("Monthly usage limit reached. Upgrade your plan to continue.");
        }
        throw new Error(payload.error || `Request failed (${response.status})`);
      }

      const text = typeof payload.description === "string" ? payload.description.trim() : "";
      if (!text) {
        throw new Error("Backend returned no description.");
      }
      const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
      const model =
        typeof payload.model === "string" && payload.model.trim() ? payload.model.trim() : DEFAULT_MODEL;
      if (!requestId) {
        throw new Error("Backend returned no request id.");
      }

      setDescription(text);
      setResultRequestId(requestId);
      setResultModel(model);
      setResultImageUrl(requestImageUrl || "");
      applySessionPayload(payload);
      setResultModalOpen(true);
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Could not generate a description.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onUseDemoSample(sample: DemoImageSample) {
    if (loading) {
      return;
    }
    setError("");
    setCopied(false);
    setDescription("");
    setResultModalOpen(false);
    setImageDataUrl(sample.thumb);
    setImageUrl(sample.imageUrl);
    setImageName(sample.fileName);
    await onGenerate({ imageDataUrl: "", imageUrl: sample.imageUrl });
  }

  async function onCopyResult() {
    if (!description) {
      return;
    }
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function onSaveResult() {
    if (!description || !resultRequestId) {
      return;
    }

    if (!authToken) {
      setResultSaveError("Sign in to save prompts.");
      openAuthModal("signin");
      return;
    }

    setResultSaveBusy(true);
    setResultSaveError("");

    try {
      const response = await fetch(`${backendUrl}/api/prompts/saved`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          requestId: resultRequestId,
          model: resultModel,
          description,
          imageUrl: resultImageUrl,
          sourcePageUrl: window.location.href
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        if (response.status === 401 || response.status === 403) {
          clearAuthState();
          openAuthModal("signin");
        }
        throw new Error(payload.error || "Could not save prompt.");
      }

      setResultSaved(true);
      setResultSaveError("");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save prompt.";
      setResultSaveError(message);
    } finally {
      setResultSaveBusy(false);
    }
  }

  function onOpenLlm(sample: LlmTarget) {
    if (!description) {
      return;
    }

    const destination = sample.prefillParam
      ? `${sample.url}${sample.url.includes("?") ? "&" : "?"}${sample.prefillParam}=${encodeURIComponent(description)}`
      : sample.url;

    // Open first to keep it tied to user gesture and avoid popup blockers.
    const opened = window.open(destination, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = destination;
    }

    navigator.clipboard
      .writeText(description)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {
        setCopied(false);
      });
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

  const currentPlanCode: UserPlanCode = subscription?.planCode || "free";
  const usageLine = formatUsageLine(usage, subscription);
  const navUsageLine = useMemo(() => {
    if (!usageLine) return usageLine;
    if (usageLine.endsWith("Unlimited plan"))
      return usageLine.replace(/ used this month • Unlimited plan$/, " used • Unlimited");
    if (usageLine === "Unlimited monthly generations") return "Unlimited";
    return usageLine;
  }, [usageLine]);
  const usagePercent = useMemo(() => {
    if (!usage || usage.limit == null || usage.limit <= 0) return 0;
    return Math.min(100, Math.round((usage.used / usage.limit) * 100));
  }, [usage]);
  const atUsageLimit = useMemo(
    () =>
      Boolean(
        usage &&
          usage.limit != null &&
          usage.limit > 0 &&
          usage.used >= usage.limit
      ),
    [usage]
  );
  const atNinetyPercentUsage = useMemo(
    () =>
      Boolean(
        usage &&
          usage.limit != null &&
          usage.limit > 0 &&
          !atUsageLimit &&
          usagePercent >= 90
      ),
    [usage, atUsageLimit, usagePercent]
  );
  const signedInLine = authUser
    ? `${authUser.email} • ${subscription?.planName || "Free"}`
    : sessionLoading
      ? "Restoring session..."
      : "Guest mode: 20 prompts/month";

  return (
    <div className="site-shell" data-nav-scrolled={headerScrollProgress > 0.08 ? "" : undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APPLICATION_SCHEMA) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
      />

      <header
        className={`top-nav ${headerScrollProgress > 0.08 ? "is-scrolled" : ""}`}
        style={
          {
            "--nav-scroll-progress": headerScrollProgress
          } as CSSProperties
        }
      >
        <div className="container nav-inner">
          <a className="rb-brand" href="#home" aria-label="Image to Prompt">
            <BrandMarkIcon className="rb-brand-mark" />
            <span className="rb-brand-text">Image to Prompt</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <a href="#upload">Image to Prompt</a>
            <a href="/bulk">Bulk</a>
            <a href="/chrome-extension">Extension</a>
            <a href="/pricing">Pricing</a>
            <a href="/faqs">FAQs</a>
          </nav>

          <div className="nav-auth">
            {authUser ? (
              <>
                <span className="nav-usage-pill" title={usageLine}>{navUsageLine}</span>
                <div className="nav-profile-wrap" ref={profileMenuRef}>
                  <button
                    type="button"
                    className="nav-profile-trigger"
                    onClick={() => setProfileMenuOpen((o) => !o)}
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                    aria-label="Profile menu"
                  >
                    <UserIcon className="nav-profile-icon" />
                    <ChevronDownIcon className="nav-profile-chevron" />
                  </button>
                  {profileMenuOpen && (
                    <div className="nav-profile-dropdown" role="menu">
                      <button
                        type="button"
                        className="nav-profile-item"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                      >
                        Manage profile
                      </button>
                      <button
                        type="button"
                        className="nav-profile-item"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setPlanModalOpen(true);
                        }}
                      >
                        Manage plan
                      </button>
                      <button
                        type="button"
                        className="nav-profile-item"
                        role="menuitem"
                        onClick={() => {
                          onOpenSavedPrompts();
                        }}
                      >
                        Saved prompts
                      </button>
                      <button
                        type="button"
                        className="nav-profile-item"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          onLogout();
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="nav-login nav-login-btn" type="button" onClick={() => openAuthModal("signin")}>
                  Log in
                </button>
                <button className="nav-signup" type="button" onClick={() => openAuthModal("signup")}>
                  Sign up
                  <ArrowRightIcon className="auth-icon" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="home" className="home-main">
        <section className="home-split container">
          <div className="hero-left">
            <NextImage
              src="/home-hero-icons.png"
              alt="Image to Prompt preview"
              width={420}
              height={340}
              className="hero-left-image"
              priority
            />
            <h1>
              <span>Turn Images Into</span>
              <span>Perfect Prompts</span>
            </h1>
            <p className="hero-mini">
              Upload any image and get a clean AI-ready prompt for ChatGPT, Gemini, Grok, Leonardo, and more.
            </p>
            <p className="hero-mini-line">
              <span>Fast, simple and</span>
              <span className="hero-free-pill">Free</span>
            </p>
            <div className="hero-cta-row">
              <a href="#upload" className="hero-cta-btn hero-cta-primary">
                Get Started
              </a>
              <a href="#pricing" className="hero-cta-btn hero-cta-secondary">
                Pricing
              </a>
            </div>

            <div className="hero-llm-row" aria-label="Open LLM tools">
              {SAMPLE_IMAGES.map((sample) => (
                <a
                  key={sample.label}
                  href={sample.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hero-llm-icon"
                  aria-label={`Open ${sample.label}`}
                  title={sample.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sample.thumb} alt={sample.label} loading="lazy" />
                </a>
              ))}
            </div>
          </div>

          <div id="upload" className="hero-right">
            <h1 className="hero-right-heading">
              <span>Upload Once.</span>
              <span>Generate Better Prompts.</span>
            </h1>
            <p className="upload-support-text">
              Drop a screenshot, product photo, or design and generate a clean prompt for ChatGPT, Gemini, Grok,
              Leonardo, and more.
            </p>

            <div className="usage-strip" aria-live="polite">
              <p className="usage-strip-title">{signedInLine}</p>
              <p className="usage-strip-meta">{usageLine}</p>
              <div className="usage-plan-row">
                {planOptions.map((plan) => (
                  <button
                    key={plan.code}
                    type="button"
                    className={`usage-plan-chip ${currentPlanCode === plan.code ? "is-active" : ""}`}
                    disabled={planSubmitting || billingRedirecting}
                    onClick={() => void onChangePlan(plan.code)}
                  >
                    <span>{plan.label}</span>
                    <span>{plan.price}</span>
                  </button>
                ))}
                {authUser ? (
                  <button
                    type="button"
                    className="usage-plan-chip usage-plan-chip-manage"
                    onClick={() => openBillingPage()}
                  >
                    Manage billing
                  </button>
                ) : null}
              </div>
              {planMessage ? <p className="usage-strip-note">{planMessage}</p> : null}
            </div>

            {atNinetyPercentUsage && !dismissedNinetyPercentPopup ? (
              <div className="ninety-percent-popup" role="status">
                <p className="ninety-percent-popup-text">You&apos;ve used 90% of your credits. Upgrade for more.</p>
                <div className="ninety-percent-popup-actions">
                  <button
                    type="button"
                    className="ninety-percent-popup-upgrade"
                    onClick={() => setPlanModalOpen(true)}
                  >
                    Upgrade
                  </button>
                  <button
                    type="button"
                    className="ninety-percent-popup-dismiss"
                    aria-label="Dismiss"
                    onClick={() => {
                      setDismissedNinetyPercentPopup(true);
                      try {
                        sessionStorage.setItem("image-prompt-90-dismissed", "1");
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    <CloseIcon className="ninety-percent-popup-dismiss-icon" />
                  </button>
                </div>
              </div>
            ) : null}

            {atUsageLimit ? (
              <div className="out-of-credits-banner" role="alert">
                <p className="out-of-credits-banner-text">You&apos;ve used all your prompts this month.</p>
                <button
                  type="button"
                  className="out-of-credits-banner-cta"
                  onClick={() => {
                    setOutOfCreditsModalOpen(false);
                    setPlanModalOpen(true);
                  }}
                >
                  Upgrade plan
                </button>
              </div>
            ) : null}

            <div
              className={`upload-card ${dragActive ? "is-drag-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden-input"
                onChange={onFileChange}
              />

              <div className="upload-actions">
                <button className="upload-button" type="button" onClick={openFilePicker}>
                  <UploadIcon className="button-icon" />
                  Upload Image
                </button>
                {imageDataUrl ? (
                  <button className="generate-button" type="button" disabled={loading} onClick={() => void onGenerate()}>
                    {loading ? "Generating..." : "Generate"}
                  </button>
                ) : null}
              </div>
              <p className="card-muted">or drag &amp; drop PNG, JPG, or WEBP</p>

              {imageDataUrl && !loading ? (
                <figure className="preview">
                  <button
                    type="button"
                    className="preview-remove"
                    onClick={clearSelectedImage}
                    aria-label="Remove image"
                    title="Remove image"
                  >
                    ×
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageDataUrl} alt={imageName || "Uploaded preview"} />
                  <figcaption>{imageName}</figcaption>
                </figure>
              ) : null}
            </div>

            {!imageDataUrl ? (
              <div className="quick-samples" aria-label="Demo samples">
                <div className="quick-samples-top">
                  <p className="quick-samples-title">
                    <span>No image?</span>
                    <span>Try one of these:</span>
                  </p>
                  <div className="quick-sample-grid">
                    {DEMO_SAMPLE_IMAGES.map((sample) => (
                      <button
                        type="button"
                        key={sample.label}
                        className="quick-sample-card"
                        disabled={loading}
                        onClick={() => void onUseDemoSample(sample)}
                        aria-label={`Use ${sample.label}`}
                        title={sample.label}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={sample.thumb} alt={sample.label} loading="lazy" />
                      </button>
                    ))}
                  </div>
                </div>
                <p className="quick-samples-note">
                  By uploading an image or URL you agree to our <a href="#terms">Terms of Service</a>. To learn more
                  about how remove.bg handles your personal data, check our <a href="#privacy">Privacy Policy</a>.
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="error-text">{error}</p>
            ) : null}
          </div>
        </section>
      </main>

      <section className="counter-band container" id="bulk" aria-label="Platform counters">
        <div className="counter-grid">
          {COUNTER_ITEMS.map((item) => (
            <article key={item.label} className="counter-card">
              <CounterValue value={item.value} />
              <p className="counter-label">{item.label}</p>
              <div className="counter-divider" />
              <p className="counter-description">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container tool-interface-section" id="tool-interface" aria-label="Tool interface">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Tool Interface</p>
          <h2>Built for speed, clarity, and repeatable prompt quality</h2>
          <p>
            The interface is designed for focused work: upload quickly, generate structured output, then copy or save
            prompts in one flow. Session-aware controls keep your plan, credits, and saved prompts synchronized.
          </p>
        </div>
        <div className="tool-interface-grid">
          <article className="tool-interface-card">
            <BoxIcon className="tool-interface-icon" />
            <h3>Upload panel</h3>
            <p>Drag and drop or choose an image. Works best with clear references and production-ready screenshots.</p>
          </article>
          <article className="tool-interface-card">
            <SparkIcon className="tool-interface-icon" />
            <h3>Generation controls</h3>
            <p>One-click generate pipeline with credit awareness, fast response, and clear error messaging.</p>
          </article>
          <article className="tool-interface-card">
            <LayersIcon className="tool-interface-icon" />
            <h3>Prompt output actions</h3>
            <p>Copy, save, and reuse prompts. Keep only the entries you want in Saved Prompts history.</p>
          </article>
        </div>
      </section>

      <section className="container tool-how-section" id="how-to-use" aria-label="How to use image to prompt converter">
        <div className="tool-section-head">
          <p className="tool-section-kicker">How To Use</p>
          <h2>How to use Image to Prompt Converter</h2>
          <p>
            If you are searching how to convert image to prompt online, this workflow is intentionally simple and takes
            less than a minute.
          </p>
        </div>
        <ol className="tool-step-list">
          {TOOL_STEPS.map((step) => (
            <li key={step.title} className="tool-step-card">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container tool-features-section" id="features" aria-label="Image to prompt features">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Features</p>
          <h2>Core capabilities for reliable prompt generation</h2>
        </div>
        <div className="tool-feature-grid">
          {TOOL_FEATURES.map((feature) => (
            <article key={feature.title} className="tool-feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container tool-example-section" id="example-results" aria-label="Example prompt results">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Example Results</p>
          <h2>Input image to generated prompt examples</h2>
        </div>
        <div className="tool-example-grid">
          {TOOL_EXAMPLES.map((example, index) => (
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

      <section className="container tool-usecases-section" id="use-cases" aria-label="Use cases">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Use Cases</p>
          <h2>Who uses this image to prompt tool</h2>
        </div>
        <div className="tool-usecase-carousel-wrap">
          <button
            type="button"
            className="tool-usecase-carousel-btn tool-usecase-carousel-btn-prev"
            onClick={() => setUseCaseSlide((s) => Math.max(0, s - 1))}
            disabled={useCaseSlide === 0}
            aria-label="Previous use cases"
          >
            <ChevronLeftIcon aria-hidden />
          </button>
          <div className="tool-usecase-carousel-viewport">
            <div
              className="tool-usecase-carousel-track"
              style={{
                width: `${Math.ceil(TOOL_USE_CASES.length / 2) * 100}%`,
                transform: `translateX(-${useCaseSlide * (100 / Math.ceil(TOOL_USE_CASES.length / 2))}%)`
              }}
            >
              {Array.from({ length: Math.ceil(TOOL_USE_CASES.length / 2) }).map((_, slideIndex) => (
                <div key={slideIndex} className="tool-usecase-carousel-slide">
                  {TOOL_USE_CASES.slice(slideIndex * 2, slideIndex * 2 + 2).map((useCase, i) => {
                    const index = slideIndex * 2 + i;
                    const IconComponent = USE_CASE_ICONS[index];
                    return (
                      <article key={useCase.title} className="tool-usecase-card tool-usecase-carousel-card">
                        {IconComponent ? (
                          <span className="tool-usecase-icon" aria-hidden>
                            <IconComponent />
                          </span>
                        ) : null}
                        <h3>{useCase.title}</h3>
                        <p>{useCase.description}</p>
                      </article>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="tool-usecase-carousel-btn tool-usecase-carousel-btn-next"
            onClick={() =>
              setUseCaseSlide((s) => Math.min(Math.ceil(TOOL_USE_CASES.length / 2) - 1, s + 1))
            }
            disabled={useCaseSlide >= Math.ceil(TOOL_USE_CASES.length / 2) - 1}
            aria-label="Next use cases"
          >
            <ChevronRightIcon aria-hidden />
          </button>
        </div>
        <div className="tool-usecase-carousel-dots" role="tablist" aria-label="Use case slides">
          {Array.from({ length: Math.ceil(TOOL_USE_CASES.length / 2) }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={useCaseSlide === i}
              aria-label={`Slide ${i + 1}`}
              className={`tool-usecase-carousel-dot ${useCaseSlide === i ? "is-active" : ""}`}
              onClick={() => setUseCaseSlide(i)}
            />
          ))}
        </div>
      </section>

      <section className="container tool-benefits-section" id="benefits" aria-label="Tool benefits">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Benefits</p>
          <h2>Why teams prefer this over manual prompting</h2>
        </div>
        <div className="tool-benefit-grid">
          {TOOL_BENEFITS.map((benefit) => (
            <article key={benefit.title} className="tool-benefit-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pricing-section container" id="pricing" aria-label="Plans and pricing">
        <h2 className="pricing-heading">Plans and Pricing</h2>
        <p className="pricing-subtitle">
          Save when you pay yearly. Switch plans anytime from your profile. Showing{" "}
          <strong>{resolvedPricingContext.currency}</strong> pricing for{" "}
          {resolvedPricingContext.country === "UNKNOWN" ? "your region" : resolvedPricingContext.country}.
        </p>
        <div className="pricing-toggle-wrap">
          <button
            type="button"
            className={`pricing-toggle-btn ${!billingAnnual ? "is-active" : ""}`}
            onClick={() => setBillingAnnual(false)}
          >
            Monthly
          </button>
          <button
            type="button"
            className={`pricing-toggle-btn ${billingAnnual ? "is-active" : ""}`}
            onClick={() => setBillingAnnual(true)}
          >
            Annual
            <span className="pricing-toggle-badge">Save 20%</span>
          </button>
        </div>
        <div className="pricing-grid">
          {PRICING_CARDS.map((card) => {
            const planPricing = pricingByPlanCode[card.code];
            const monthlyAmountSubunits = planPricing?.monthlyAmountSubunits ?? 0;
            const annualAmountSubunits = planPricing?.annualAmountSubunits ?? 0;
            const monthlyDisplaySubunits = billingAnnual
              ? Math.max(0, Math.round(annualAmountSubunits / 12))
              : monthlyAmountSubunits;
            const price = formatCurrencySubunits(monthlyDisplaySubunits, resolvedPricingContext.currency);
            return (
              <article
                key={card.code}
                className={`pricing-card ${card.popular ? "pricing-card-popular" : ""} ${card.dark ? "pricing-card-dark" : ""}`}
              >
                {card.popular ? <span className="pricing-card-badge">Popular</span> : null}
                <h3 className="pricing-card-title">{card.title}</h3>
                <p className="pricing-card-price">
                  {price}
                  <span className="pricing-card-period">/mo</span>
                </p>
                <p className="pricing-card-billing">
                  {billingAnnual
                    ? `Billed annually in ${resolvedPricingContext.currency}`
                    : `Billed monthly in ${resolvedPricingContext.currency}`}
                </p>
                <p className="pricing-card-desc">{card.description}</p>
                <ul className="pricing-card-features" aria-label={`${card.title} features`}>
                  {card.features.map((feature) => (
                    <li key={feature}>
                      <CheckIcon className="pricing-card-check" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`pricing-card-cta ${card.dark ? "pricing-card-cta-dark" : ""} ${card.popular ? "pricing-card-cta-primary" : ""}`}
                  onClick={() => {
                    if (authUser) {
                      const selectedCycle: BillingCycle = billingAnnual ? "annual" : "monthly";
                      onChangePlan(card.code, selectedCycle);
                    } else {
                      openAuthModal("signin");
                    }
                  }}
                  disabled={planSubmitting || billingRedirecting}
                >
                  {card.cta}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container tool-faq-section" id="faqs" aria-label="Frequently asked questions">
        <div className="tool-faq-head">
          <p className="tool-section-kicker">FAQs</p>
          <h2>Frequently asked questions</h2>
          <p className="tool-faq-subtitle">Have questions? We&apos;re here to help.</p>
        </div>
        <div className="tool-faq-search-wrap">
          <SearchIcon className="tool-faq-search-icon" aria-hidden />
          <input
            type="search"
            className="tool-faq-search"
            placeholder="Search"
            aria-label="Search FAQs"
          />
        </div>
        <div className="tool-faq-list">
          {TOOL_FAQS.map((item, index) => (
            <details key={item.question} open={index === 0} className="tool-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container tool-seo-content-section" id="seo-content" aria-label="Image to prompt converter guide">
        <div className="tool-seo-guide-card">
          <div className="tool-seo-guide-header">
            <p className="tool-section-kicker">Guide</p>
            <h2 className="tool-seo-guide-title">Image to Prompt Converter: complete practical guide</h2>
            <p className="tool-seo-guide-intro">
              This long-form section explains core concepts, workflow choices, and prompt quality fundamentals without
              keyword stuffing.
            </p>
          </div>
          <article className="tool-seo-article">
            {SEO_COPY.map((section) => (
              <div key={section.heading} className="tool-seo-guide-block">
                <h3>{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={`${section.heading}-${paragraph.slice(0, 32)}`}>{paragraph}</p>
                ))}
              </div>
            ))}
          </article>
        </div>
      </section>

      <section className="container tool-trust-section" id="trust-signals" aria-label="Trust and performance">
        <div className="tool-section-head">
          <p className="tool-section-kicker">Trust + Performance</p>
          <h2>Built with practical trust signals</h2>
        </div>
        <div className="tool-trust-grid">
          <article>
            <ShieldIcon className="tool-trust-icon" />
            <h3>Privacy-focused handling</h3>
            <p>
              No permanent image storage in default generation flow, plus account-based access and user-managed saved
              prompts.
            </p>
          </article>
          <article>
            <ServerIcon className="tool-trust-icon" />
            <h3>Secure by default</h3>
            <p>HTTPS delivery, authenticated APIs, CDN-backed assets, and stable session controls across surfaces.</p>
          </article>
          <article>
            <CheckIcon className="tool-trust-icon" />
            <h3>Fast response flow</h3>
            <p>Optimized for low-friction generation with a fast interface tuned for sub-two-second interactions.</p>
          </article>
        </div>
      </section>

      {resultModalOpen ? (
        <div
          className="result-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Generated prompt result"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setResultModalOpen(false);
            }
          }}
        >
          <div className="result-modal">
            <div className="result-modal-stack">
              <div className="result-modal-grid">
                <div className="result-modal-image-col">
                  <h2>Uploaded Image</h2>
                  <figure className="result-modal-image-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt={imageName || "Uploaded image"} />
                    <figcaption>{imageName}</figcaption>
                  </figure>
                </div>

                <div className="result-modal-output-col">
                  <div className="result-modal-head">
                    <h2>GPT Prompt Output</h2>
                    <div className="result-modal-head-actions">
                      {(resultSaved || copied) && (
                        <span className="result-modal-action-feedback" role="status">
                          {resultSaved && copied ? "Saved · Copied" : resultSaved ? "Saved" : "Copied"}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={onSaveResult}
                        disabled={resultSaveBusy || resultSaved || !resultRequestId || !description}
                        aria-label={resultSaved ? "Saved" : resultSaveBusy ? "Saving..." : "Save prompt"}
                        title={resultSaved ? "Saved" : resultSaveBusy ? "Saving..." : "Save prompt"}
                      >
                        <SaveIcon className="button-icon" />
                      </button>
                      <button
                        type="button"
                        onClick={onCopyResult}
                        aria-label={copied ? "Copied" : "Copy text"}
                        title={copied ? "Copied" : "Copy"}
                      >
                        <CopyIcon className="button-icon" />
                      </button>
                    </div>
                  </div>
                  {resultSaveError ? <p className="result-modal-save-error">{resultSaveError}</p> : null}
                  <div className="result-modal-output-box">
                    <p>{description}</p>
                  </div>
                </div>
              </div>

              <div className="result-modal-actions-bar">
                <div className="result-modal-left-actions">
                  <button
                    type="button"
                    className="result-modal-generate-again"
                    onClick={() => {
                      setResultModalOpen(false);
                      clearSelectedImage();
                      openFilePicker();
                    }}
                  >
                    Generate another image
                  </button>
                  <button
                    type="button"
                    className="result-modal-close-action"
                    onClick={() => setResultModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <div className="result-modal-llm-icons" aria-label="Supported models">
                  <span className="result-modal-llm-note">Paste into AI and generate</span>
                  {MODAL_LLM_IMAGES.map((sample) => (
                    <button
                      type="button"
                      key={sample.label}
                      onClick={() => void onOpenLlm(sample)}
                      className="result-modal-llm-icon"
                      title={sample.label}
                      aria-label={`Open ${sample.label} with prompt`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sample.thumb} alt={sample.label} loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {outOfCreditsModalOpen ? (
        <div
          className="out-of-credits-modal-overlay profile-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="out-of-credits-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOutOfCreditsModalOpen(false);
          }}
        >
          <div className="out-of-credits-modal profile-modal">
            <div className="profile-modal-head">
              <h2 id="out-of-credits-title" className="profile-modal-title">
                You&apos;re out of credits
              </h2>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Close"
                onClick={() => setOutOfCreditsModalOpen(false)}
              >
                <CloseIcon className="profile-modal-close-icon" />
              </button>
            </div>
            <p className="out-of-credits-modal-copy">
              You&apos;ve used all {usage?.limit ?? "your"} prompts this month. Upgrade your plan to keep generating.
            </p>
            {usage ? (
              <p className="usage-strip-meta out-of-credits-usage">
                {usage.used} / {usage.limit} used
              </p>
            ) : null}
            <div className="out-of-credits-modal-actions">
              <button
                type="button"
                className="out-of-credits-cta-primary"
                onClick={() => {
                  setOutOfCreditsModalOpen(false);
                  setPlanModalOpen(true);
                }}
              >
                Upgrade plan
              </button>
              <button
                type="button"
                className="out-of-credits-cta-secondary"
                onClick={() => setOutOfCreditsModalOpen(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {authModalOpen ? (
        <div
          className="auth-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={authMode === "signup" ? "Sign up modal" : "Sign in modal"}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeAuthModal();
            }
          }}
        >
          <div className="auth-modal">
            <div className="auth-modal-top">
              <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === "signup"}
                  className={`auth-mode-button ${authMode === "signup" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthMessage("");
                  }}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={authMode === "signin"}
                  className={`auth-mode-button ${authMode === "signin" ? "is-active" : ""}`}
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthMessage("");
                  }}
                >
                  Sign in
                </button>
              </div>
              <button type="button" className="auth-modal-close" onClick={closeAuthModal} aria-label="Close">
                <CloseIcon className="auth-close-icon" />
              </button>
            </div>

            <h2>{authMode === "signup" ? "Create an account" : "Welcome back"}</h2>

            <form className="auth-modal-form" onSubmit={onSubmitAuth}>
              {authMode === "signup" ? (
                <div className="auth-name-row">
                  <input type="text" name="firstName" placeholder="First name" autoComplete="given-name" />
                  <input type="text" name="lastName" placeholder="Last name" autoComplete="family-name" />
                </div>
              ) : null}

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                required
              />
              <input
                type="password"
                name="password"
                placeholder={authMode === "signup" ? "Create password" : "Enter password"}
                autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                required
              />

              {authMode === "signup" ? (
                <input type="tel" name="phone" placeholder="Phone number (optional)" autoComplete="tel" />
              ) : null}

              <button
                type="submit"
                className={`auth-submit ${authMode === "signin" ? "auth-submit-signin" : "auth-submit-signup"}`}
                disabled={authSubmitting}
              >
                {authSubmitting ? "Please wait..." : authMode === "signup" ? "Create an account" : "Sign in"}
              </button>
              {authMessage ? <p className="auth-message">{authMessage}</p> : null}
            </form>

            <p className="auth-divider">OR CONTINUE WITH</p>

            <div className="auth-social-buttons">
              <button
                type="button"
                className="auth-social-google"
                onClick={() => void onGoogleAuth()}
                disabled={authSubmitting}
              >
                <GoogleIcon className="auth-google-icon" />
                <span>{authSubmitting ? "Please wait..." : "login with Google"}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {profileModalOpen ? (
        <div
          className="profile-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Profile"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setProfileModalOpen(false);
            }
          }}
        >
          <div className="profile-modal">
            <div className="profile-modal-head">
              <h2>Profile</h2>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setProfileModalOpen(false)}
                aria-label="Close"
              >
                <CloseIcon className="profile-modal-close-icon" />
              </button>
            </div>
            <p className="profile-modal-subtitle">Manage your plan, usage, and billing.</p>

            {!authUser ? (
              <article className="profile-card profile-empty">
                <h3>Sign in required</h3>
                <p>Log in to view and manage your account.</p>
                <button type="button" className="profile-primary-btn" onClick={() => { setProfileModalOpen(false); openAuthModal("signin"); }}>
                  Sign in
                </button>
              </article>
            ) : (
              <>
                <div className="profile-modal-grid">
                  <article className="profile-card">
                    <h3>Account</h3>
                    <div className="profile-item">
                      <span>Email</span>
                      <strong>{authUser.email}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Role</span>
                      <strong className="profile-pill">{authUser.role}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Status</span>
                      <strong className="profile-pill">{authUser.status}</strong>
                    </div>
                  </article>
                  <article className="profile-card">
                    <h3>Current Plan</h3>
                    <div className="profile-item">
                      <span>Plan</span>
                      <strong>{subscription?.planName || "Free"}</strong>
                    </div>
                    <div className="profile-item">
                      <span>Quota</span>
                      <strong>{subscription?.monthlyQuota == null ? "Unlimited" : `${subscription.monthlyQuota} prompts / month`}</strong>
                    </div>
                    <div className="profile-usage-meter">
                      <div className="profile-usage-meter-bar" style={{ width: `${usagePercent}%` }} />
                    </div>
                    <p className="profile-usage-note">{usageLine}</p>
                  </article>
                </div>
                <article className="profile-card">
                  <h3>Plans</h3>
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
                      onClick={() => openBillingPage()}
                    >
                      Manage billing
                    </button>
                    <button
                      type="button"
                      className="profile-secondary-btn"
                      disabled={profileRefreshLoading}
                      onClick={() => void onRefreshProfile()}
                    >
                      {profileRefreshLoading ? "Refreshing..." : "Refresh"}
                    </button>
                    <button
                      type="button"
                      className="profile-secondary-btn"
                      onClick={() => {
                        setProfileModalOpen(false);
                        onLogout();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </article>
                {planMessage ? <p className="profile-message">{planMessage}</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {planModalOpen ? (
        <div
          className="profile-modal-overlay plan-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Change plan"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPlanModalOpen(false);
            }
          }}
        >
          <div className="profile-modal plan-modal">
            <div className="profile-modal-head">
              <h2>Upgrade or downgrade plan</h2>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setPlanModalOpen(false)}
                aria-label="Close"
              >
                <CloseIcon className="profile-modal-close-icon" />
              </button>
            </div>
            <p className="profile-modal-subtitle">
              Choose your plan below. Use Manage billing for payment methods and invoices.
            </p>

            {!authUser ? (
              <div className="plan-modal-signin">
                <p>Sign in to change your plan.</p>
                <button
                  type="button"
                  className="profile-primary-btn"
                  onClick={() => {
                    setPlanModalOpen(false);
                    openAuthModal("signin");
                  }}
                >
                  Sign in
                </button>
              </div>
            ) : (
              <>
                <article className="profile-card plan-modal-cards">
                  <div className="profile-plan-row">
                    {planOptions.map((plan) => {
                      const isCurrent = currentPlanCode === plan.code;
                      return (
                        <button
                          key={plan.code}
                          type="button"
                          className={`profile-plan-btn ${isCurrent ? "is-active" : ""}`}
                          disabled={planSubmitting || billingRedirecting}
                          onClick={() => {
                            if (!isCurrent) void onChangePlan(plan.code);
                          }}
                        >
                          <span>{plan.label}</span>
                          <span>{plan.price}</span>
                          <span>{plan.quota}</span>
                          {isCurrent ? <span className="plan-modal-current-label">Current</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </article>
                {planMessage ? <p className="profile-message">{planMessage}</p> : null}
                <div className="plan-modal-actions">
                  <button
                    type="button"
                    className="profile-secondary-btn"
                    disabled={billingRedirecting}
                    onClick={() => openBillingPage()}
                  >
                    Manage billing
                  </button>
                  <button
                    type="button"
                    className="profile-secondary-btn"
                    onClick={() => setPlanModalOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}

      <footer className="footer footer-simple" id="footer-links">
        <div className="container footer-simple-inner">
          <div className="footer-simple-head">
            <div className="footer-simple-brand-block">
              <a className="footer-simple-brand" href="#home" aria-label="Image to Prompt brand">
                <BrandMarkIcon className="footer-simple-mark" />
                <span className="footer-simple-brand-text">
                  <span className="footer-simple-brand-main">Image to Prompt</span>
                  <span className="footer-simple-brand-sub">AI Image Prompt Generator</span>
                </span>
              </a>
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
                  onChange={(event) => setNewsletterEmail(event.target.value)}
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
              <a href="#home">Image to Prompt</a>
              <a href="/bulk">Bulk Image to Prompt</a>
              <a href="/pricing">Pricing</a>
              <a href="/chrome-extension">Chrome Extension</a>
              <a href="/faqs">FAQs</a>
              <a href="/contact">Contact</a>
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

      <button
        type="button"
        className="back-to-top"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        data-visible={showBackToTop ? "" : undefined}
      >
        <ChevronUpIcon aria-hidden />
      </button>
    </div>
  );
}

function normalizeUserRole(value: unknown): UserRole | null {
  if (value === "subscriber" || value === "admin" || value === "superadmin") {
    return value;
  }
  return null;
}

function normalizePlanCode(value: unknown): AnyPlanCode | null {
  if (value === "free" || value === "pro" || value === "unlimited" || value === "guest") {
    return value;
  }
  return null;
}

function normalizeInteger(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.round(num);
}

function normalizeUsageSnapshot(value: Partial<UsageSnapshot> | undefined): UsageSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const periodKey = typeof value.periodKey === "string" && value.periodKey.trim() ? value.periodKey : "";
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

function normalizeUserSnapshot(value: Partial<UserSnapshot> | undefined): UserSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id = normalizeInteger(value.id);
  const email = typeof value.email === "string" ? value.email.trim() : "";
  const role = normalizeUserRole(value.role);
  const status = typeof value.status === "string" && value.status.trim() ? value.status : "";

  if (id === null || !email || !role || !status) {
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

  const planCode = normalizePlanCode(value.planCode);
  const planName = typeof value.planName === "string" && value.planName.trim() ? value.planName : "";
  const status = typeof value.status === "string" && value.status.trim() ? value.status : "";
  const monthlyQuota = value.monthlyQuota === null ? null : normalizeInteger(value.monthlyQuota);
  const priceUsdCents = normalizeInteger(value.priceUsdCents);
  const idValue = value.id === null ? null : normalizeInteger(value.id);
  const userIdValue = value.userId === null ? null : normalizeInteger(value.userId);
  const renewsAt =
    typeof value.renewsAt === "string" && value.renewsAt.trim() ? value.renewsAt : value.renewsAt === null ? null : null;

  if (!planCode || planCode === "guest" || !planName || !status || priceUsdCents === null) {
    return null;
  }

  return {
    id: idValue,
    userId: userIdValue,
    planCode,
    planName,
    status,
    monthlyQuota: monthlyQuota === null ? null : Math.max(0, monthlyQuota),
    priceUsdCents: Math.max(0, priceUsdCents),
    renewsAt
  };
}

function normalizePlanSnapshot(value: Partial<PlanSnapshot> | undefined): PlanSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const code = normalizePlanCode(value.code);
  const name = typeof value.name === "string" && value.name.trim() ? value.name : "";
  const monthlyQuota = value.monthlyQuota === null ? null : normalizeInteger(value.monthlyQuota);
  const priceUsdCents = normalizeInteger(value.priceUsdCents);

  if (!code || !name || priceUsdCents === null) {
    return null;
  }

  return {
    code,
    name,
    monthlyQuota: monthlyQuota === null ? null : Math.max(0, monthlyQuota),
    priceUsdCents: Math.max(0, priceUsdCents)
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

function formatUsageLine(
  usage: UsageSnapshot | null,
  subscription: SubscriptionSnapshot | null
): string {
  if (!usage) {
    if (!subscription) {
      return "Usage resets monthly";
    }
    if (subscription.monthlyQuota === null) {
      return "Unlimited monthly generations";
    }
    return `0/${subscription.monthlyQuota} used this month`;
  }

  if (usage.limit === null) {
    return `${usage.used} used this month • Unlimited plan`;
  }

  const remaining = usage.remaining ?? Math.max(0, usage.limit - usage.used);
  return `${usage.used}/${usage.limit} used • ${remaining} left`;
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

function renderCompressedDataUrl(
  image: HTMLImageElement,
  maxDimension: number,
  quality: number
): string {
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
