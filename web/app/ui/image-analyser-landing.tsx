"use client";

import NextImage from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
  PricingTopupSnapshot,
  SubscriptionSnapshot,
  UsageSnapshot,
  UserPlanCode,
  UserRole,
  UserSnapshot
} from "../lib/saas-types";
import { getLandingContent, type SeoCopySection } from "../lib/landing-content";
import {
  ArrowRightIcon,
  BrandMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  GoogleIcon,
  LayersIcon,
  SaveIcon,
  ServerIcon,
  ShareIcon,
  ShieldIcon,
  SparkIcon,
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

const LLM_ICONS_BASE = "/Assets/llm%20logo";

const SUPPORTED_LLM_IMAGES: LlmTarget[] = [
  {
    label: "ChatGPT",
    url: "https://chatgpt.com/",
    thumb: `${LLM_ICONS_BASE}/chatgpt-logo_svgstack_com_36931772287327.svg`,
    prefillParam: "q"
  },
  {
    label: "Microsoft Copilot",
    url: "https://copilot.microsoft.com/",
    thumb: `${LLM_ICONS_BASE}/copilot-color.svg`
  },
  {
    label: "Google Gemini",
    url: "https://gemini.google.com/app",
    thumb: `${LLM_ICONS_BASE}/gemini-logo_svgstack_com_37141772287353.svg`
  },
  {
    label: "Leonardo",
    url: "https://app.leonardo.ai/",
    thumb: `${LLM_ICONS_BASE}/leonardo-ai-seeklogo.svg`
  },
  {
    label: "Meta AI",
    url: "https://www.meta.ai/",
    thumb: `${LLM_ICONS_BASE}/meta-color.svg`
  },
  {
    label: "Grok",
    url: "https://grok.com/",
    thumb: `${LLM_ICONS_BASE}/grok.svg`,
    prefillParam: "q"
  },
  {
    label: "Midjourney",
    url: "https://www.midjourney.com/",
    thumb: `${LLM_ICONS_BASE}/midjourney-logo.svg`
  }
];

const SAMPLE_IMAGES: LlmTarget[] = SUPPORTED_LLM_IMAGES;
const MODAL_LLM_IMAGES: LlmTarget[] = SUPPORTED_LLM_IMAGES;

const SHARE_X_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const SHARE_LINKEDIN_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const SHARE_FACEBOOK_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);
const SHARE_WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const RESULT_TRANSLATE_LANGUAGES: { code: string; label: string }[] = [
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" }
];
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

const FEATURE_IMAGES: Record<string, string> = {
  "Image to prompt AI that actually reads the image":
    "/Assets/Hompage%20assets/Features/Image%20to%20prompt%20AI%20that%20actually%20reads%20the%20image.png",
  "JPG, PNG, WebP": "/Assets/Hompage%20assets/Features/JPG,%20PNG,%20WebP.png",
  "Fast results": "/Assets/Hompage%20assets/Features/Fast%20results.png",
  "Copy or save": "/Assets/Hompage%20assets/Features/Copy%20or%20save.png",
  "Your data stays yours": "/Assets/Hompage%20assets/Features/Your%20data%20stays%20yours.png",
  "Same account on web and extension": "/Assets/Hompage%20assets/Features/Same%20account%20on%20web%20and%20extension.png"
};

