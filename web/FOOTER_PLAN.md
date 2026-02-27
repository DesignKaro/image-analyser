# Footer menu plan (SEO & tool focus)

Footer is structured in three groups for clarity and SEO: **Product**, **Company**, and **Legal & policies**.

---

## 1. Product / tool focus (top row)

*Purpose: Core product and feature pages. Strong anchor text for SEO.*

| Label               | Path / target   | Note                          |
|---------------------|-----------------|-------------------------------|
| Image to Prompt     | `/` or `/#upload` | Main tool / home              |
| Bulk                | `/bulk`         | Bulk image to prompt          |
| Pricing             | `/#pricing` or `/pricing` | Plans & pricing           |
| Prompt Templates    | `/prompt-templates` | SEO: “prompt templates”   |
| Chrome Extension    | `/chrome-extension`  | SEO: “chrome extension”   |
| Extension          | `/chrome-extension`                 | Extension page     |
| Help Center        | `/help`         | Support / FAQ                 |

---

## 2. Company (bottom row, left)

*Purpose: Brand, trust, and resources.*

| Label    | Path       |
|----------|------------|
| About    | `/about`   |

---

## 3. Legal & policies (bottom row, right)

*Purpose: Compliance, trust, and policy pages.*

| Label          | Path        | Note                    |
|----------------|-------------|-------------------------|
| Privacy Policy | `/privacy`  | Required for compliance |
| Terms of Service | `/terms`  | Legal                   |
| Cookie Settings| `/cookies`  | Consent / preferences   |
| Accessibility  | `/accessibility` | A11y statement   |
| Security       | `/security` | Security practices     |

---

## Implementation notes

- **Semantic HTML**: Each group is a `<nav>` with a clear `aria-label` (e.g. “Product”, “Company”, “Legal and policies”).
- **Anchor text**: Use the labels above consistently (e.g. “Terms of Service” not just “Terms”) for SEO.
- **Consistency**: Use this same structure and order on all pages that show the footer (home, bulk, etc.).
- **Internal links**: Prefer Next.js `Link` for in-app routes; `href` values above are the single source of truth for URLs.
