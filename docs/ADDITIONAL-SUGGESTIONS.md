# Additional Suggestions (SEO, GSC, UX, Tech)

Quick reference for further improvements. Pick what fits your roadmap.

---

## 1. Social / share (high impact)

- **Default OG/Twitter image**  
  Layout has no `openGraph.images` or `twitter.images`. Add a default share image (e.g. `/og-default.png` 1200×630) in root `layout.tsx` so shares on social get a consistent preview. Per-page images can be added later for key landings.

- **Twitter card**  
  Add `twitter: { card: 'summary_large_image', title: ..., description: ... }` in metadata (or use layout default) so Twitter shows a large image and correct title/description.

---

## 2. Performance

- **Next/Image for hero images**  
  Hero images from Unsplash currently use `<img>`. Add `images.remotePatterns` in `next.config.mjs` for `images.unsplash.com` and switch to `NextImage` so hero images are optimized and cached.

- **Preconnect to Unsplash**  
  In layout or landing, add `<link rel="preconnect" href="https://images.unsplash.com" />` so hero images load faster on variant pages.

---

## 3. Content (from Ahrefs / SEO doc)

- **FAQ: image-to-prompt vs prompt-to-image**  
  Add one FAQ: “What’s the difference between image to prompt and prompt to image?” (you do image→prompt; tools like DALL·E do prompt→image). Targets question queries and clarifies the product.

- **Clarify “prompt generator”**  
  Short line or FAQ: “Is this an art prompt generator / writing prompt generator?” → “We’re an **image to prompt** generator: you give an image, we give a prompt. Use that prompt in any art or writing tool.” Helps with “prompt generator” and “art prompt generator” type searches.

---

## 4. Accessibility

- **Skip to main content**  
  Add a “Skip to main content” link at the top of the body (visible on focus) that targets `#home` or `#upload` so keyboard and screen-reader users can jump past the nav. Reduces GSC “Accessibility” issues and improves UX.

---

## 5. Technical / GSC

- **Stable Article dates**  
  Article schema uses fixed `datePublished` / `dateModified`. When you do a big content update, bump `dateModified` in code (or move to a single constant you update occasionally) so GSC sees fresh content without daily churn.

- **404 and redirects**  
  If you ever retire a URL (e.g. an old tool slug), add a redirect in `next.config` or middleware and remove it from the sitemap so GSC doesn’t report 404s.

- **Core Web Vitals**  
  Monitor LCP/INP/CLS in GSC or with PageSpeed Insights. Hero image (size, format, priority) and font loading are the usual levers.

---

## 6. Monitoring

- **GSC verification**  
  Ensure the property is verified (HTML tag or DNS) and that sitemap and canonicals are submitted and error-free.

- **Structured data**  
  Use “URL Inspection” and “Rich results” in GSC after deployment to confirm SoftwareApplication, FAQ, HowTo, Article, etc. validate and show as expected.

---

## 7. Optional

- **hreflang**  
  Only if you add more languages; add `alternates.languages` and hreflang tags so Google knows the language/region version of each URL.

- **Blog or “How-to” pages**  
  If you add a blog, use Article schema and internal links from posts to the main tool and variant pages (e.g. “Try our Gemini prompt tool”) to spread relevance and crawl depth.