const BENEFIT_ICONS = [
  SparkIcon,
  ShieldIcon,
  LayersIcon,
  CheckIcon,
  SaveIcon,
  BoxIcon
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
const TOOL_FAQS = [
  {
    question: "Is this image to prompt converter free?",
    answer:
      "Yes. You can use the free image to prompt converter without signing up. Paid plans give you more generations and saved prompts."
  },
  {
    question: "How do I use the generated prompt in Midjourney or DALL·E?",
    answer:
      "Copy the prompt from our tool and paste it into Midjourney's /imagine box, DALL·E's prompt field, or any text-to-image AI. You're generating a text description from your image—that text is what you paste. Add style words (e.g. 'oil painting', 'cinematic') if you want. The prompt is yours to edit before you use it."
  },
  {
    question: "Which AI tools work with the generated prompts?",
    answer:
      "Any tool that takes a text prompt: ChatGPT, Midjourney, DALL·E, Gemini, Stable Diffusion, Leonardo, Runway. Plain language, so you can paste and tweak."
  },
  {
    question: "Is my image stored permanently?",
    answer:
      "Images are used only to generate the prompt. We don't keep them. Saved prompts are stored in your account; you can delete them anytime."
  },
  {
    question: "Can I use generated prompts commercially?",
    answer:
      "The prompts you generate are yours. Check the terms of whatever you paste them into (Midjourney, OpenAI, etc.) for commercial use."
  },
  {
    question: "What image formats and sizes are supported?",
    answer:
      "JPG, PNG, WebP. Big files may be resized. Clear, well-lit images give better prompts than tiny or heavily compressed ones."
  },
  {
    question: "How accurate is the generated prompt?",
    answer:
      "Depends on the image. Clear subject and good lighting usually get a solid prompt. You can edit the text before copying."
  },
  {
    question: "Do I need an account to try it?",
    answer:
      "No. Free plan works without sign-in. Sign in to save prompts, get higher limits, and use the Chrome extension with history."
  },
  {
    question: "Can I use this on mobile?",
    answer:
      "Yes. Use the site in your mobile browser—upload from camera or gallery, generate, copy. Chrome extension is for desktop (capture from any tab)."
  },
  {
    question: "What’s the difference between monthly and annual pricing?",
    answer:
      "Annual is cheaper (e.g. save 20%). Same features. Change or cancel from your profile."
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use
const SEO_COPY: SeoCopySection[] = [
  {
    heading: "What is an image to prompt converter?",
    paragraphs: [
      "An image to prompt converter is a tool that turns a picture into text. You upload an image; it gives you a written description you can paste into ChatGPT, Midjourney, DALL·E, or any AI that takes a text prompt. No more staring at a photo trying to phrase every detail—the image to prompt AI does the describing.",
      "Why it helps: the better your prompt, the better the result. Vague prompts get generic outputs. A good free image to prompt converter turns what you see (subject, lighting, style, mood) into clear sentences so your first try is already usable."
    ]
  },
  {
    heading: "Why use an image to prompt generator?",
    paragraphs: [
      "Lots of people have a reference image in their head or on their screen but find it hard to write the prompt. You know the look you want; putting it into words is the bottleneck. An image to prompt generator reads the image and writes the words for you.",
      "Same idea for teams: one person’s “warm, minimal product shot” is another’s “soft light, white background.” Convert image to prompt online once, and everyone works from the same description. Fewer revisions, more consistent briefs."
    ]
  },
  {
    heading: "How to convert image to prompt online",
    paragraphs: [
      "Pick a clear image—product shot, screenshot, moodboard, or reference. Upload it here, click generate, then copy the text. You can edit the prompt before pasting it into Midjourney, ChatGPT, or wherever. That’s the core flow.",
      "For repeat work, save the prompts you like. Build a small library so you’re not regenerating the same kind of brief every time. Many users do one pass with the image to prompt converter, then tweak a few words for brand or style."
    ]
  },
  {
    heading: "What makes a good prompt (and how the tool helps)",
    paragraphs: [
      "Strong prompts usually cover: what’s in the scene, the style (e.g. cinematic, flat lay), lighting, and mood. You don’t need to be a prompt engineer—an image to prompt converter drafts that structure from your image. You can then add or remove detail (e.g. “oil painting,” “wide angle”) to get the output you want.",
      "If the first result feels too generic, try a clearer or simpler source image, or add a line after the generated text. The tool gives you a solid first draft; you keep control of the final wording."
    ]
  },
  {
    heading: "Image to prompt converter vs writing prompts yourself",
    paragraphs: [
      "Writing prompts from scratch is flexible but slow. Describing every image by hand doesn’t scale when you’re doing lots of assets or iterations. A converter gives you a starting prompt in seconds, so you spend time editing instead of typing from zero.",
      "A common pattern: use the free image to prompt converter to get the base description, then adjust for your brand, campaign, or audience. You get speed and consistency without giving up control."
    ]
  },
  {
    heading: "Privacy and speed",
    paragraphs: [
      "We use your image only to generate the prompt. We don’t keep the image. Saved prompts live in your account; you can delete them anytime. We use HTTPS, normal auth, and try to keep the page and generation fast so you’re not waiting mid-session.",
      "If you care about data handling, check our privacy policy. The short version: images aren’t stored for the long term; you own your prompts."
    ]
  },
  {
    heading: "Who’s it for?",
    paragraphs: [
      "Anyone who needs to go from image to text prompt: AI artists, designers, content creators, marketers, game or concept artists. If you often have a reference image and need a prompt for Midjourney, ChatGPT, or another tool, convert image to prompt online here and paste the result.",
      "It’s also useful when several people need to share the same “brief” for a visual. One image, one generated prompt, same language for the whole team."
    ]
  }
];

const SITE_BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://imagetopromptgenerator.one").replace(
  /\/+$/,
  ""
);

/** Build schema from content so each variant has correct JSON-LD (avoids GSC duplicate/conflict). */
function buildSoftwareApplicationSchema(
  baseUrl: string,
  name: string,
  description: string,
  path: string,
  imageUrl?: string
) {
  const image =
    imageUrl &&
    (imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description,
    ...(image && { image: image }),
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: `${baseUrl}/${path}`
  };
}

function buildBreadcrumbSchema(baseUrl: string, pageName: string, pagePath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: pageName, item: `${baseUrl}/${pagePath}` }
    ]
  };
}

function buildOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Image to Prompt",
    url: `${baseUrl}/`,
    logo: `${baseUrl}/icon.svg`,
    description: "Free image to prompt generator and converter. Turn images into AI-ready prompts for ChatGPT, Midjourney, Gemini, and more."
  };
}

function buildWebSiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Image to Prompt",
    url: `${baseUrl}/`,
    description: "Free image to prompt generator: upload an image and get AI-ready prompts for ChatGPT, Midjourney, Gemini, and more.",
    publisher: {
      "@type": "Organization",
      name: "Image to Prompt",
      url: `${baseUrl}/`,
      logo: `${baseUrl}/icon.svg`
    },
    inLanguage: "en"
  };
}

function buildHowToSchema(
  baseUrl: string,
  pagePath: string,
  name: string,
  steps: Array<{ title: string; description: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    url: `${baseUrl}/${pagePath}`,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title.replace(/^Step \d+:\s*/i, "").trim() || s.title,
      text: s.description
    }))
  };
}

function buildArticleSchema(
  baseUrl: string,
  pagePath: string,
  headline: string,
  description: string,
  sections: Array<{ heading: string; paragraphs: string[] }>
) {
  const articleBody = sections
    .map((s) => `${s.heading}\n\n${s.paragraphs.join("\n\n")}`)
    .join("\n\n");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    articleBody,
    datePublished: "2024-01-01",
    dateModified: "2025-01-01",
    url: `${baseUrl}/${pagePath}#seo-content`,
    author: {
      "@type": "Organization",
      name: "Image to Prompt",
      url: `${baseUrl}/`
    },
    publisher: {
      "@type": "Organization",
      name: "Image to Prompt",
      url: `${baseUrl}/`,
      logo: `${baseUrl}/icon.svg`
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/${pagePath}#seo-content`
    }
  };
}

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
  topupCode?: string;
  credits?: number;
  message?: string;
  topup?: {
    code?: string;
    credits?: number;
  };
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

