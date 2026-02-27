import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon, BrandMarkIcon, SparkIcon } from "../../ui/icons";

type ToolDefinition = {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  bullets: string[];
};

const TOOL_MAP: Record<string, ToolDefinition> = {
  "ai-image-generator": {
    title: "AI Image Generator",
    description:
      "Create fresh visuals from text instructions, then bring your best outputs back into Image to Prompt workflows.",
    seoTitle: "AI Image Generator Tool | Image to Prompt",
    seoDescription:
      "Generate high-quality images from prompts and connect outputs with your Image to Prompt workflow.",
    bullets: [
      "Generate new visuals from descriptive prompts.",
      "Test style directions before campaign production.",
      "Reuse generated outputs as new prompt references."
    ]
  },
  "prompt-enhancer": {
    title: "Prompt Enhancer",
    description:
      "Expand short prompts into richer, model-ready instructions with better composition and style context.",
    seoTitle: "Prompt Enhancer Tool | Image to Prompt",
    seoDescription:
      "Improve your prompts with clearer structure, stronger style language, and more consistent AI outputs.",
    bullets: [
      "Improve weak prompts with more depth.",
      "Refine prompt structure for better output control.",
      "Standardize prompt quality across teams."
    ]
  },
  "background-remover": {
    title: "Background Remover",
    description:
      "Remove noisy backgrounds to isolate the main subject before generating cleaner image-to-prompt outputs.",
    seoTitle: "Background Remover Tool | Image to Prompt",
    seoDescription:
      "Remove distracting backgrounds and keep prompt extraction focused on the visual subject that matters.",
    bullets: [
      "Isolate product and portrait subjects quickly.",
      "Reduce noise before prompt conversion.",
      "Generate cleaner prompt language from focused visuals."
    ]
  },
  "image-upscaler": {
    title: "Image Upscaler",
    description:
      "Increase image clarity to improve detection quality when converting low-resolution images into prompts.",
    seoTitle: "Image Upscaler Tool | Image to Prompt",
    seoDescription:
      "Upscale low-resolution images for sharper detail and better prompt extraction quality.",
    bullets: [
      "Improve clarity for weak source images.",
      "Preserve texture and detail for prompt analysis.",
      "Reduce ambiguity in AI-generated prompt drafts."
    ]
  }
};

type PageParams = {
  params: {
    slug: string;
  };
};

export function generateMetadata({ params }: PageParams): Metadata {
  const tool = TOOL_MAP[params.slug];
  if (!tool) {
    return {
      title: "Tool not found | Image to Prompt"
    };
  }

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: {
      canonical: `/tools/${params.slug}`
    },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: `/tools/${params.slug}`,
      type: "website"
    }
  };
}

export default function RelatedToolPage({ params }: PageParams) {
  const tool = TOOL_MAP[params.slug];
  if (!tool) {
    notFound();
  }

  return (
    <div className="site-shell extension-page">
      <header className="top-nav is-scrolled">
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
            <Link href="/#upload" className="nav-login nav-login-btn">
              Open app
            </Link>
            <Link href="/pricing" className="nav-signup">
              Plans
              <ArrowRightIcon className="auth-icon" />
            </Link>
          </div>
        </div>
      </header>

      <main className="extension-main">
        <section className="container extension-section">
          <div className="extension-section-head">
            <SparkIcon className="extension-section-icon" />
            <h1>{tool.title}</h1>
          </div>
          <p>{tool.description}</p>
          <ul className="extension-usecases">
            {tool.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="extension-hero-actions" style={{ marginTop: 18 }}>
            <Link href="/#upload" className="extension-cta-primary">
              Use Image to Prompt
            </Link>
            <Link href="/image-to-prompt-converter" className="extension-cta-secondary">
              Back to Image to Prompt
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
