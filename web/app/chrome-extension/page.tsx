import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BrandMarkIcon,
  CheckIcon,
  PuzzleIcon,
  ShieldIcon,
  SparkIcon
} from "../ui/icons";
import { ScrollAwareNav } from "../ui/scroll-aware-nav";
import { SiteFooter } from "../ui/site-footer";

const EXTENSION_DOWNLOAD_HREF = "/extension.zip";

const extensionSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Image to Prompt Chrome Extension",
  applicationCategory: "BrowserApplication",
  operatingSystem: "Chrome",
  description:
    "Generate clean AI prompts from images directly in the browser. Click an image, generate prompt text, and save it to your account.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  },
  url: "https://imagetopromptgenerator.one/chrome-extension"
};

const EXTENSION_FAQS: { question: string; answer: string }[] = [
  {
    question: "Is this the same account as the web app?",
    answer:
      "Yes. Login state, saved prompts, and credits are shared with your existing web account."
  },
  {
    question: "What happens when credits are exhausted?",
    answer:
      "You see a clear message in the extension and can upgrade your plan from billing controls."
  },
  {
    question: "Can I manage billing and saved prompts from here?",
    answer:
      "Yes. Open billing for upgrades and open saved prompts to review or delete only the prompts you saved."
  },
  {
    question: "How does the Chrome extension work?",
    answer:
      "Sign in, enable click-to-prompt, then click an image on any page to generate a prompt. You can copy or save the result."
  },
  {
    question: "Do I need to upload images manually?",
    answer:
      "No manual upload is required. The workflow is image-click based: click an image on any site to generate a prompt."
  },
  {
    question: "Can I save prompts generated in the extension?",
    answer:
      "Yes. Signed-in users can save selected prompts and review them later in Saved Prompts on the web."
  },
  {
    question: "Is usage tied to my plan credits?",
    answer:
      "Yes. Extension generations use the same account credits and subscription plan as the web app."
  },
  {
    question: "Which browsers are supported?",
    answer:
      "The extension is built for Chrome. Other Chromium-based browsers (e.g. Edge, Brave) may support it if they allow Chrome extensions."
  },
  {
    question: "Does the extension work on all websites?",
    answer:
      "Yes. Once installed, you can use click-to-prompt on images across any website you visit in the browser."
  },
  {
    question: "Is my data sent to your servers?",
    answer:
      "Only the image you click is sent for prompt generation. We do not store or scan your browsing history."
  },
  {
    question: "Can I use the extension without signing in?",
    answer:
      "You can try it with limited use. Signing in unlocks your plan credits, saved prompts, and full features."
  },
  {
    question: "How do I install the extension?",
    answer:
      "Download the extension from this page, open Chrome’s extensions page (chrome://extensions), enable Developer mode, then drag the downloaded file or use Load unpacked."
  },
  {
    question: "Why don’t I see the extension icon?",
    answer:
      "The icon appears in the Chrome toolbar. If it’s hidden, click the puzzle piece in the toolbar and pin Image to Prompt to keep it visible."
  },
  {
    question: "Can I turn off click-to-prompt temporarily?",
    answer:
      "Yes. Use the extension popup to disable click-to-prompt when you don’t want images to be clickable for generation."
  },
  {
    question: "Do saved prompts from the extension show on the web?",
    answer:
      "Yes. Prompts you save in the extension appear in Saved Prompts on the web app under the same account."
  },
  {
    question: "What image formats work?",
    answer:
      "Common web image formats (JPEG, PNG, WebP, GIF) work. Click any visible image on a page to generate a prompt."
  }
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: EXTENSION_FAQS.map((item) => ({
    "@type": "Question" as const,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer
    }
  }))
};

export const metadata: Metadata = {
  title: "Chrome Extension | Image to Prompt",
  description:
    "Install the Image to Prompt Chrome extension to click any image and generate AI-ready prompts instantly. Same account, credits, and saved prompts as web.",
  keywords: [
    "chrome extension image prompt",
    "image to prompt chrome extension",
    "click image to generate prompt",
    "ai prompt generator extension",
    "image prompt tool"
  ],
  alternates: {
    canonical: "/chrome-extension"
  },
  openGraph: {
    title: "Image to Prompt Chrome Extension",
    description:
      "Click any image in Chrome and generate prompt text instantly. Works with your existing account, credits, and saved prompts.",
    url: "/chrome-extension",
    type: "website"
  }
};

