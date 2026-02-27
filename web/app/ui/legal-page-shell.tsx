import Link from "next/link";
import { BrandMarkIcon } from "./icons";
import { SiteFooter } from "./site-footer";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
};

const LEGAL_ROUTES = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Settings" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/security", label: "Security" }
];

export function LegalPageShell({ eyebrow, title, subtitle, lastUpdated, sections }: LegalPageShellProps) {
  return (
    <div className="site-shell legal-page">
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
            <Link className="nav-login nav-login-btn" href="/#upload">
              Generate
            </Link>
          </div>
        </div>
      </header>

      <main className="legal-main">
        <section className="container legal-shell">
          <div className="legal-hero">
            <p className="legal-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <p className="legal-updated">Last updated: {lastUpdated}</p>
          </div>

          <div className="legal-grid">
            <article className="legal-content-card">
              {sections.map((section) => (
                <section className="legal-section" key={section.title}>
                  <h2>{section.title}</h2>
                  {(section.paragraphs || []).map((paragraph) => (
                    <p key={`${section.title}-${paragraph.slice(0, 28)}`}>{paragraph}</p>
                  ))}
                  {section.bullets && section.bullets.length ? (
                    <ul>
                      {section.bullets.map((item) => (
                        <li key={`${section.title}-${item.slice(0, 30)}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </article>

            <aside className="legal-side-card">
              <h2>Quick links</h2>
              <div className="legal-side-links">
                {LEGAL_ROUTES.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="legal-contact">
                <h3>Need help?</h3>
                <p>
                  Email us at <a href="mailto:abhi@argro.co">abhi@argro.co</a> for support, compliance, or account
                  requests.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter id="legal-footer" />
    </div>
  );
}
