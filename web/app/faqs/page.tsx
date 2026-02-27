import type { Metadata } from "next";
import Link from "next/link";
import { BrandMarkIcon } from "../ui/icons";
import { ScrollAwareNav } from "../ui/scroll-aware-nav";
import { SiteFooter } from "../ui/site-footer";

export const metadata: Metadata = {
  title: "FAQs | Image to Prompt",
  description:
    "Frequently asked questions about the Image to Prompt converter: pricing, usage, quality, accounts, extensions, and more.",
  keywords: ["image to prompt FAQ", "prompt generator help", "image converter questions", "AI prompt tool support"],
  alternates: { canonical: "/faqs" },
  openGraph: {
    title: "FAQs | Image to Prompt",
    description: "Answers to common questions about converting images to AI prompts.",
    url: "/faqs",
    type: "website"
  }
};

type FaqItem = { question: string; answer: string };

const FAQS_PAGE: FaqItem[] = [
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
    question: "What's the difference between monthly and annual pricing?",
    answer:
      "Annual billing is discounted (e.g. save 20%) compared to paying monthly. You get the same features; switching to annual reduces cost if you use the tool regularly. You can change or cancel from your profile."
  },
  {
    question: "Why did my prompt come out generic or vague?",
    answer:
      "Blurry images, cluttered scenes, or very low contrast can lead to vaguer prompts. Try a clearer reference image, crop to the main subject, or add a few words after generation to specify style, mood, or lens (e.g. cinematic, flat lay)."
  },
  {
    question: "Can I process multiple images in one go?",
    answer:
      "Depending on your plan, bulk or batch features may be available. Check the pricing page and your account for limits. For single-image workflow, generate one prompt per image and use Save to build a library."
  },
  {
    question: "Is there a Chrome extension?",
    answer:
      "Yes. The extension lets you capture an image from the current page and send it to the converter, then copy or save the prompt without leaving your workflow. Install it from the Chrome extension or product page."
  },
  {
    question: "How do I get better prompts for product or ecommerce photos?",
    answer:
      "Use clean product shots with simple backgrounds and even lighting. The tool will pick up objects, materials, and composition. You can then add terms like white background, lifestyle shot, or hero image in the generated text before copying."
  },
  {
    question: "Are prompts in English only?",
    answer:
      "Generated prompts are typically in English, which works well for most AI image models. You can paste the result into a translator or edit the text into another language if your target tool supports it."
  },
  {
    question: "What happens if I hit my generation limit?",
    answer:
      "When you reach your plan's limit, you'll need to wait until the limit resets (e.g. monthly) or upgrade for more generations. The interface will show your usage so you can plan accordingly."
  },
  {
    question: "Can I share or export my saved prompts?",
    answer:
      "Saved prompts are stored in your account. You can copy any prompt to share via email, docs, or team tools. Bulk export options may be available on higher plans; check the app or help for current features."
  },
  {
    question: "How is this different from describing the image myself?",
    answer:
      "The converter uses AI to turn the image into structured prompt text (subject, style, lighting, composition) in one step. That's faster than writing from scratch and keeps wording consistent. You still have full control to edit before using the prompt elsewhere."
  },
  {
    question: "How do I cancel or change my plan?",
    answer:
      "You can change or cancel your plan from your profile or account settings. Downgrades take effect at the end of the current billing period. Refunds depend on the plan and region; check the terms or contact support."
  },
  {
    question: "Does the tool work with screenshots or UI mockups?",
    answer:
      "Yes. Screenshots and UI mockups work well for generating prompts that describe layout, components, and style. Use clear, high-contrast screenshots for best results, and add terms like \"UI\", \"dashboard\", or \"mobile app\" in the output if needed."
  },
  {
    question: "What is the maximum image file size?",
    answer:
      "The upload limit is typically 15 MB per image. Very large files may be compressed or resized for processing. For fastest results, use images under a few MB when possible."
  },
  {
    question: "Can I use the tool for character or concept art references?",
    answer:
      "Yes. Character art, concept sketches, and style references are common use cases. The tool describes pose, clothing, mood, and composition so you can reuse or vary the prompt in your preferred AI model."
  },
  {
    question: "How do I get a refund?",
    answer:
      "Refund policy depends on your plan and region. Contact support or check the terms of service for eligibility. Generally, unused portions of annual plans may be refundable within a short window; monthly charges are typically non-refundable once the period has started."
  },
  {
    question: "Is there an API for bulk or automated use?",
    answer:
      "API access may be available on higher plans for teams that need programmatic or bulk generation. Check the pricing page or contact us for current API offerings and rate limits."
  },
  {
    question: "Why is my prompt different each time for the same image?",
    answer:
      "AI models can produce slight variations between runs. For more consistent output, use the same image and consider copying a result you like into your saved prompts. Small changes in the model or settings can also affect wording."
  },
  {
    question: "Can I use this for video thumbnails or social media?",
    answer:
      "Yes. Many users generate prompts for thumbnails, social posts, and campaign visuals. Upload a reference image, get the prompt, then paste it into your preferred image generator to create variations or similar compositions."
  },
  {
    question: "How do I delete my account or saved prompts?",
    answer:
      "You can delete individual saved prompts from your account. To delete your full account, use the account or profile settings, or contact support. Account deletion is permanent and may take a short time to process."
  },
  {
    question: "Does the tool support batch upload for the bulk page?",
    answer:
      "The bulk page allows multiple images to be processed in one session, subject to your plan limits. Each image gets its own prompt; you can then copy or save the results in bulk."
  },
  {
    question: "What browsers are supported?",
    answer:
      "The web app works in modern browsers including Chrome, Firefox, Safari, and Edge. For the best experience, use a recent version. The Chrome extension is available only for Chrome and Chromium-based browsers."
  },
  {
    question: "How do I reset my password?",
    answer:
      "Use the \"Forgot password\" or \"Reset password\" link on the sign-in page. You'll receive an email with instructions. If you don't see it, check spam or contact support."
  },
  {
    question: "Can I use reference images from the web?",
    answer:
      "Yes, if you have the right to use them. You can save an image from the web and upload it to the converter. Respect copyright and licensing; the tool does not grant rights to the source image."
  },
  {
    question: "Why does the extension sometimes not capture the right area?",
    answer:
      "The extension captures the visible area or a selected region depending on the version. Make sure the element you want is in view and try selecting a specific area if the tool offers that option. Updating the extension can also fix capture issues."
  },
  {
    question: "Is there a limit on how many prompts I can save?",
    answer:
      "Saved prompt limits depend on your plan. Free and starter plans may have a cap; higher plans typically allow more. Check your profile or the pricing page for your plan's limits."
  },
  {
    question: "How do I cite or attribute generated prompts?",
    answer:
      "Generated prompts are yours to use. If you need to attribute the tool, you can mention \"Image to Prompt\" or \"Image to Prompt Generator\" in credits or documentation. No formal citation is required for most use cases."
  },
  {
    question: "Can I use this for real estate or property photos?",
    answer:
      "Yes. Real estate and interior photos work well. The tool will describe rooms, lighting, and composition. You can then use the prompt to generate variations or stylized versions in other AI tools."
  },
  {
    question: "What if the generated prompt is too long or too short?",
    answer:
      "You can edit the prompt after generation. Shorten it by removing less important details, or add more style or context. Many AI image models have token limits, so trimming may be necessary for some destinations."
  },
  {
    question: "Does the tool work offline?",
    answer:
      "No. Generation requires an internet connection to our servers. You can view previously saved prompts while offline if they are cached, but new generations need to be online."
  },
  {
    question: "How do I contact support?",
    answer:
      "Use the Help Center link in the footer or contact the email provided on the site (e.g. abhi@argro.co) for account, billing, or technical support. We aim to respond within a few business days."
  },
  {
    question: "Can I use this for educational or nonprofit projects?",
    answer:
      "Yes. The tool can be used for educational and nonprofit projects. Check your plan for usage limits. Some plans may offer discounts for education or nonprofits; contact us for details."
  },
  {
    question: "What's the difference between the web app and the extension?",
    answer:
      "The web app is the full experience: upload, generate, save, and manage prompts. The extension lets you capture an image from any webpage and send it to the converter without leaving the tab. Both use the same account and limits."
  },
  {
    question: "How do I upgrade or downgrade my plan?",
    answer:
      "Go to your profile or the pricing page, choose the plan you want, and follow the checkout or change flow. Upgrades usually take effect immediately; downgrades apply at the end of the current billing period."
  },
  {
    question: "Can I use the same prompt for multiple AI tools?",
    answer:
      "Yes. The generated prompt is plain text. You can paste it into ChatGPT, Midjourney, DALL·E, or any other tool. You may need to tweak formatting or add tool-specific prefixes (e.g. /imagine) depending on the destination."
  },
  {
    question: "Why am I seeing an error when I upload an image?",
    answer:
      "Common causes include unsupported format, file too large, or a temporary server issue. Try a JPEG or PNG under 15 MB, refresh the page, or try again later. If it persists, contact support with the error message."
  },
  {
    question: "Is there a team or enterprise plan?",
    answer:
      "Team and enterprise plans may be available for higher volume and additional features. Check the pricing page or contact us for custom pricing, SSO, or dedicated support."
  },
  {
    question: "How do I enable or disable the Chrome extension?",
    answer:
      "Use Chrome's extension menu (puzzle icon) to pin, unpin, or disable the Image to Prompt extension. You can also manage it from chrome://extensions. Disabling does not affect your account or saved prompts."
  },
  {
    question: "Can I use this for logo or brand asset descriptions?",
    answer:
      "Yes. Upload a logo or brand asset to get a text description of its shapes, colors, and style. You can use that prompt to brief designers or to generate variations in other AI tools, while respecting brand guidelines."
  },
  {
    question: "What data do you collect when I use the tool?",
    answer:
      "We collect account and usage data necessary to provide the service, such as email, plan, and generation count. Images are processed for generation and not stored permanently by default. See our privacy policy for full details."
  },
  {
    question: "How do I report a bug or suggest a feature?",
    answer:
      "Use the Help Center or contact email to report bugs or send feature requests. Include steps to reproduce for bugs and your use case for feature ideas. We review feedback regularly."
  },
  {
    question: "Can I use the tool in a language other than English?",
    answer:
      "The interface and generated prompts are primarily in English. You can use the tool from any region; for non-English prompts, edit or translate the output after generation for your target language or model."
  },
  {
    question: "What happens to my prompts if I downgrade?",
    answer:
      "Saved prompts remain in your account. If your new plan has a lower saved-prompt limit, you may need to delete some to stay within the limit. Existing prompts are not automatically deleted."
  },
  {
    question: "Is there a desktop or mobile app?",
    answer:
      "The main product is the web app and the Chrome extension. There is no standalone desktop or native mobile app; the web app is mobile-friendly and works in the browser on phones and tablets."
  },
  {
    question: "How do I get better results for abstract or artistic images?",
    answer:
      "Abstract and artistic images can produce creative or metaphorical prompts. If the output is too literal, add style terms (e.g. abstract, surreal, mood) in the text. Clear, high-contrast art tends to produce stronger descriptions."
  },
  {
    question: "Can I integrate this with Zapier, Make, or other tools?",
    answer:
      "The extension may be available for additional workflows. Check the pricing or extension page for Zapier, Make (Integromat), or other automation tools. Contact us for custom extension needs."
  },
  {
    question: "Why do I need to sign in with Google or email?",
    answer:
      "Sign-in lets us associate generations and saved prompts with your account, enforce plan limits, and keep your data secure. You can still try the tool without signing in on the free tier with limited usage."
  },
  {
    question: "How often do you add new features?",
    answer:
      "We release updates regularly based on user feedback and roadmap priorities. Follow the newsletter or product updates for announcements. Major features are typically announced on the site or via email."
  },
  {
    question: "Can I use Image to Prompt for NFT or digital art descriptions?",
    answer:
      "Yes. Many creators use the tool to generate descriptions for digital art, NFTs, or portfolio pieces. Upload the art, get the prompt, and use it in your preferred AI or listing platform. Ensure you have rights to the source image."
  }
];

export default function FaqsPage() {
  return (
    <div className="site-shell legal-page faqs-page">
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

      <main className="legal-main faqs-main">
        <section className="container faqs-shell">
          <div className="faqs-hero">
            <p className="faqs-eyebrow">Help</p>
            <h1>Frequently asked questions</h1>
            <p className="faqs-subtitle">
              Find answers about the Image to Prompt converter, plans, usage, and more.
            </p>
          </div>

          <div className="faqs-list-wrap">
            <ul className="faqs-list">
              {FAQS_PAGE.map((item, index) => (
                <li key={`${item.question}-${index}`} className="faqs-item">
                  <details className="faqs-details">
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter id="faqs-footer" />
    </div>
  );
}