type ImageAnalyserLandingProps = { variant?: string };

export function ImageAnalyserLanding({ variant = "image-to-prompt" }: ImageAnalyserLandingProps) {
  const content = useMemo(() => getLandingContent(variant ?? "image-to-prompt"), [variant]);
  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }),
    [content.faqs]
  );
  const softwareApplicationSchema = useMemo(
    () =>
      buildSoftwareApplicationSchema(
        SITE_BASE_URL,
        content.schemaAppName,
        content.schemaAppDescription,
        content.schemaPagePath,
        content.heroImageUrl
      ),
    [
      content.schemaAppName,
      content.schemaAppDescription,
      content.schemaPagePath,
      content.heroImageUrl
    ]
  );
  const breadcrumbSchema = useMemo(
    () =>
      buildBreadcrumbSchema(SITE_BASE_URL, content.schemaPageName, content.schemaPagePath),
    [content.schemaPageName, content.schemaPagePath]
  );
  const organizationSchema = useMemo(() => buildOrganizationSchema(SITE_BASE_URL), []);
  const webSiteSchema = useMemo(() => buildWebSiteSchema(SITE_BASE_URL), []);
  const marqueeReviews = useMemo(
    () => [...content.reviews, ...content.reviews],
    [content.reviews]
  );
  const faqColumns = useMemo(() => {
    const mid = Math.ceil(content.faqs.length / 2);
    return [content.faqs.slice(0, mid), content.faqs.slice(mid)];
  }, [content.faqs]);
  const howToSchema = useMemo(
    () =>
      buildHowToSchema(
        SITE_BASE_URL,
        content.schemaPagePath,
        content.howToUseH2,
        content.steps
      ),
    [content.schemaPagePath, content.howToUseH2, content.steps]
  );
  const articleSchema = useMemo(
    () =>
      buildArticleSchema(
        SITE_BASE_URL,
        content.schemaPagePath,
        content.seoGuideTitle,
        content.seoGuideIntro,
        content.seoCopy
      ),
    [
      content.schemaPagePath,
      content.seoGuideTitle,
      content.seoGuideIntro,
      content.seoCopy
    ]
  );
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
  const [resultTranslateBusy, setResultTranslateBusy] = useState<boolean>(false);
  const [resultTranslateLang, setResultTranslateLang] = useState<string | null>(null);
  const [resultTranslateError, setResultTranslateError] = useState<string>("");
  const [shareMenuOpen, setShareMenuOpen] = useState<boolean>(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
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
  const [authSignupStartedAtMs, setAuthSignupStartedAtMs] = useState<number>(0);
  const [authCompanyWebsite, setAuthCompanyWebsite] = useState<string>("");
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
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [promptFormat, setPromptFormat] = useState<string | null>(null);
  const [openBenefitIndex, setOpenBenefitIndex] = useState<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const selectors = [
      ".home-main section",
      ".home-main article",
      ".home-main .tool-section-head",
      ".home-main .tool-interface-card",
      ".home-main .tool-feature-card",
      ".home-main .tool-usecase-card",
      ".home-main .tool-usecase-timeline-item",
      ".home-main .tool-benefit-card",
      ".home-main .tool-benefit-item",
      ".home-main .tool-example-card",
      ".home-main .tool-step-card",
      ".home-main .tool-related-card",
      ".home-main .tool-trust-grid article",
      ".home-main .tool-review-card",
      ".home-main .tool-faq-title",
      ".home-main .tool-faq-columns",
      ".home-main .tool-faq-item",
      ".home-main .tool-seo-guide-header",
      ".home-main .tool-seo-guide-block",
      ".home-main .footer-cta-inner",
      ".home-main .footer-simple-inner"
    ];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(", ")));
    elements.forEach((el) => el.classList.add("scroll-reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      elements.forEach((el) => el.classList.remove("scroll-reveal", "is-visible"));
    };
  }, []);
  const [pricingContext, setPricingContext] = useState<PricingContextSnapshot | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

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

  const topupOptions = useMemo(() => {
    const list = Array.isArray(resolvedPricingContext.topups)
      ? resolvedPricingContext.topups
          .map(normalizePricingTopupSnapshot)
          .filter((entry): entry is PricingTopupSnapshot => Boolean(entry))
      : [];

    return list
      .slice()
      .sort((a, b) => a.credits - b.credits);
  }, [resolvedPricingContext.topups]);

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

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [shareMenuOpen]);

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
      const payloadBody: Record<string, unknown> = {
        email,
        password
      };

      if (authMode === "signup") {
        payloadBody.signupStartedAtMs = authSignupStartedAtMs || Date.now();
        payloadBody.companyWebsite = authCompanyWebsite;
      }

      const response = await fetch(`${backendUrl}/api/auth/${authMode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payloadBody)
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

  async function onPurchaseTopup(topupCode: string) {
    if (!authToken) {
      setPlanMessage("Sign in to add credits.");
      openAuthModal("signin");
      return;
    }

    if (!topupCode) {
      setPlanMessage("Select a valid top-up package.");
      return;
    }

    setPlanSubmitting(true);
    setBillingRedirecting(true);
    setPlanMessage("");

    try {
      const response = await fetch(`${backendUrl}/api/billing/topup/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          topupCode
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
        throw new Error(payload.error || "Could not create top-up checkout session.");
      }

      const Razorpay = await ensureRazorpayLoaded();
      await new Promise<void>((resolve, reject) => {
        let completed = false;
        const checkout = new Razorpay({
          key: payload.keyId || "",
          amount: Number(payload.amount),
          currency: payload.currency || "USD",
          name: "Image to Prompt",
          description: payload.description || "Add credits",
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
              const verifyResponse = await fetch(`${backendUrl}/api/billing/topup/verify-payment`, {
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
              const creditsAdded = Number(verifyPayload.topup?.credits ?? payload.credits ?? 0);
              setPlanMessage(
                Number.isFinite(creditsAdded) && creditsAdded > 0
                  ? `${Math.round(creditsAdded)} credits added successfully.`
                  : "Credits added successfully."
              );
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
    } catch (topupError) {
      const message = topupError instanceof Error ? topupError.message : "Could not add credits.";
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
    if (mode === "signup") {
      setAuthSignupStartedAtMs(Date.now());
      setAuthCompanyWebsite("");
    }
    setAuthMessage("");
    setAuthModalOpen(true);
  }

  function closeAuthModal() {
    const scopedWindow = window as Window & { google?: { accounts?: { id?: { cancel?: () => void } } } };
    scopedWindow.google?.accounts?.id?.cancel?.();
    setAuthMessage("");
    setAuthCompanyWebsite("");
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
    setResultTranslateBusy(false);
    setResultTranslateLang(null);
    setResultTranslateError("");
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
    event.stopPropagation();
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

  async function onGenerate(source?: { imageDataUrl?: string; imageUrl?: string; promptFormat?: string | null }) {
    const requestImageDataUrl = source?.imageDataUrl ?? imageDataUrl;
    const requestImageUrl = source?.imageUrl ?? imageUrl;
    const requestFormat = source?.promptFormat !== undefined ? source.promptFormat : promptFormat;

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
          imageUrl: requestImageUrl || "",
          ...(requestFormat ? { promptFormat: requestFormat } : {})
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        if (response.status === 401) {
          setPlanMessage("Please sign in to continue.");
          openAuthModal("signin");
        } else if (response.status === 402) {
          setOutOfCreditsModalOpen(true);
          setPlanMessage("Monthly usage limit reached. Upgrade plan or add credits to continue.");
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

  async function onTranslatePrompt(targetLangCode: string) {
    if (!description || resultTranslateBusy || !authToken) {
      if (!authToken) {
        setResultTranslateError("Sign in to translate prompts.");
        openAuthModal("signin");
      }
      return;
    }

    const imagePayload =
      typeof imageDataUrl === "string" && imageDataUrl.startsWith("data:image/")
        ? { imageDataUrl, imageUrl: undefined }
        : { imageDataUrl: undefined, imageUrl: resultImageUrl || imageUrl || "" };

    if (!imagePayload.imageDataUrl && !imagePayload.imageUrl) {
      setResultTranslateError("Image data is missing. Generate again and try.");
      return;
    }

    setResultTranslateBusy(true);
    setResultTranslateLang(targetLangCode);
    setResultTranslateError("");

    try {
      const response = await fetch(`${backendUrl}/api/translate-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...imagePayload,
          description,
          targetLanguage: targetLangCode,
          model: resultModel
        })
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !payload.ok) {
        if (response.status === 401) {
          clearAuthState();
          openAuthModal("signin");
        } else if (response.status === 402) {
          setOutOfCreditsModalOpen(true);
          setResultTranslateError("Credits exhausted. Upgrade plan or add credits to continue.");
        } else {
          setResultTranslateError(payload.error || "Translation failed.");
        }
        return;
      }

      const text = typeof payload.description === "string" ? payload.description.trim() : "";
      if (text) {
        setDescription(text);
        setCopied(false);
        applySessionPayload(payload);
      }
    } catch (err) {
      setResultTranslateError(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setResultTranslateBusy(false);
      setResultTranslateLang(null);
    }
  }

  function onOpenLlm(sample: LlmTarget) {
    if (!description) {
      return;
    }

    const supportsPrefill = sample.label === "ChatGPT" || sample.label === "Grok";
    const destination = supportsPrefill && sample.prefillParam
      ? `${sample.url}${sample.url.includes("?") ? "&" : "?"}${sample.prefillParam}=${encodeURIComponent(description)}`
      : sample.url;

    const doCopy = () => {
      navigator.clipboard
        .writeText(description)
        .then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        })
        .catch(() => {
          setCopied(false);
        });
    };

    if (supportsPrefill) {
      // ChatGPT and Grok: open with prefilled prompt, then copy.
      window.open(destination, "_blank", "noopener,noreferrer");
      doCopy();
    } else {
      // Others: copy first, then redirect to chatbot page.
      doCopy();
      window.open(destination, "_blank", "noopener,noreferrer");
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
      <a href="/#home" className="skip-to-main">
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
          <a className="rb-brand" href="/#home" aria-label="Image to Prompt">
            <BrandMarkIcon className="rb-brand-mark" />
            <span className="rb-brand-text">Image to Prompt</span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            <a href="/#upload">Image to Prompt</a>
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
                          if (typeof window !== "undefined" && window.innerWidth <= 768) {
                            router.push("/profile");
                          } else {
                            setProfileModalOpen(true);
                          }
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
            <div style={pathname !== "/" ? { marginBottom: 30 } : undefined}>
              {content.heroImageUrl.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.heroImageUrl}
                  alt={content.heroImageAlt}
                  width={420}
                  height={340}
                  className="hero-left-image"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <NextImage
                  src={content.heroImageUrl}
                  alt={content.heroImageAlt}
                  width={420}
                  height={340}
                  className="hero-left-image"
                  priority
                />
              )}
            </div>
            <h1>
              <span>{content.heroLeftLine1}</span>
              <span>{content.heroLeftLine2}</span>
            </h1>
            <p className="hero-mini">
              {content.heroMini}
            </p>
            <p className="hero-mini-line">
              <span>Fast, simple and</span>
              <span className="hero-free-pill">100% Free to start</span>
            </p>
            <div className="hero-cta-row">
              <a href="/#upload" className="hero-cta-btn hero-cta-primary">
                Generate Prompt
              </a>
              <a href="/#tool-interface" className="hero-cta-btn hero-cta-secondary">
                See How it Works
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
                  <span className="hero-llm-tooltip" aria-hidden>
                    {sample.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div id="upload" className="hero-right">
            <h1 className="hero-right-heading">
              <span>{content.heroRightLine1}</span>
              <span>{content.heroRightLine2}</span>
            </h1>
            <p className="upload-support-text">
              {content.uploadSupportText}
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
                  {currentPlanCode === "pro" ? "Add credits" : "Upgrade plan"}
                </button>
              </div>
            ) : null}

            <div
              className={`upload-card ${dragActive ? "is-drag-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (event.dataTransfer) {
                  event.dataTransfer.dropEffect = "copy";
                }
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                event.stopPropagation();
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
                  By uploading an image or URL you agree to our <a href="/#terms">Terms of Service</a>. To learn more
                  about how remove.bg handles your personal data, check our <a href="/#privacy">Privacy Policy</a>.
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
          {content.counterItems.map((item) => (
            <article key={item.label} className="counter-card">
              <CounterValue value={item.value} />
              <p className="counter-label">{item.label}</p>
              <div className="counter-divider" />
              <p className="counter-description">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container tool-interface-section" id="tool-interface" aria-label="How the tool works">
        <div className="tool-section-head">
          <p className="tool-section-kicker">{content.toolInterfaceKicker}</p>
          <h2>{content.toolInterfaceH2}</h2>
          <p>
            {content.toolInterfaceIntro}
          </p>
        </div>
        <div className="tool-interface-grid scroll-stagger">
          {content.toolInterfaceCards.map((card, i) => (
            <article key={card.title} className="tool-interface-card">
              {i === 0 ? <BoxIcon className="tool-interface-icon" /> : i === 1 ? <SparkIcon className="tool-interface-icon" /> : <LayersIcon className="tool-interface-icon" />}
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container tool-features-section" id="features" aria-label="Features">
        <div className="tool-section-head">
          <p className="tool-section-kicker">{content.featuresKicker}</p>
          <h2>{content.featuresH2}</h2>
        </div>
        <div className="tool-feature-grid scroll-stagger">
          {content.features.map((feature) => {
            const featureImage = FEATURE_IMAGES[feature.title];
            return (
              <article key={feature.title} className="tool-feature-card">
                {featureImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="tool-feature-image" src={featureImage} alt={feature.title} loading="lazy" />
                ) : null}
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {content.examples.length > 0 && (
        <section className="container tool-example-section" id="example-results" aria-label="Example results">
          <div className="tool-section-head">
            <p className="tool-section-kicker">{content.examplesKicker}</p>
            <h2>{content.examplesH2}</h2>
          </div>
          <div className="tool-example-grid tool-example-grid-cards scroll-stagger">
            {content.examples.map((example, index) => (
              <article
                key={example.title}
                className={`tool-example-card tool-example-card-vertical ${index % 2 === 1 ? "tool-example-card-flip" : ""}`}
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
      )}

      <section className="container tool-usecases-section" id="use-cases" aria-label="Use cases">
        <div className="tool-section-head">
          <p className="tool-section-kicker">{content.useCasesKicker}</p>
          <h2>{content.useCasesH2}</h2>
        </div>
        <ol className="tool-usecase-timeline scroll-stagger">
          {content.useCases.map((useCase, index) => (
            <li key={useCase.title} className="tool-usecase-timeline-item">
              <span className="tool-usecase-timeline-badge">{index + 1}.</span>
              <span className="tool-usecase-timeline-line" aria-hidden="true" />
              <h3>{useCase.title}</h3>
              <p>{useCase.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container tool-benefits-section" id="benefits" aria-label="Benefits">
        <div className="tool-benefits-layout">
          <div className="tool-benefits-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Assets/portfolio-websiteFinal-Cooper-0226-29.webp"
              alt="Team collaborating at a desk"
              loading="lazy"
            />
          </div>
          <div className="tool-benefits-content">
            <div className="tool-benefits-head">
              <span className="tool-benefits-pill">{content.benefitsKicker}</span>
              <h2>{content.benefitsH2}</h2>
            </div>
            <div className="tool-benefit-accordion scroll-stagger">
              {content.benefits.map((benefit, index) => {
                const IconComponent = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
                return (
                  <details key={benefit.title} className="tool-benefit-item" open={openBenefitIndex === index}>
                    <summary
                      onClick={(event) => {
                        event.preventDefault();
                        setOpenBenefitIndex((current) => (current === index ? -1 : index));
                      }}
                    >
                      <span className="tool-benefit-summary">
                        <span className="tool-benefit-icon" aria-hidden>
                          <IconComponent />
                        </span>
                        <span className="tool-benefit-title">{benefit.title}</span>
                      </span>
                      <ChevronDownIcon className="tool-benefit-chevron" aria-hidden />
                    </summary>
                    <div className="tool-benefit-body">
                      <p>{benefit.description}</p>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section container" id="pricing" aria-label="Plans and pricing">
        <h2 className="pricing-heading">Plans and Pricing</h2>
        <p className="pricing-subtitle">
          {content.pricingSubtitlePrefix}Showing{" "}
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
          {PRICING_CARDS.slice(0, 2).map((card) => {
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
        <div className="pricing-topup-cta" aria-label="Credit top-up CTA">
          <div className="pricing-topup-cta-copy">
            <h3>Need more credits?</h3>
            <p>We have a top-up credits feature for one-time add-ons whenever you need extra prompts.</p>
          </div>
          <button
            type="button"
            className="pricing-topup-cta-btn"
            onClick={() => router.push("/pricing")}
          >
            View top-up pricing
          </button>
        </div>
      </section>

      <section className="container tool-faq-section" id="faqs" aria-label="Frequently asked questions">
        <div className="tool-faq-layout">
          <div className="tool-faq-title" data-reveal="left">
            <h2>
              Frequently
              <br />
              Asked Questions
            </h2>
          </div>
          <div className="tool-faq-columns" aria-label="FAQ list" data-reveal="right">
            {faqColumns.map((column, colIndex) => (
              <div key={`faq-col-${colIndex}`} className="tool-faq-col scroll-stagger">
                {column.map((item) => (
                  <details key={item.question} className="tool-faq-item">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container tool-seo-content-section" id="seo-content" aria-label="Image to prompt converter guide">
        <div className="tool-seo-guide-card">
          <div className="tool-seo-guide-header">
            <p className="tool-section-kicker">{content.seoGuideKicker}</p>
            <h2 className="tool-seo-guide-title">{content.seoGuideTitle}</h2>
            <p className="tool-seo-guide-intro">
              {content.seoGuideIntro}
            </p>
          </div>
          <article className="tool-seo-article scroll-stagger">
            {content.seoCopy.map((section) => (
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
          <p className="tool-section-kicker">{content.trustKicker}</p>
          <h2>{content.trustH2}</h2>
        </div>
        <div className="tool-trust-grid scroll-stagger">
          {content.trustCards.map((card, i) => (
            <article key={card.title}>
              {i === 0 ? <ShieldIcon className="tool-trust-icon" /> : i === 1 ? <ServerIcon className="tool-trust-icon" /> : <CheckIcon className="tool-trust-icon" />}
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container tool-reviews-section" id="reviews" aria-label="User reviews">
        <div className="tool-section-head">
          <p className="tool-section-kicker">{content.reviewsKicker}</p>
          <h2>{content.reviewsH2}</h2>
        </div>
        <div className="tool-reviews-marquee">
          <div className="tool-reviews-rows" role="presentation">
            {[0, 1].map((row) => (
              <div
                key={`review-row-${row}`}
                className={`tool-reviews-row ${row === 1 ? "is-reverse" : ""}`}
                onMouseMove={(event) => {
                  const container = event.currentTarget;
                  const rect = container.getBoundingClientRect();
                  const x = event.clientX - rect.left;
                  const y = event.clientY - rect.top;
                  container.style.setProperty("--review-x", `${x}px`);
                  container.style.setProperty("--review-y", `${y}px`);
                  container.dataset.hover = "true";
                }}
                onMouseLeave={(event) => {
                  delete event.currentTarget.dataset.hover;
                }}
              >
                <div className="tool-reviews-track">
                  {marqueeReviews.map((review, i) => {
                    const isDuplicate = i >= content.reviews.length;
                    return (
                      <article
                        key={`${review.name}-${i}-row-${row}`}
                        className="tool-review-card tool-review-card--marquee"
                        aria-hidden={isDuplicate}
                        tabIndex={isDuplicate ? -1 : undefined}
                      >
                        <div className="tool-review-panel">
                          <div className="tool-review-header">
                            <div className="tool-review-stars" aria-label="5 out of 5 stars">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className="tool-review-star" aria-hidden>★</span>
                              ))}
                            </div>
                          </div>
                          <div className="tool-review-divider" aria-hidden />
                          <h3 className="tool-review-title">{review.title}</h3>
                          <p className="tool-review-body">{review.body}</p>
                        </div>
                        <div className="tool-review-footer">
                          <span className="tool-review-name">{review.name}</span>
                          <span className="tool-review-location">{review.location}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
                    <figcaption>{imageName}</figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageDataUrl} alt={imageName || "Uploaded image"} />
                  </figure>
                  <div className="prompt-format-row">
                    <p className="prompt-format-label">Format <span className="prompt-format-credit">+1 credit</span></p>
                    <div className="prompt-format-tags">
                      {([
                        { id: "structured", label: "Structured Prompt" },
                        { id: "graphic-design", label: "Graphic Design" },
                        { id: "json", label: "JSON" }
                      ] as const).map(({ id, label }) => {
                        const isActive = promptFormat === id;
                        const isGenerating = loading && isActive;
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`prompt-format-tag ${isActive ? "is-active" : ""} ${isGenerating ? "is-generating" : ""}`}
                            onClick={() => {
                              const next = promptFormat === id ? null : id;
                              setPromptFormat(next);
                              if (next) {
                                void onGenerate({ promptFormat: next });
                              }
                            }}
                            disabled={loading}
                            aria-pressed={isActive}
                            aria-busy={isGenerating}
                          >
                            {isGenerating ? "Generating…" : label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="result-modal-output-col">
                  <div className="result-modal-head">
                    <h2>GPT Prompt Output</h2>
                    <div className="result-modal-head-actions">
                      <div className="result-modal-share-wrap result-modal-action-tooltip-wrap" ref={shareMenuRef}>
                        <button
                          type="button"
                          className={`result-modal-head-btn ${shareMenuOpen ? "is-active" : ""}`}
                          onClick={() => setShareMenuOpen((v) => !v)}
                          aria-label="Share prompt"
                          title="Share prompt"
                          aria-expanded={shareMenuOpen}
                          aria-haspopup="true"
                        >
                          <ShareIcon className="button-icon" />
                        </button>
                        <span className="result-modal-llm-tooltip">Share</span>
                        {shareMenuOpen && (
                          <div className="result-modal-share-menu" role="menu">
                            <a
                              href={
                                description
                                  ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                      description.length > 270 ? `${description.slice(0, 270)}…` : description
                                    )}`
                                  : "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              className="result-modal-share-item"
                              onClick={() => setShareMenuOpen(false)}
                            >
                              {SHARE_X_SVG}
                              <span>X</span>
                            </a>
                            <a
                              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                                typeof window !== "undefined" ? window.location.href : ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              className="result-modal-share-item"
                              onClick={() => setShareMenuOpen(false)}
                            >
                              {SHARE_LINKEDIN_SVG}
                              <span>LinkedIn</span>
                            </a>
                            <a
                              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                typeof window !== "undefined" ? window.location.href : ""
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              className="result-modal-share-item"
                              onClick={() => setShareMenuOpen(false)}
                            >
                              {SHARE_FACEBOOK_SVG}
                              <span>Facebook</span>
                            </a>
                            <a
                              href={
                                description
                                  ? `https://wa.me/?text=${encodeURIComponent(description)}`
                                  : "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              role="menuitem"
                              className="result-modal-share-item"
                              onClick={() => setShareMenuOpen(false)}
                            >
                              {SHARE_WHATSAPP_SVG}
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="result-modal-action-tooltip-wrap">
                        <button
                          type="button"
                          onClick={onSaveResult}
                          disabled={resultSaveBusy || resultSaved || !resultRequestId || !description}
                          aria-label={resultSaved ? "Saved" : resultSaveBusy ? "Saving..." : "Save prompt"}
                          title={resultSaved ? "Saved" : resultSaveBusy ? "Saving..." : "Save prompt"}
                        >
                          <SaveIcon className="button-icon" />
                        </button>
                        <span className="result-modal-llm-tooltip">{resultSaved ? "Saved" : "Save"}</span>
                      </div>
                      <div className="result-modal-action-tooltip-wrap">
                        <button
                          type="button"
                          onClick={onCopyResult}
                          aria-label={copied ? "Copied" : "Copy text"}
                          title={copied ? "Copied" : "Copy"}
                        >
                          <CopyIcon className="button-icon" />
                        </button>
                        <span className="result-modal-llm-tooltip">{copied ? "Copied" : "Copy"}</span>
                      </div>
                      <div className="result-modal-action-tooltip-wrap">
                        <button
                          type="button"
                          className="result-modal-head-btn"
                          onClick={() => setResultModalOpen(false)}
                          aria-label="Close"
                          title="Close"
                        >
                          <CloseIcon className="button-icon" />
                        </button>
                        <span className="result-modal-llm-tooltip">Close</span>
                      </div>
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
                </div>
                <div className="result-modal-llm-icons" aria-label="Supported models">
                  <div className="result-modal-lang-tags">
                    {RESULT_TRANSLATE_LANGUAGES.map(({ code, label }) => {
                      const isTranslating = resultTranslateLang === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          className={`result-modal-lang-tag ${isTranslating ? "is-translating" : ""}`}
                          onClick={() => void onTranslatePrompt(code)}
                          disabled={resultTranslateBusy || !authToken}
                          title="Translate prompt (1 credit)"
                          aria-label={
                            isTranslating
                              ? `Translating to ${label}…`
                              : `Translate prompt to ${label} (1 credit)`
                          }
                        >
                          {isTranslating ? "Generating…" : label}
                        </button>
                      );
                    })}
                    {resultTranslateError ? (
                      <span className="result-modal-translate-error">{resultTranslateError}</span>
                    ) : null}
                  </div>
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
                      <span className="result-modal-llm-tooltip">{sample.label}</span>
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
              You&apos;ve used all {usage?.limit ?? "your"} prompts this month. Upgrade plan or add credits to keep generating.
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
                {currentPlanCode === "pro" ? "Add credits" : "Upgrade plan"}
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
                    setAuthSignupStartedAtMs(Date.now());
                    setAuthCompanyWebsite("");
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
              {authMode === "signup" ? (
                <div className="auth-honeypot-wrap" aria-hidden="true">
                  <label htmlFor="auth-company-website">Company website</label>
                  <input
                    id="auth-company-website"
                    type="text"
                    name="companyWebsite"
                    tabIndex={-1}
                    autoComplete="off"
                    value={authCompanyWebsite}
                    onChange={(event) => setAuthCompanyWebsite(event.target.value)}
                  />
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
                  {topupOptions.length > 0 ? (
                    <>
                      <h3 className="profile-topup-title">Add credits</h3>
                      <div className="profile-topup-row">
                        {topupOptions.map((topup) => (
                          <button
                            key={topup.code}
                            type="button"
                            className="profile-topup-btn"
                            disabled={planSubmitting || billingRedirecting}
                            onClick={() => void onPurchaseTopup(topup.code)}
                          >
                            <span>{topup.credits} credits</span>
                            <span>{formatCurrencySubunits(topup.amountSubunits, resolvedPricingContext.currency)}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
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
                {topupOptions.length > 0 ? (
                  <article className="profile-card plan-modal-cards">
                    <h3 className="profile-topup-title">Need more prompts this month?</h3>
                    <div className="profile-topup-row">
                      {topupOptions.map((topup) => (
                        <button
                          key={topup.code}
                          type="button"
                          className="profile-topup-btn"
                          disabled={planSubmitting || billingRedirecting}
                          onClick={() => void onPurchaseTopup(topup.code)}
                        >
                          <span>{topup.credits} credits</span>
                          <span>{formatCurrencySubunits(topup.amountSubunits, resolvedPricingContext.currency)}</span>
                        </button>
                      ))}
                    </div>
                  </article>
                ) : null}
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

      <section className="footer-cta" aria-label="Call to action">
        <div className="footer-grid-pattern" />
        <div className="container footer-cta-inner" data-reveal="scale">
          <h2>Ready to generate better prompts?</h2>
          <p>
            Join thousands of creators, marketers, and product teams turning visuals into structured AI prompts faster.
          </p>
          <div className="cta-actions">
            <button
              className="cta-btn cta-btn-primary"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setTimeout(() => document.getElementById("hero-upload-input")?.click(), 300);
              }}
            >
              <UploadIcon style={{ width: 18, height: 18 }} />
              Upload an Image Now
            </button>
          </div>
        </div>
      </section>

      <footer className="footer footer-simple" id="footer-links">
        <div className="container footer-simple-inner">
          <div className="footer-simple-head">
            <div className="footer-simple-brand-block">
              <a className="footer-simple-brand" href="/#home" aria-label="Image to Prompt brand">
                <BrandMarkIcon className="footer-simple-mark" />
                <span className="footer-simple-brand-text">
                  <span className="footer-simple-brand-main">Image to Prompt</span>
                  <span className="footer-simple-brand-sub">AI Image Prompt Generator</span>
                </span>
              </a>
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
            <div className="footer-simple-links-grid" aria-label="Footer links">
              <nav className="footer-simple-link-col" aria-label="Product">
                <p className="footer-simple-link-heading">Product</p>
                <div className="footer-simple-links">
                  <a href="/#home">Image to Prompt</a>
                  <a href="/image-to-prompt-converter">Image to Prompt Converter</a>
                  <a href="/image-prompt-generator">Image Prompt Generator</a>
                  <a href="/bulk">Bulk Image to Prompt</a>
                  <a href="/pricing">Pricing</a>
                </div>
              </nav>

              <nav className="footer-simple-link-col" aria-label="AI Tools">
                <p className="footer-simple-link-heading">AI Tools</p>
                <div className="footer-simple-links">
                  <a href="/gemini-ai-photo-prompt">Gemini AI Photo Prompt</a>
                  <a href="/ai-gemini-photo-prompt">AI Gemini Photo Prompt</a>
                  <a href="/google-gemini-ai-photo-prompt">Google Gemini AI Photo Prompt</a>
                  <a href="/gemini-prompt">Gemini Prompt</a>
                  <a href="/chrome-extension">Chrome Extension</a>
                </div>
              </nav>

              <nav className="footer-simple-link-col" aria-label="AI Model Pages">
                <p className="footer-simple-link-heading">AI Model Pages</p>
                <div className="footer-simple-links">
                  <a href="/chatgpt-image-to-prompt">ChatGPT Image to Prompt</a>
                  <a href="/copilot-image-to-prompt">Copilot Image to Prompt</a>
                  <a href="/meta-ai-image-to-prompt">Meta AI Image to Prompt</a>
                  <a href="/grok-image-to-prompt">Grok Image to Prompt</a>
                  <a href="/leonardo-image-to-prompt">Leonardo Image to Prompt</a>
                  <a href="/midjourney-image-to-prompt">Midjourney Image to Prompt</a>
                </div>
              </nav>

              <nav className="footer-simple-link-col" aria-label="Style prompt conversions">
                <p className="footer-simple-link-heading">Style Prompt Conversions</p>
                <div className="footer-simple-links">
                  <a href="/photo-to-anime-prompt">Photo to Anime Prompt</a>
                  <a href="/portrait-to-realism-prompt">Portrait to Realism Prompt</a>
                  <a href="/image-to-ghibli-style-prompt">Image to Ghibli Style Prompt</a>
                  <a href="/photo-to-cinematic-prompt">Photo to Cinematic Prompt</a>
                  <a href="/sketch-to-architecture-prompt">Sketch to Architecture Prompt</a>
                  <a href="/image-to-3d-game-prompt">Image to 3D Game Prompt</a>
                  <a href="/photo-to-cyberpunk-prompt">Photo to Cyberpunk Prompt</a>
                  <a href="/image-to-fine-art-prompt">Image to Fine Art Prompt</a>
                </div>
              </nav>

              <nav className="footer-simple-link-col" aria-label="Company">
                <p className="footer-simple-link-heading">Company</p>
                <div className="footer-simple-links">
                  <a href="/faqs">FAQs</a>
                  <a href="/contact">Contact</a>
                  <a href="/about">About</a>
                  <a href="/security">Security</a>
                  <a href="/accessibility">Accessibility</a>
                </div>
              </nav>

              <nav className="footer-simple-link-col" aria-label="Legal and Support">
                <p className="footer-simple-link-heading">Legal and Support</p>
                <div className="footer-simple-links">
                  <a href="/privacy">Privacy Policy</a>
                  <a href="/terms">Terms of Service</a>
                  <a href="/cookies">Cookie Settings</a>
                  <a href="mailto:imagetopromptgenerate@gmail.com?subject=I%20need%20help%20for%20Image%20to%20Prompt">Help Center</a>
                </div>
              </nav>
            </div>
          </div>

          <div className="footer-simple-divider" />

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

          <div className="footer-simple-legal-row">
            <div className="footer-simple-legal">
              <p>© 2026 Image to Prompt Generator. All rights reserved.</p>
            </div>
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

function normalizePricingTopupSnapshot(
  value: Partial<PricingTopupSnapshot> | undefined
): PricingTopupSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const code = typeof value.code === "string" ? value.code.trim().toLowerCase() : "";
  const credits = normalizeInteger(value.credits);
  const amountSubunits = normalizeInteger(value.amountSubunits);
  const pricePerCreditSubunits = normalizeInteger(value.pricePerCreditSubunits);
  const currency =
    typeof value.currency === "string" && /^[A-Za-z]{3}$/.test(value.currency.trim())
      ? value.currency.trim().toUpperCase()
      : "";

  if (!code || credits === null || amountSubunits === null || pricePerCreditSubunits === null || !currency) {
    return null;
  }

  return {
    code,
    credits: Math.max(1, credits),
    amountSubunits: Math.max(1, amountSubunits),
    pricePerCreditSubunits: Math.max(1, pricePerCreditSubunits),
    currency
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
  const topups = Array.isArray(value.topups)
    ? value.topups.map(normalizePricingTopupSnapshot).filter((entry): entry is PricingTopupSnapshot => Boolean(entry))
    : [];

  if (!currency || plans.length === 0) {
    return null;
  }

  return {
    country,
    currency,
    plans,
    topups
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
