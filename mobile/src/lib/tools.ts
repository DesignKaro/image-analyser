export type ToolDefinition = {
  slug: string;
  title: string;
  description: string;
  bullets: string[];
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: "ai-image-generator",
    title: "AI Image Generator",
    description:
      "Create fresh visuals from text instructions, then bring outputs back into Image to Prompt workflows.",
    bullets: [
      "Generate new visuals from descriptive prompts.",
      "Test style directions before campaign production.",
      "Reuse generated outputs as new prompt references."
    ]
  },
  {
    slug: "prompt-enhancer",
    title: "Prompt Enhancer",
    description:
      "Expand short prompts into richer, model-ready instructions with stronger composition and style context.",
    bullets: [
      "Improve weak prompts with more depth.",
      "Refine prompt structure for better output control.",
      "Standardize prompt quality across teams."
    ]
  },
  {
    slug: "background-remover",
    title: "Background Remover",
    description:
      "Remove noisy backgrounds to isolate the main subject before generating cleaner image-to-prompt outputs.",
    bullets: [
      "Isolate product and portrait subjects quickly.",
      "Reduce visual noise before prompt conversion.",
      "Generate cleaner prompt language from focused visuals."
    ]
  },
  {
    slug: "image-upscaler",
    title: "Image Upscaler",
    description:
      "Increase image clarity to improve detection quality when converting low-resolution images into prompts.",
    bullets: [
      "Improve clarity for weak source images.",
      "Preserve texture and detail for prompt analysis.",
      "Reduce ambiguity in AI-generated prompt drafts."
    ]
  }
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