const featureCards = [
  {
    title: "Click-to-prompt workflow",
    body: "Generate prompts by clicking images directly on web pages. No extra tabs or manual copy-paste flow."
  },
  {
    title: "Shared login and credits",
    body: "The extension uses the same authentication, plan, and credit balance as your web account."
  },
  {
    title: "Saved prompts included",
    body: "Save only the prompts you choose and review them later from your Saved Prompts page."
  }
];

const useCases = [
  "Image to prompt for ad creatives and growth experiments.",
  "Prompt generation for ecommerce listing photos and product shots.",
  "Prompt drafting for design references, UI screenshots, and mood boards.",
  "Fast visual prompt capture while browsing inspiration sites."
];

const steps = [
  "Install the extension and sign in with your account.",
  "Enable click-to-prompt from the extension popup.",
  "Click any image on a page to generate, copy, or save your prompt."
];

export default function ChromeExtensionPage() {
  return (
    <div className="site-shell extension-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(extensionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <ScrollAwareNav>
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
          <Link href="/#upload" className="nav-login nav-login-btn">
            Open app
          </Link>
          <Link href="/pricing" className="nav-signup">
            Plans
            <ArrowRightIcon className="auth-icon" />
          </Link>
        </div>
      </ScrollAwareNav>

      <main className="extension-main">
        <section className="container extension-hero" id="extension">
          <div className="extension-hero-inner">
            <p className="extension-eyebrow">Browser Extension</p>
            <h1>Image to Prompt Chrome Extension</h1>
            <p>
              Turn any web image into a clean AI prompt in one click. Minimal UI, fast output, and account-aware usage
              that stays synced with your web version.
            </p>
            <div className="extension-hero-actions">
              <a href={EXTENSION_DOWNLOAD_HREF} download className="extension-cta-primary">
                <PuzzleIcon className="extension-btn-icon" />
                Install extension
              </a>
              <Link href="/#upload" className="extension-cta-secondary">
                Use web app
              </Link>
            </div>
          </div>
          <aside className="extension-hero-note">
            <h2>What you get</h2>
            <ul>
              <li>
                <CheckIcon className="extension-list-icon" />
                <span>Click image and generate prompt instantly</span>
              </li>
              <li>
                <CheckIcon className="extension-list-icon" />
                <span>Google/email login with 7-day session continuity</span>
              </li>
              <li>
                <CheckIcon className="extension-list-icon" />
                <span>Plan, credits, and saved prompts synced with web</span>
              </li>
            </ul>
          </aside>
        </section>

        <section className="container extension-section">
          <div className="extension-section-head">
            <SparkIcon className="extension-section-icon" />
            <h2>Why this extension is useful</h2>
          </div>
          <div className="extension-feature-grid">
            {featureCards.map((card) => (
              <article key={card.title} className="extension-feature-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="container extension-section extension-section-split">
          <article className="extension-split-card">
            <div className="extension-section-head">
              <PuzzleIcon className="extension-section-icon" />
              <h2>How it works</h2>
            </div>
            <ol className="extension-steps">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="extension-split-card">
            <div className="extension-section-head">
              <ShieldIcon className="extension-section-icon" />
              <h2>Best fit use cases</h2>
            </div>
            <ul className="extension-usecases">
              {useCases.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="container extension-contact">
          <h2>Need setup help or enterprise onboarding?</h2>
          <p>
            Contact <a href="mailto:abhi@argro.co">abhi@argro.co</a> for support, implementation guidance, or custom
            rollout requirements.
          </p>
        </section>

        <section className="container tool-faq-section" aria-label="Frequently asked questions">
          <div className="tool-faq-head">
            <h2>Frequently asked questions</h2>
          </div>
          <div className="tool-faq-list">
            {EXTENSION_FAQS.map((item, index) => (
              <details key={item.question} open={index === 0} className="tool-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter id="extension-footer" />
    </div>
  );
}
