import type { Metadata } from "next";
import Link from "next/link";
import { BrandMarkIcon } from "../ui/icons";
import { ScrollAwareNav } from "../ui/scroll-aware-nav";
import { SiteFooter } from "../ui/site-footer";
import { ContactForm } from "../ui/contact-form";

export const metadata: Metadata = {
  title: "Contact | Image to Prompt",
  description:
    "Get in touch with the Image to Prompt team for support, partnerships, or feedback.",
  keywords: ["contact image to prompt", "support", "feedback", "get in touch"],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Image to Prompt",
    description: "Contact the Image to Prompt team for support and inquiries.",
    url: "/contact",
    type: "website"
  }
};

export default function ContactPage() {
  return (
    <div className="site-shell legal-page contact-page">
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
          <Link className="nav-login nav-login-btn" href="/#upload">
            Generate
          </Link>
        </div>
      </ScrollAwareNav>

      <main className="legal-main contact-main">
        <section className="container contact-shell">
          <div className="contact-hero">
            <p className="contact-eyebrow">Get in touch</p>
            <h1>Contact us</h1>
            <p className="contact-subtitle">
              Have a question, partnership idea, or feedback? We’d love to hear from you.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-info-card">
              <h2>Email us</h2>
              <p>
                For support, billing, or general inquiries, email us at{" "}
                <a href="mailto:abhi@argro.co">abhi@argro.co</a>. We aim to respond within a few business days.
              </p>
              <h2 className="contact-info-section">What to include</h2>
              <ul>
                <li>Your account email (if you have one)</li>
                <li>Brief description of your question or issue</li>
                <li>For bugs: steps to reproduce and device/browser</li>
              </ul>
            </div>

            <div className="contact-form-card">
              <h2>Send a message</h2>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter id="contact-footer" />
    </div>
  );
}
