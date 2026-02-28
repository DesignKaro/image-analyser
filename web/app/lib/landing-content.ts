/**
 * Landing page content by variant. Same template, different copy for SEO pages.
 * Human, no-fluff tone. Keywords woven in naturally.
 */

export type CounterItem = {
  value: string;
  label: string;
  description: string;
};

export type ToolStepItem = {
  title: string;
  description: string;
};

export type ToolFeatureItem = {
  title: string;
  description: string;
};

export type ToolUseCaseItem = {
  title: string;
  description: string;
};

export type ToolBenefitItem = {
  title: string;
  description: string;
};

export type ToolExampleItem = {
  title: string;
  imageUrl: string;
  imageAlt: string;
  prompt: string;
};

export type ToolFaqItem = {
  question: string;
  answer: string;
};

export type SeoCopySection = {
  heading: string;
  paragraphs: string[];
};

export type ToolInterfaceCard = {
  title: string;
  description: string;
};

export type TrustCard = {
  title: string;
  description: string;
};

export type ReviewItem = {
  name: string;
  location: string;
  date: string;
  title: string;
  body: string;
};

export type LandingContent = {
  /** Hero left image: local path (e.g. /home-hero-icons.png) or full URL (e.g. Unsplash). */
  heroImageUrl: string;
  heroImageAlt: string;
  heroLeftLine1: string;
  heroLeftLine2: string;
  heroMini: string;
  heroRightLine1: string;
  heroRightLine2: string;
  uploadSupportText: string;
  counterItems: CounterItem[];
  toolInterfaceKicker: string;
  toolInterfaceH2: string;
  toolInterfaceIntro: string;
  toolInterfaceCards: ToolInterfaceCard[];
  howToUseKicker: string;
  howToUseH2: string;
  howToUseIntro: string;
  steps: ToolStepItem[];
  featuresKicker: string;
  featuresH2: string;
  features: ToolFeatureItem[];
  examplesKicker: string;
  examplesH2: string;
  examples: ToolExampleItem[];
  useCasesKicker: string;
  useCasesH2: string;
  useCases: ToolUseCaseItem[];
  benefitsKicker: string;
  benefitsH2: string;
  benefits: ToolBenefitItem[];
  faqs: ToolFaqItem[];
  seoGuideKicker: string;
  seoGuideTitle: string;
  seoGuideIntro: string;
  seoCopy: SeoCopySection[];
  trustKicker: string;
  trustH2: string;
  trustCards: TrustCard[];
  reviewsKicker: string;
  reviewsH2: string;
  reviews: ReviewItem[];
  pricingSubtitlePrefix: string;
  /** For JSON-LD: breadcrumb and SoftwareApplication. Must match the page URL to avoid GSC errors. */
  schemaPageName: string;
  schemaPagePath: string;
  schemaAppName: string;
  schemaAppDescription: string;
};

const DEFAULT_EXAMPLES: ToolExampleItem[] = [
  {
    title: "Portrait to fashion prompt",
    imageUrl: "/Assets/posing-women-in-photos.webp",
    imageAlt: "Women posing for photography",
    prompt:
      "Fashion editorial portrait: posed figures, natural or studio lighting, contemporary style, clean background, editorial composition, lifestyle magazine aesthetic."
  },
  {
    title: "Nature forest to ecology prompt",
    imageUrl: "/Assets/pngtree-nature-forest-sun-ecology-image_2256183.jpg",
    imageAlt: "Forest scene with sun and ecology",
    prompt:
      "Ethereal forest landscape: dappled sunlight through canopy, lush greenery, ecological atmosphere, golden hour light rays, nature documentary style, sense of scale and depth."
  },
  {
    title: "Woman admiring almond tree to scenic prompt",
    imageUrl: "/Assets/young-woman-admiring-beauty-of-an-almond-tree-free-photo.webp",
    imageAlt: "Young woman admiring almond tree blossoms",
    prompt:
      "Spring scene: woman contemplative among almond blossom trees, soft bokeh, pastel palette, editorial lifestyle photography, delicate floral backdrop, serene mood."
  },
  {
    title: "Volcano to dramatic landscape prompt",
    imageUrl: "/Assets/Stills_STOCK_MM9905_ARvolcano127.jpg",
    imageAlt: "Volcanic landscape aerial view",
    prompt:
      "Dramatic volcanic landscape: aerial perspective, lava flows or crater detail, cinematic scale, dramatic lighting, earth tones and ash, documentary geography style."
  },
  {
    title: "Nature photography to Reddit-style prompt",
    imageUrl: "/Assets/outstanding-nature-photos-reddit-featured.jpg",
    imageAlt: "Outstanding nature photography",
    prompt:
      "Stunning nature photography: vibrant colors, sharp detail, striking composition, golden hour or blue hour, landscape or wildlife emphasis, high-impact visual."
  },
  {
    title: "Portrait to emotional prompt",
    imageUrl: "/Assets/1838459-nani.jpg",
    imageAlt: "Expressive portrait",
    prompt:
      "Emotional portrait: expressive face, soft lighting, intimate mood, shallow depth of field, editorial or documentary style, human connection emphasis."
  },
  {
    title: "Scenic view to travel prompt",
    imageUrl: "/Assets/-36-800x600-0.jpg",
    imageAlt: "Travel and scenic photography",
    prompt:
      "Travel photography: scenic vista, vibrant or moody atmosphere, sense of place, editorial composition, wanderlust mood, destination-style imagery."
  },
  {
    title: "Animal eye close-up to wildlife prompt",
    imageUrl: "/Assets/animal-eye-staring-close-up-watch-nature-generative-ai_188544-15471.avif",
    imageAlt: "Close-up of animal eye in nature",
    prompt:
      "Wildlife macro: animal eye in extreme close-up, natural lighting, textured detail, nature documentary style, shallow depth of field, intimate wildlife moment."
  },
  {
    title: "Earth from space to cosmic prompt",
    imageUrl: "/Assets/Earth-from-space-1-64e9a7c.jpg",
    imageAlt: "Earth viewed from space",
    prompt:
      "Planetary view: Earth from space, curvature visible, clouds and oceans, cinematic scale, blue and white palette, science documentary or NASA-style imagery."
  },
  {
    title: "Abstract scene to conceptual prompt",
    imageUrl: "/Assets/3d587ac8e51d5fa739586d42a15150f3.jpg",
    imageAlt: "Abstract or conceptual imagery",
    prompt:
      "Abstract or conceptual scene: layered composition, atmospheric depth, artistic mood, possible 3D or collage elements, editorial or fine-art style."
  },
  {
    title: "Demo image to product prompt",
    imageUrl: "/Assets/index-demo1.webp",
    imageAlt: "Product or demo photography",
    prompt:
      "Clean product or demo shot: professional lighting, minimal background, sharp detail, commercial or editorial style, premium brand atmosphere."
  },
  {
    title: "Modern scene to contemporary prompt",
    imageUrl: "/Assets/EZXJNGMGP5CH3DW3G2Z65TQEOA.webp",
    imageAlt: "Contemporary photography",
    prompt:
      "Contemporary scene: modern aesthetic, clean lines or organic forms, balanced composition, editorial or lifestyle mood, current visual language."
  },
  {
    title: "Editorial image to style prompt",
    imageUrl: "/Assets/KL50717.webp",
    imageAlt: "Editorial photography",
    prompt:
      "Editorial style: fashion, lifestyle, or commercial emphasis, strong composition, professional lighting, magazine-ready aesthetic."
  },
  {
    title: "Panda to wildlife conservation prompt",
    imageUrl: "/Assets/Panda_BradJosephs-4-best-fin_Web.jpg",
    imageAlt: "Panda in natural habitat",
    prompt:
      "Wildlife conservation imagery: panda in natural setting, soft natural light, environmental context, documentary style, gentle mood, nature photography emphasis."
  },
  {
    title: "Abstract futuristic to sci-fi prompt",
    imageUrl: "/Assets/abstract-modern-futuristic-3d-website-background-free-image.jpeg",
    imageAlt: "Abstract futuristic 3D background",
    prompt:
      "Futuristic 3D abstract: geometric or fluid shapes, tech aesthetic, modern palette, digital-art style, website or presentation background mood."
  },
  {
    title: "Nature shot to outdoor prompt",
    imageUrl: "/Assets/nature-photography-your-shot-02.avif",
    imageAlt: "Nature photography your shot",
    prompt:
      "Nature photography: outdoor scene, natural lighting, environmental storytelling, sharp detail, landscape or wildlife focus, sense of wonder."
  },
  {
    title: "Girl in boat to travel prompt",
    imageUrl: "/Assets/beautiful-girl-standing-boat-looking-mountains-ratchaprapha-dam-khao-sok-national-park-surat-thani-province-thailand_335224-849.avif",
    imageAlt: "Woman on boat at Ratchaprapha Dam, Thailand",
    prompt:
      "Travel editorial: woman on traditional boat, mountain backdrop, Ratchaprapha Dam, Thailand, golden light, adventure mood, destination photography style."
  },
  {
    title: "Mountain scene to landscape prompt",
    imageUrl: "/Assets/photo-1476514525535-07fb3b4ae5f1.avif",
    imageAlt: "Mountain and lake landscape",
    prompt:
      "Epic landscape: mountains and water, dramatic sky, sense of scale, nature documentary or travel photography, serene or dramatic mood."
  },
  {
    title: "Stock scene to commercial prompt",
    imageUrl: "/Assets/stock-photo-159533631-1500x1000.jpg",
    imageAlt: "Stock photography scene",
    prompt:
      "Commercial stock imagery: versatile scene, clean composition, professional lighting, suitable for advertising or editorial use, high-quality reproduction."
  },
  {
    title: "General image to versatile prompt",
    imageUrl: "/Assets/image.jpg",
    imageAlt: "General photography",
    prompt:
      "Versatile scene: clear subject, balanced composition, adaptable for various uses, editorial or commercial potential, clean visual narrative."
  },
  {
    title: "Lake Tahoe sunset to golden-hour prompt",
    imageUrl: "/Assets/reflective-sunset-lake-tahoe_t20_1WNjlO_86d68dec-479a-4ac2-bf10-fc5f7f5add34_1155x.webp",
    imageAlt: "Reflective sunset at Lake Tahoe",
    prompt:
      "Golden hour landscape: Lake Tahoe at sunset, reflective water, warm palette, dramatic sky, serene mood, travel or nature photography."
  },
  {
    title: "Slide image to presentation prompt",
    imageUrl: "/Assets/slide1.jpg.webp",
    imageAlt: "Presentation or slide imagery",
    prompt:
      "Presentation-ready image: clear focal point, professional aesthetic, suitable for slides or marketing, clean composition, versatile use."
  },
  {
    title: "Landscape to scenic prompt",
    imageUrl: "/Assets/landscape-7373484_1280.jpg",
    imageAlt: "Wide landscape scene",
    prompt:
      "Wide landscape: open vista, natural or pastoral scene, sense of depth, cinematic or documentary style, peaceful or dramatic mood."
  },
  {
    title: "Lizard close-up to macro wildlife prompt",
    imageUrl: "/Assets/animal-lizard-nature-multi-colored-close-up-generative-ai_188544-9072.avif",
    imageAlt: "Multi-colored lizard close-up in nature",
    prompt:
      "Macro wildlife: colorful lizard, natural habitat, extreme close-up, textured scales, nature documentary style, vibrant colors."
  },
  {
    title: "Orangutan to primate prompt",
    imageUrl: "/Assets/orangutan_1600x1000_279157.jpg",
    imageAlt: "Orangutan in habitat",
    prompt:
      "Wildlife portrait: orangutan in natural setting, expressive face, environmental context, conservation narrative, documentary photography style."
  },
  {
    title: "Woman with camera to photography prompt",
    imageUrl: "/Assets/woman-holding-camera-looking-through-lens-photo.jpeg",
    imageAlt: "Woman holding camera, looking through lens",
    prompt:
      "Lifestyle photography: woman with camera, looking through viewfinder, creative or professional mood, soft lighting, editorial or aspirational style."
  },
  {
    title: "Portfolio to professional prompt",
    imageUrl: "/Assets/portfolio-websiteFinal-Cooper-0226-29.webp",
    imageAlt: "Portfolio or website imagery",
    prompt:
      "Professional portfolio imagery: polished aesthetic, balanced composition, suitable for creative or business use, high-quality presentation."
  },
  {
    title: "Photo tips to educational prompt",
    imageUrl: "/Assets/how-to-take-better-photos-tips.jpg",
    imageAlt: "Photography tips and education",
    prompt:
      "Educational or tutorial imagery: photography-related scene, clear and instructive mood, professional quality, suitable for how-to or guide content."
  },
  {
    title: "Cool cat to pet photography prompt",
    imageUrl: "/Assets/gratisography-cool-cat-800x525.jpg",
    imageAlt: "Cool cat portrait",
    prompt:
      "Pet photography: cat portrait, character and personality, natural or studio lighting, lifestyle or editorial mood, animal photography emphasis."
  }
];

/** 5 examples per page for the 6 non-homepage pages. Unique sets for SEO. */
const EXAMPLES_SET_1 = DEFAULT_EXAMPLES.slice(0, 5);
const EXAMPLES_SET_2 = DEFAULT_EXAMPLES.slice(5, 10);
const EXAMPLES_SET_3 = DEFAULT_EXAMPLES.slice(10, 15);
const EXAMPLES_SET_4 = DEFAULT_EXAMPLES.slice(15, 20);
const EXAMPLES_SET_5 = DEFAULT_EXAMPLES.slice(20, 25);
const EXAMPLES_SET_6 = [...DEFAULT_EXAMPLES.slice(25, 29), DEFAULT_EXAMPLES[0]];

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    name: "Sarah",
    location: "Berlin",
    date: "Feb 18",
    title: "Exactly what I needed for Midjourney prompts",
    body: "Uploaded a moodboard, got a clean prompt in seconds. The image to prompt converter nailed the lighting and composition details. No more staring at reference images wondering how to phrase it."
  },
  {
    name: "Marcus",
    location: "London",
    date: "Feb 12",
    title: "Saves me tons of time on product shots",
    body: "I use this for ecommerce visuals. Clean product photo in, structured prompt out. Paste into DALL·E or Leonardo and tweak. Consistent briefs across our team now."
  },
  {
    name: "Priya",
    location: "Mumbai",
    date: "Feb 8",
    title: "Free tier got me hooked",
    body: "Tried without signing up—worked perfectly. Then signed in to save prompts. Chrome extension is great for grabbing refs from design tabs. Five stars."
  },
  {
    name: "James",
    location: "Austin",
    date: "Feb 5",
    title: "Simple, fast, no bloat",
    body: "Other tools overcomplicate. This one: upload, generate, copy. Prompt quality is solid. I edit a few words before pasting into ChatGPT. Does exactly what it says."
  },
  {
    name: "Elena",
    location: "Barcelona",
    date: "Jan 28",
    title: "Great for concept art references",
    body: "Feed it a character or environment sketch, get a prompt I can refine for Stable Diffusion. Saves so much time compared to writing from scratch."
  },
  {
    name: "David",
    location: "Toronto",
    date: "Jan 22",
    title: "Works on mobile too",
    body: "Used it from my phone—upload from gallery, generate, copy. No account needed to try. Exactly what I needed for quick social content prompts."
  },
  {
    name: "Yuki",
    location: "Tokyo",
    date: "Jan 15",
    title: "Reliable and straightforward",
    body: "Clear images give clear prompts. Fast, no weird outputs. Use it daily for design briefs. The free image to prompt converter is genuinely useful."
  },
  {
    name: "Alex",
    location: "Sydney",
    date: "Jan 10",
    title: "Perfect for Gemini and ChatGPT",
    body: "Paste the prompt into any AI. Works with Gemini, ChatGPT, Midjourney. One tool, many destinations. Saves prompts to my account for repeat use."
  },
  {
    name: "Nina",
    location: "Amsterdam",
    date: "Jan 5",
    title: "Clean prompts, easy workflow",
    body: "No fluff, no jargon. The converter describes what it sees—subject, style, mood. I add brand terms and paste. My go-to for image-to-text prompts."
  }
];

const IMAGE_TO_PROMPT_DEFAULT: LandingContent = {
  heroImageUrl: "/Assets/3-2-cat-png-14.png",
  heroImageAlt: "Image to Prompt – upload a photo, get a text prompt for any AI",
  heroLeftLine1: "Image to Prompt",
  heroLeftLine2: "in a Few Clicks",
  heroMini:
    "Free image to prompt generator: upload a photo, get a prompt. Paste it into ChatGPT, Midjourney, Gemini, or any AI—no account needed to try.",
  heroRightLine1: "Convert Image to Prompt",
  heroRightLine2: "Online in Seconds",
  uploadSupportText:
    "Drop a screenshot, product shot, or any image. Our image to prompt AI turns it into text you can use in ChatGPT, Gemini, Grok, Leonardo, and more.",
  counterItems: [
    {
      value: "250K+",
      label: "prompts generated",
      description: "People use this image to prompt generator for product shots, social posts, and design refs."
    },
    {
      value: "75K+",
      label: "images analyzed",
      description: "Screenshots, photos, and mockups turned into usable prompts."
    },
    {
      value: "4+",
      label: "AI tools supported",
      description: "Copy your prompt into ChatGPT, Gemini, Grok, Leonardo, Midjourney, and more."
    }
  ],
  toolInterfaceKicker: "How It Works",
  toolInterfaceH2: "Simple image to prompt converter: upload, generate, copy",
  toolInterfaceIntro:
    "Upload an image, hit generate, then copy or save the prompt. Your plan and credits show in the strip above so you know where you stand. Saved prompts live in your account for reuse.",
  toolInterfaceCards: [
    { title: "Upload", description: "Drag and drop or pick a file. JPG, PNG, WebP. Clear images give the best prompts." },
    {
      title: "Generate",
      description: "One click. The image to prompt AI reads the scene and writes a prompt you can edit before copying."
    },
    {
      title: "Copy or save",
      description: "Paste into ChatGPT, Midjourney, or any tool. Save the ones you want to use again."
    }
  ],
  howToUseKicker: "How To Use",
  howToUseH2: "How to convert image to prompt online",
  howToUseIntro: "Three steps. No signup required to try. Takes under a minute.",
  steps: [
    {
      title: "Step 1: Upload your image",
      description:
        "Drop a JPG, PNG, or WebP—screenshot, product photo, or any image. The image to prompt generator accepts most common formats."
    },
    {
      title: "Step 2: Click Generate",
      description:
        "We read the image and write a prompt: subject, lighting, style, composition. Usually a few seconds. You can edit the text before copying."
    },
    {
      title: "Step 3: Copy and paste into your AI",
      description:
        "Copy the prompt and paste it into ChatGPT, Midjourney, DALL·E, Gemini, or any tool. Save prompts you like to your account for later."
    }
  ],
  featuresKicker: "Features",
  featuresH2: "Core capabilities for reliable prompt generation",
  features: [
    {
      title: "Image to prompt AI that actually reads the image",
      description: "Describes subject, lighting, mood, and style in plain text. Edit the output before you copy."
    },
    { title: "JPG, PNG, WebP", description: "Standard formats. No weird converters—just upload and go." },
    { title: "Fast results", description: "Most images get a prompt in a few seconds. No long queues." },
    { title: "Copy or save", description: "One-click copy. Log in to save prompts you want to reuse." },
    {
      title: "Your data stays yours",
      description: "Images are used only to generate the prompt. Delete saved prompts anytime."
    },
    {
      title: "Same account on web and extension",
      description: "Use the site or the Chrome extension with one login and shared saved prompts."
    }
  ],
  examplesKicker: "Example Results",
  examplesH2: "Image to prompt examples: input photo → generated text",
  examples: [], // Homepage: no examples section
  useCasesKicker: "Use Cases",
  useCasesH2: "Who uses this image to prompt tool",
  useCases: [
    {
      title: "AI art and Midjourney",
      description: "Feed a reference image into this image to prompt converter, get a text prompt, paste into Midjourney or DALL·E for variations."
    },
    {
      title: "Designers",
      description: "Screenshot a UI or moodboard, convert image to prompt online, use the text to brief ChatGPT or another AI for new concepts."
    },
    {
      title: "Content and social",
      description: "Product shots, thumbnails, or reference pics → prompt in seconds. Reuse for captions, briefs, or more AI images."
    },
    {
      title: "Game and concept art",
      description: "Environment or character art as input. Get a prompt you can tweak for Stable Diffusion, Leonardo, or similar."
    },
    {
      title: "ChatGPT and multimodal AI",
      description: "Have an image but need the words? Free image to prompt converter: upload, copy the prompt, paste into ChatGPT or Gemini."
    },
    {
      title: "Marketing",
      description: "Product photos and brand visuals → consistent prompt briefs. Same style language across campaigns."
    }
  ],
  benefitsKicker: "Benefits",
  benefitsH2: "Why teams prefer this over manual prompting",
  benefits: [
    {
      title: "Less time writing prompts",
      description: "The image to prompt generator does the describing. You edit and paste where you need it."
    },
    {
      title: "No prompt-engineering degree",
      description: "If you can upload a photo, you can get a usable prompt. Tweak the text if you want more control."
    },
    {
      title: "No install, no config",
      description: "Convert image to prompt online in the browser. Upload, generate, copy. Optional Chrome extension for capture-from-tab."
    },
    {
      title: "Free tier to start",
      description: "Try the free image to prompt converter with no signup. Upgrade when you need more generations or saved prompts."
    }
  ],
  faqs: [
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
      answer: "Depends on the image. Clear subject and good lighting usually get a solid prompt. You can edit the text before copying."
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
      question: "What's the difference between monthly and annual pricing?",
      answer: "Annual is cheaper (e.g. save 20%). Same features. Change or cancel from your profile."
    },
    {
      question: "Why did my prompt come out generic or vague?",
      answer:
        "Blurry images, cluttered scenes, or very low contrast can lead to vaguer prompts. Try a clearer reference image, crop to the main subject, or add a few words after generation to specify style, mood, or lens (e.g. \"cinematic\", \"flat lay\")."
    },
    {
      question: "Can I process multiple images in one go?",
      answer:
        "Depending on your plan, bulk or batch features may be available. Check the pricing page and your account for limits. For single-image workflow, generate one prompt per image and use \"Save\" to build a library."
    },
    {
      question: "Is there a Chrome extension?",
      answer:
        "Yes. The extension lets you capture an image from the current page and send it to the converter, then copy or save the prompt without leaving your workflow. Install it from the Chrome extension or product page."
    },
    {
      question: "How do I get better prompts for product or ecommerce photos?",
      answer:
        "Use clean product shots with simple backgrounds and even lighting. The tool will pick up objects, materials, and composition. You can then add terms like \"white background\", \"lifestyle shot\", or \"hero image\" in the generated text before copying."
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
    }
  ],
  seoGuideKicker: "Guide",
  seoGuideTitle: "Image to prompt: a short guide",
  seoGuideIntro:
    "What an image to prompt converter does, why it's useful, and how to get the most from it. Plain language, no jargon.",
  seoCopy: [
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
        "Same idea for teams: one person's \"warm, minimal product shot\" is another's \"soft light, white background.\" Convert image to prompt online once, and everyone works from the same description. Fewer revisions, more consistent briefs."
      ]
    },
    {
      heading: "How to convert image to prompt online",
      paragraphs: [
        "Pick a clear image—product shot, screenshot, moodboard, or reference. Upload it here, click generate, then copy the text. You can edit the prompt before pasting it into Midjourney, ChatGPT, or wherever. That's the core flow.",
        "For repeat work, save the prompts you like. Build a small library so you're not regenerating the same kind of brief every time. Many users do one pass with the image to prompt converter, then tweak a few words for brand or style."
      ]
    },
    {
      heading: "What makes a good prompt (and how the tool helps)",
      paragraphs: [
        "Strong prompts usually cover: what's in the scene, the style (e.g. cinematic, flat lay), lighting, and mood. You don't need to be a prompt engineer—an image to prompt converter drafts that structure from your image. You can then add or remove detail (e.g. \"oil painting,\" \"wide angle\") to get the output you want.",
        "If the first result feels too generic, try a clearer or simpler source image, or add a line after the generated text. The tool gives you a solid first draft; you keep control of the final wording."
      ]
    },
    {
      heading: "Image to prompt converter vs writing prompts yourself",
      paragraphs: [
        "Writing prompts from scratch is flexible but slow. Describing every image by hand doesn't scale when you're doing lots of assets or iterations. A converter gives you a starting prompt in seconds, so you spend time editing instead of typing from zero.",
        "A common pattern: use the free image to prompt converter to get the base description, then adjust for your brand, campaign, or audience. You get speed and consistency without giving up control."
      ]
    },
    {
      heading: "Privacy and speed",
      paragraphs: [
        "We use your image only to generate the prompt. We don't keep the image. Saved prompts live in your account; you can delete them anytime. We use HTTPS, normal auth, and try to keep the page and generation fast so you're not waiting mid-session.",
        "If you care about data handling, check our privacy policy. The short version: images aren't stored for the long term; you own your prompts."
      ]
    },
    {
      heading: "Who's it for?",
      paragraphs: [
        "Anyone who needs to go from image to text prompt: AI artists, designers, content creators, marketers, game or concept artists. If you often have a reference image and need a prompt for Midjourney, ChatGPT, or another tool, convert image to prompt online here and paste the result.",
        "It's also useful when several people need to share the same \"brief\" for a visual. One image, one generated prompt, same language for the whole team."
      ]
    }
  ],
  trustKicker: "Trust",
  trustH2: "Privacy, security, and speed for your image to prompt workflow",
  trustCards: [
    {
      title: "Your images aren't stored",
      description: "We use them only to generate the prompt. Saved prompts are in your account; you can delete them anytime."
    },
    {
      title: "Secure connection",
      description: "HTTPS, normal login, and stable sessions so your data stays protected."
    },
    {
      title: "Fast generation",
      description: "Most prompts ready in seconds. No long waits so you can keep working."
    }
  ],
  reviewsKicker: "Reviews",
  reviewsH2: "What people say about the image to prompt tool",
  reviews: DEFAULT_REVIEWS,
  pricingSubtitlePrefix:
    "Simple pricing for the image to prompt generator. Save when you pay yearly; switch plans anytime from your profile. ",
  schemaPageName: "Image to Prompt Converter",
  schemaPagePath: "image-to-prompt-converter",
  schemaAppName: "Image to Prompt Converter",
  schemaAppDescription:
    "Free image to prompt converter online. Upload an image, generate a structured AI prompt, and use it in ChatGPT, Midjourney, Gemini, and more."
};

/** Gemini AI photo prompt – page focused on using photos with Gemini */
const GEMINI_AI_PHOTO_PROMPT: LandingContent = {
  ...IMAGE_TO_PROMPT_DEFAULT,
  heroImageUrl: "/Assets/A-clear-image-of-a-woman-wearing-red-sharpened-by-Fotors-image-sharpener-removebg-preview.png",
  heroImageAlt: "Turn a photo into a Gemini-ready text prompt",
  heroLeftLine1: "Gemini AI Photo Prompt",
  heroLeftLine2: "From Any Image",
  heroMini:
    "Turn any photo into a Gemini-ready prompt. Upload an image, get a clean text prompt, then paste it into Google Gemini for images, chat, or ideas. No account needed to try.",
  heroRightLine1: "Get a Gemini Photo Prompt",
  heroRightLine2: "in Seconds",
  uploadSupportText:
    "Drop a photo—screenshot, product shot, or reference. Our tool turns it into a prompt you can use in Gemini. Same flow as the main image-to-prompt tool; copy and paste where you need it.",
  counterItems: [
    {
      value: "250K+",
      label: "prompts generated",
      description: "Including plenty of Gemini photo prompts for product shots, social content, and creative briefs."
    },
    {
      value: "75K+",
      label: "images analyzed",
      description: "Photos and screenshots turned into AI-ready text for Gemini and other tools."
    },
    {
      value: "4+",
      label: "AI tools supported",
      description: "Gemini, ChatGPT, Midjourney, DALL·E, and more. One prompt, many places."
    }
  ],
  toolInterfaceKicker: "How It Works",
  toolInterfaceH2: "Gemini photo prompt in three steps",
  toolInterfaceIntro:
    "Upload your image, click generate, then copy the prompt. Paste it into Gemini (or any AI). Your credits and saved prompts stay in sync with your account.",
  toolInterfaceCards: [
    {
      title: "Upload",
      description: "Any photo: JPG, PNG, WebP. Clear images give the best Gemini-ready prompts."
    },
    {
      title: "Generate",
      description: "We describe the image in words—subject, style, lighting. Edit the text if you want before copying."
    },
    {
      title: "Copy into Gemini",
      description: "Paste the prompt in Gemini for image prompts, chat, or follow-up. Save the ones you reuse."
    }
  ],
  howToUseKicker: "How To Use",
  howToUseH2: "How to get a Gemini AI photo prompt",
  howToUseIntro: "Upload a photo, generate, copy. Then paste into Gemini. No signup required to try.",
  steps: [
    {
      title: "Step 1: Upload your photo",
      description: "Drop the image you want to turn into a Gemini prompt. Same formats as the main tool: JPG, PNG, WebP."
    },
    {
      title: "Step 2: Generate",
      description: "Click generate. You get a text description of the image—that’s your Gemini photo prompt. Tweak the wording if you like."
    },
    {
      title: "Step 3: Paste into Gemini",
      description: "Copy the prompt and paste it into Google Gemini. Use it for image generation, chat, or as a brief. Save prompts you like in your account."
    }
  ],
  featuresKicker: "Features",
  featuresH2: "What you get for Gemini photo prompts",
  features: [
    {
      title: "Photo to prompt for Gemini",
      description: "We read your image and write a clear text prompt. Paste it into Gemini as-is or edit first."
    },
    { title: "Standard image formats", description: "JPG, PNG, WebP. No extra conversion steps." },
    { title: "Quick results", description: "Most images get a prompt in a few seconds." },
    { title: "Copy or save", description: "One-click copy. Log in to save prompts for reuse in Gemini and elsewhere." },
    { title: "Images not stored", description: "We use the image only to generate the prompt. Your prompts, your account." },
    {
      title: "Web and extension",
      description: "Same login and saved prompts on the site and the Chrome extension."
    }
  ],
  examplesKicker: "Example Results",
  examplesH2: "Photo to Gemini prompt examples",
  examples: EXAMPLES_SET_3,
  useCasesKicker: "Use Cases",
  useCasesH2: "Who uses a Gemini AI photo prompt",
  useCases: [
    {
      title: "Gemini image prompts",
      description: "Have a reference photo? Get a Gemini photo prompt, paste it in, and let Gemini generate variations or answer questions about the scene."
    },
    {
      title: "Content and social",
      description: "Product shots or thumbnails → prompt in seconds. Use the same prompt in Gemini for captions or ideas."
    },
    {
      title: "Designers",
      description: "Screenshot a UI or moodboard, get a text brief, paste into Gemini for quick concept or copy ideas."
    },
    {
      title: "Marketing",
      description: "Turn product photos into consistent Gemini prompts for campaigns. One image, one prompt, same language for the team."
    },
    {
      title: "Chat and follow-up",
      description: "Use the generated prompt in Gemini as a starting point for chat, refinement, or more image requests."
    },
    {
      title: "Learning and ideation",
      description: "Photo in, prompt out. Use it in Gemini to explore styles, get descriptions, or brainstorm from visuals."
    }
  ],
  benefitsKicker: "Benefits",
  benefitsH2: "Why use a tool for Gemini photo prompts",
  benefits: [
    {
      title: "Less typing",
      description: "The tool writes the description. You paste into Gemini and tweak if needed."
    },
    {
      title: "No prompt experience needed",
      description: "Upload a photo and get a usable Gemini prompt. Edit the text if you want more control."
    },
    {
      title: "Works in the browser",
      description: "No install. Upload, generate, copy. Chrome extension available for capturing from tabs."
    },
    {
      title: "Free to try",
      description: "No signup required on the free tier. Upgrade when you need more generations or saved prompts."
    }
  ],
  faqs: [
    {
      question: "Is the Gemini AI photo prompt tool free?",
      answer: "Yes. You can generate Gemini photo prompts without signing up. Paid plans give you more generations and saved prompts."
    },
    {
      question: "How do I use the prompt in Google Gemini?",
      answer:
        "Copy the generated text and paste it into Gemini (gemini.google.com). You can use it for image prompts, chat, or as a description. Edit the text before pasting if you want to add style or context."
    },
    {
      question: "What's the difference between this and the main image-to-prompt tool?",
      answer: "Same tool, same flow. This page is for people searching for a Gemini AI photo prompt specifically. You get a text prompt from your image; you choose where to paste it—Gemini, ChatGPT, or anywhere else."
    },
    {
      question: "Are my images stored?",
      answer: "We use your image only to generate the prompt. We don't keep the image. Saved prompts are in your account; you can delete them anytime."
    },
    {
      question: "What image formats work?",
      answer: "JPG, PNG, WebP. Clear, well-lit photos give better prompts."
    },
    {
      question: "Do I need a Gemini account?",
      answer: "You don't need a Gemini account to use our tool. You'll need one when you paste the prompt into Gemini. Our tool just turns your photo into text."
    },
    {
      question: "Can I use this on mobile?",
      answer: "Yes. Use the site in your mobile browser. Chrome extension is for desktop."
    },
    {
      question: "What's the difference between monthly and annual pricing?",
      answer: "Annual is cheaper (e.g. save 20%). Same features. Change or cancel from your profile."
    }
  ],
  seoGuideKicker: "Guide",
  seoGuideTitle: "Gemini AI photo prompt: a short guide",
  seoGuideIntro: "What a Gemini photo prompt is, why it's useful, and how to get one from any image. Plain language.",
  seoCopy: [
    {
      heading: "What is a Gemini AI photo prompt?",
      paragraphs: [
        "A Gemini AI photo prompt is a text description of an image that you can paste into Google Gemini. Instead of typing from scratch, you upload the photo here and get a ready-made prompt. Use it in Gemini for image generation, chat, or as a brief.",
        "Our tool turns any image into that text. Same idea as the main image-to-prompt converter; this page is for people who specifically want a Gemini photo prompt."
      ]
    },
    {
      heading: "Why get a photo prompt for Gemini?",
      paragraphs: [
        "Gemini can work with images and text. Sometimes you have a reference photo but need the words—for a prompt, a brief, or a follow-up question. Turning the photo into text first keeps things clear and reusable.",
        "Teams can use one image, one generated prompt, and everyone pastes the same description into Gemini. Fewer misunderstandings, faster iteration."
      ]
    },
    {
      heading: "How to get a Gemini AI photo prompt",
      paragraphs: [
        "Upload your image on this page, click generate, then copy the text. Paste it into Gemini. You can edit the prompt before pasting—add style, mood, or context. Save prompts you like in your account for next time."
      ]
    },
    {
      heading: "Using the prompt in Google Gemini",
      paragraphs: [
        "Open Gemini (gemini.google.com), paste the prompt in the input, and send. Use it for image requests, chat about the scene, or as a starting point for more prompts. The prompt is plain text so you can tweak it in Gemini too."
      ]
    },
    {
      heading: "Who it's for",
      paragraphs: [
        "Anyone who uses Gemini and has a reference image: content creators, marketers, designers, or people who just want to try photo-to-prompt. If you search for 'gemini ai photo prompt' or 'google gemini photo prompt', this is the same tool—upload, get text, paste in Gemini."
      ]
    }
  ],
  trustKicker: "Trust",
  trustH2: "Privacy, security, and speed for your Gemini photo prompts",
  trustCards: [
    { title: "Your images aren't stored", description: "We use them only to generate the prompt. Delete saved prompts anytime." },
    { title: "Secure connection", description: "HTTPS and normal login. Your data stays protected." },
    { title: "Fast generation", description: "Most prompts ready in seconds." }
  ],
  pricingSubtitlePrefix: "Same pricing as the main image-to-prompt tool. Save when you pay yearly; switch plans from your profile. ",
  schemaPageName: "Gemini AI Photo Prompt",
  schemaPagePath: "gemini-ai-photo-prompt",
  schemaAppName: "Gemini AI Photo Prompt",
  schemaAppDescription:
    "Turn any photo into a Gemini-ready prompt. Upload an image, get a text prompt, paste it into Google Gemini. Free to try."
};

/** AI Gemini photo prompt – same tool, keyword angle for "ai gemini photo prompt", unique copy */
const AI_GEMINI_PHOTO_PROMPT: LandingContent = {
  ...GEMINI_AI_PHOTO_PROMPT,
  examples: EXAMPLES_SET_4,
  heroImageUrl: "/Assets/enthusiastic-long-hairs-woman-looking-up-making-picture-enjoying-amazing-architecture-old-european-city-spring-fall-season-cozy-knitted-red-sweater-sunny-weather-warm-colors_273443-1589-removebg-previ.png",
  heroImageAlt: "AI turns your photo into a Gemini prompt",
  heroLeftLine1: "AI Gemini Photo Prompt",
  heroLeftLine2: "From Any Photo",
  heroMini:
    "Use AI to turn any photo into a Gemini-ready prompt. Upload an image, get a text prompt, paste it into Gemini. No account needed to try.",
  heroRightLine1: "AI Gemini Photo Prompt",
  heroRightLine2: "in Seconds",
  uploadSupportText:
    "Drop a photo and get an AI-written prompt for Gemini. Same tool as the main converter—we describe the image so you can paste the text into Google Gemini or any AI.",
  howToUseH2: "How to get an AI Gemini photo prompt",
  steps: [
    {
      title: "1. Add your photo",
      description: "Pick a JPG, PNG, or WebP. The AI reads what’s in the image so it can write a Gemini-friendly description."
    },
    {
      title: "2. Hit generate",
      description: "You get a short block of text describing the scene. That’s your AI Gemini photo prompt. Change a few words if you like."
    },
    {
      title: "3. Use it in Gemini",
      description: "Paste the text into Gemini. Good for image prompts, follow-up questions, or as a brief. Save any prompt you’ll reuse."
    }
  ],
  features: [
    { title: "AI writes the description", description: "Your photo becomes a text prompt. No need to type it yourself before pasting into Gemini." },
    { title: "Works with normal photos", description: "JPG, PNG, WebP. No special prep—just a clear image." },
    { title: "Quick", description: "Most photos get a prompt in a few seconds." },
    { title: "Copy or save", description: "One click to copy. Signed-in users can save prompts for later." },
    { title: "We don’t keep your photo", description: "Used only to create the prompt. You control your saved prompts." },
    { title: "Site and extension", description: "Same account on the website and the Chrome extension." }
  ],
  useCases: [
    { title: "Gemini image ideas", description: "Reference photo → AI Gemini photo prompt → paste in Gemini to get new images or chat about the scene." },
    { title: "Social and content", description: "Screenshot or product shot → prompt in seconds. Reuse in Gemini for captions or concepts." },
    { title: "Design", description: "Moodboard or UI screenshot → text brief → paste into Gemini for quick ideas or variations." },
    { title: "Campaigns", description: "One product photo, one prompt. Whole team uses the same description in Gemini." },
    { title: "Chat and refine", description: "Start a Gemini chat with the generated prompt, then ask for tweaks or more images." },
    { title: "Learning", description: "Photo in, prompt out. See how the AI describes it, then use that in Gemini." }
  ],
  benefits: [
    { title: "No typing from scratch", description: "The AI writes the prompt. You paste into Gemini and adjust if needed." },
    { title: "Beginner-friendly", description: "Upload a photo and get a usable AI Gemini photo prompt. Edit the text when you want more control." },
    { title: "Browser-only", description: "Nothing to install. Upload, generate, copy. Optional Chrome extension for grabbing images from tabs." },
    { title: "Free tier", description: "Try it without signing up. Upgrade for more runs or saved prompts." }
  ],
  faqs: [
    { question: "Is the AI Gemini photo prompt tool free?", answer: "Yes. You can create AI Gemini photo prompts without an account. Paid plans add more generations and saved prompts." },
    { question: "Where do I paste the prompt?", answer: "In Google Gemini (gemini.google.com). Paste into the chat or prompt box. Use it for images, questions, or as a brief." },
    { question: "How is this different from the main tool?", answer: "Same tool and steps. This page is for people looking for an AI Gemini photo prompt. You still get text from your image; you choose where to paste it." },
    { question: "Do you store my images?", answer: "No. We use the image only to generate the prompt. Saved prompts live in your account; you can remove them anytime." },
    { question: "What file types work?", answer: "JPG, PNG, WebP. Clear, well-lit photos give better prompts." },
    { question: "Do I need a Gemini account?", answer: "Not for our tool. You’ll need one when you paste the prompt into Gemini." },
    { question: "Mobile?", answer: "Yes. Use the site in your phone’s browser. The Chrome extension is for desktop." },
    { question: "Monthly vs annual?", answer: "Annual costs less (e.g. 20% off). Same features. Change or cancel in your profile." }
  ],
  seoCopy: [
    {
      heading: "What is an AI Gemini photo prompt?",
      paragraphs: [
        "An AI Gemini photo prompt is a text description of a photo that you can paste into Google Gemini. You upload the image here; our AI writes the description. Then you use that text in Gemini for image requests, chat, or briefs.",
        "Lots of people search for 'AI Gemini photo prompt' when they have a reference image but don’t want to type the description. This tool does that step."
      ]
    },
    {
      heading: "Why use AI to get a Gemini photo prompt?",
      paragraphs: [
        "Typing a full description of a photo is slow. The AI reads the image and writes the words so you can paste them into Gemini quickly. Same idea for teams: one photo, one shared prompt, everyone on the same page.",
        "You can still edit the text before pasting. The AI gives you a starting point; you keep control."
      ]
    },
    {
      heading: "How to create an AI Gemini photo prompt",
      paragraphs: [
        "Upload your image on this page, click generate, then copy the text. Paste it into Gemini. You can change a few words first—add style, mood, or context. Save prompts you like so you don’t have to regenerate."
      ]
    },
    {
      heading: "Using the prompt in Gemini",
      paragraphs: [
        "Open Gemini, paste the prompt, and send. Use it to request images, chat about the scene, or start a longer conversation. The prompt is plain text so you can edit it in Gemini too."
      ]
    },
    {
      heading: "Who it’s for",
      paragraphs: [
        "Anyone who uses Gemini and has a reference image: creators, marketers, designers, or people trying photo-to-prompt. If you search 'AI Gemini photo prompt,' this is the tool—upload, get text, paste in Gemini."
      ]
    }
  ],
  seoGuideTitle: "AI Gemini photo prompt: what it is and how to get one",
  seoGuideIntro: "How to turn a photo into an AI Gemini photo prompt. Same tool, same flow—upload, generate, paste in Gemini.",
  schemaPageName: "AI Gemini Photo Prompt",
  schemaPagePath: "ai-gemini-photo-prompt",
  schemaAppName: "AI Gemini Photo Prompt",
  schemaAppDescription:
    "Use AI to turn any photo into a Gemini-ready prompt. Upload an image, get a text prompt, paste it into Google Gemini. No account needed to try."
};

/** Google Gemini AI photo prompt – emphasis on Google Gemini, unique copy */
const GOOGLE_GEMINI_AI_PHOTO_PROMPT: LandingContent = {
  ...GEMINI_AI_PHOTO_PROMPT,
  examples: EXAMPLES_SET_5,
  heroImageUrl: "/Assets/young-girl-capturing-nature39s-beauty-world-photography-day-with-her-camera_978425-32919-removebg-preview.png",
  heroImageAlt: "Photo to Google Gemini prompt in one click",
  heroLeftLine1: "Google Gemini AI Photo Prompt",
  heroLeftLine2: "From Any Image",
  heroMini:
    "Turn any image into a prompt for Google Gemini. Upload a photo, get a clean text prompt, then paste it into Gemini for images, chat, or ideas. Free to try.",
  heroRightLine1: "Google Gemini AI Photo Prompt",
  heroRightLine2: "Ready to Paste",
  uploadSupportText:
    "Drop a photo and we turn it into a text prompt you can use in Google Gemini. One click to generate; copy and paste where you need it.",
  howToUseH2: "How to get a Google Gemini AI photo prompt",
  steps: [
    {
      title: "Step 1: Upload",
      description: "Select the image you want to turn into a Google Gemini AI photo prompt. JPG, PNG, or WebP."
    },
    {
      title: "Step 2: Generate",
      description: "Click generate. You’ll see a text description of the image—that’s your Google Gemini prompt. Edit it if you want."
    },
    {
      title: "Step 3: Paste in Gemini",
      description: "Copy the text and paste it into Google Gemini. Use it for image generation, chat, or as a reference. Save prompts you reuse."
    }
  ],
  features: [
    { title: "Photo → text for Google Gemini", description: "We turn your image into a text prompt. Paste it straight into Gemini or edit first." },
    { title: "Common formats", description: "JPG, PNG, WebP. No conversion hassle." },
    { title: "Fast", description: "Prompt usually ready in seconds." },
    { title: "Copy and save", description: "Copy with one click. Sign in to save prompts for Google Gemini and other tools." },
    { title: "Photos not stored", description: "We use the image only to create the prompt. Your prompts are in your account." },
    { title: "Web + extension", description: "One account for the site and the Chrome extension." }
  ],
  useCases: [
    { title: "Gemini images", description: "Reference photo → Google Gemini AI photo prompt → paste in Gemini to create or discuss images." },
    { title: "Content and posts", description: "Product or thumbnail → prompt in seconds. Drop the same prompt into Gemini for captions or ideas." },
    { title: "Design", description: "UI or moodboard screenshot → text brief → paste in Gemini for concepts." },
    { title: "Marketing", description: "Product shots → one prompt per image. Team uses the same Google Gemini prompt." },
    { title: "Chat", description: "Use the prompt in Gemini as the first message, then refine or ask for more." },
    { title: "Ideation", description: "Photo in, prompt out. Use it in Gemini to explore or describe the scene." }
  ],
  benefits: [
    { title: "Less typing", description: "We write the description. You paste into Google Gemini and tweak." },
    { title: "No prompt skills required", description: "Upload a photo and get a Google Gemini AI photo prompt. Edit when you want more say." },
    { title: "Runs in the browser", description: "No install. Upload, generate, copy. Chrome extension for capturing from tabs." },
    { title: "Free to start", description: "No signup on the free tier. Upgrade for more generations or saved prompts." }
  ],
  faqs: [
    { question: "Is the Google Gemini AI photo prompt tool free?", answer: "Yes. You can generate Google Gemini AI photo prompts without signing up. Paid plans give more generations and saved prompts." },
    { question: "How do I use it in Google Gemini?", answer: "Copy the text from our tool and paste it into Gemini at gemini.google.com. Use it for image prompts, chat, or as a description." },
    { question: "Same as the main image-to-prompt tool?", answer: "Yes. This page is for people searching for a Google Gemini AI photo prompt. Same flow—you get text from your image and paste it where you like." },
    { question: "Are my photos saved?", answer: "No. We use them only to generate the prompt. Saved prompts are in your account; delete anytime." },
    { question: "Which image formats?", answer: "JPG, PNG, WebP. Clear photos work best." },
    { question: "Need a Gemini account?", answer: "Not for our tool. You need one when you paste the prompt into Google Gemini." },
    { question: "Works on mobile?", answer: "Yes. Use the site in your mobile browser. Extension is desktop only." },
    { question: "Monthly or annual?", answer: "Annual is cheaper. Same features. Change or cancel in your profile." }
  ],
  seoCopy: [
    {
      heading: "What is a Google Gemini AI photo prompt?",
      paragraphs: [
        "A Google Gemini AI photo prompt is text that describes an image so you can paste it into Google Gemini. You upload the photo here; we produce the text. Then you use that prompt in Gemini for images, chat, or briefs.",
        "People search 'Google Gemini AI photo prompt' when they have a picture and want ready-made text for Gemini. This tool does that."
      ]
    },
    {
      heading: "Why get a photo prompt for Google Gemini?",
      paragraphs: [
        "Describing a photo in words takes time. We read the image and write the prompt so you can paste it into Google Gemini quickly. Teams can share one photo and one prompt so everyone’s aligned.",
        "You can edit the prompt before pasting. We give you the draft; you decide the final wording."
      ]
    },
    {
      heading: "How to get a Google Gemini AI photo prompt",
      paragraphs: [
        "Upload your image here, click generate, then copy the text. Paste it into Google Gemini. Optionally edit first—add style or context. Save prompts you use often."
      ]
    },
    {
      heading: "Pasting into Google Gemini",
      paragraphs: [
        "Go to gemini.google.com, paste the prompt in the input, and send. Use it to request images, chat about the scene, or build on it with more prompts."
      ]
    },
    {
      heading: "Who it’s for",
      paragraphs: [
        "Anyone using Google Gemini with a reference image: creators, marketers, designers. If you search 'Google Gemini AI photo prompt,' this tool gives you text from your photo to paste in Gemini."
      ]
    }
  ],
  seoGuideTitle: "Google Gemini AI photo prompt: a short guide",
  seoGuideIntro: "What a Google Gemini AI photo prompt is and how to get one from any image. Plain language.",
  schemaPageName: "Google Gemini AI Photo Prompt",
  schemaPagePath: "google-gemini-ai-photo-prompt",
  schemaAppName: "Google Gemini AI Photo Prompt",
  schemaAppDescription:
    "Turn any image into a prompt for Google Gemini. Upload a photo, get a clean text prompt, paste it into Gemini. Free to try."
};

/** Gemini prompt – broader "gemini prompt" from image, unique copy */
const GEMINI_PROMPT: LandingContent = {
  ...GEMINI_AI_PHOTO_PROMPT,
  examples: EXAMPLES_SET_6,
  heroImageUrl: "/Assets/dmxffni837f1xrj8pki9xgrl-removebg-preview.png",
  heroImageAlt: "Get a Gemini prompt from your image",
  heroLeftLine1: "Gemini Prompt",
  heroLeftLine2: "From Your Image",
  heroMini:
    "Need a Gemini prompt but have an image? Upload the image, get a text prompt, paste it into Google Gemini. Same tool—free to try.",
  heroRightLine1: "Get a Gemini Prompt",
  heroRightLine2: "From Any Photo",
  uploadSupportText:
    "Upload any image and get a Gemini prompt—a text description you can paste into Gemini for image generation, chat, or follow-up.",
  howToUseH2: "How to get a Gemini prompt from an image",
  toolInterfaceH2: "Gemini prompt in three steps",
  steps: [
    {
      title: "Upload your image",
      description: "Add the picture you want to turn into a Gemini prompt. We support JPG, PNG, and WebP."
    },
    {
      title: "Generate the prompt",
      description: "Click generate. You get a Gemini prompt—a text description of the image. Change wording if you like."
    },
    {
      title: "Paste in Gemini",
      description: "Copy the Gemini prompt and paste it into Google Gemini. Use it for images, chat, or as a starting point. Save ones you reuse."
    }
  ],
  features: [
    { title: "Image to Gemini prompt", description: "We describe your image in text. That text is your Gemini prompt. Paste it in and go." },
    { title: "JPG, PNG, WebP", description: "Standard formats. No extra steps." },
    { title: "Quick turnaround", description: "Most images get a Gemini prompt in a few seconds." },
    { title: "Copy or save", description: "Copy with one click. Log in to save Gemini prompts for later." },
    { title: "Images not kept", description: "We use the image only to build the Gemini prompt. You own your saved prompts." },
    { title: "Website and extension", description: "Same account on both. Saved prompts sync." }
  ],
  useCases: [
    { title: "Gemini image requests", description: "Have a reference? Get a Gemini prompt from it, paste in Gemini, get new images or chat." },
    { title: "Content", description: "Product or thumbnail → Gemini prompt fast. Reuse in Gemini for captions or concepts." },
    { title: "Design", description: "Screenshot or moodboard → text brief → paste as a Gemini prompt for ideas." },
    { title: "Marketing", description: "One image, one Gemini prompt. Team shares the same prompt in Gemini." },
    { title: "Chat", description: "Start a Gemini conversation with the generated prompt, then refine or extend." },
    { title: "Learning", description: "See how we describe your image, then use that Gemini prompt in Gemini." }
  ],
  benefits: [
    { title: "Skip the typing", description: "We write the Gemini prompt. You paste it in and adjust if needed." },
    { title: "Easy to use", description: "Upload a photo and get a Gemini prompt. No prompt-writing experience required." },
    { title: "No install", description: "Works in the browser. Upload, generate, copy. Chrome extension for tab capture." },
    { title: "Free option", description: "No signup to try. Upgrade for more generations or saved Gemini prompts." }
  ],
  faqs: [
    { question: "Is the Gemini prompt tool free?", answer: "Yes. You can get a Gemini prompt from your image without an account. Paid plans add more generations and saved prompts." },
    { question: "How do I use the Gemini prompt?", answer: "Copy the text we generate and paste it into Google Gemini. Use it for image prompts, chat, or as a description." },
    { question: "What’s the difference from the main tool?", answer: "Same tool. This page is for people searching for a Gemini prompt from an image. You still get text from your photo; you choose where to paste it." },
    { question: "Do you store my image?", answer: "No. We use it only to create the Gemini prompt. Saved prompts are in your account; you can delete them." },
    { question: "What image types?", answer: "JPG, PNG, WebP. Clear images give better Gemini prompts." },
    { question: "Need a Gemini account?", answer: "Not for our tool. You need one when you paste the Gemini prompt into Gemini." },
    { question: "On mobile?", answer: "Yes. Use the site in your mobile browser. Extension is for desktop." },
    { question: "Annual vs monthly?", answer: "Annual is less expensive. Same features. Update or cancel in your profile." }
  ],
  seoCopy: [
    {
      heading: "What is a Gemini prompt from an image?",
      paragraphs: [
        "A Gemini prompt from an image is text that describes your picture so you can paste it into Google Gemini. You upload the image here; we write the description. Then you use that as your Gemini prompt for images, chat, or briefs.",
        "If you have a photo but need words for Gemini, this tool turns the image into a Gemini prompt."
      ]
    },
    {
      heading: "Why get a Gemini prompt from a photo?",
      paragraphs: [
        "Writing a full description by hand takes time. We read the image and output a Gemini prompt so you can paste it into Gemini. Teams can use one image and one Gemini prompt so everyone’s consistent.",
        "You can edit the Gemini prompt before pasting. We provide the draft; you own the final version."
      ]
    },
    {
      heading: "How to get a Gemini prompt from an image",
      paragraphs: [
        "Upload your image on this page, click generate, then copy the text. That’s your Gemini prompt. Paste it into Gemini. Edit first if you want—add style or context. Save prompts you’ll use again."
      ]
    },
    {
      heading: "Using your Gemini prompt in Google Gemini",
      paragraphs: [
        "Open Gemini, paste the Gemini prompt, and send. Use it to request images, discuss the scene, or continue the conversation. You can change the text in Gemini too."
      ]
    },
    {
      heading: "Who needs a Gemini prompt from an image?",
      paragraphs: [
        "Anyone using Google Gemini who has a reference image: creators, marketers, designers. If you search 'Gemini prompt' and you have a photo, this tool gives you the text to paste in Gemini."
      ]
    }
  ],
  seoGuideTitle: "Gemini prompt from image: a short guide",
  seoGuideIntro: "How to get a Gemini prompt when you have an image. Upload, generate, paste into Gemini.",
  schemaPageName: "Gemini Prompt",
  schemaPagePath: "gemini-prompt",
  schemaAppName: "Gemini Prompt From Image",
  schemaAppDescription:
    "Get a Gemini prompt from any image. Upload the photo, get a text prompt, paste it into Google Gemini. Free to try."
};

/** Image prompt generator – keyword "image prompt generator", unique copy vs default */
const IMAGE_PROMPT_GENERATOR: LandingContent = {
  ...IMAGE_TO_PROMPT_DEFAULT,
  examples: EXAMPLES_SET_2,
  heroImageUrl: "/Assets/3-2-cat-png-14.png",
  heroImageAlt: "Free image prompt generator – photo in, text prompt out for ChatGPT, Midjourney, Gemini",
  heroLeftLine1: "Image Prompt Generator",
  heroLeftLine2: "Free and Simple",
  heroMini:
    "Free image prompt generator: upload a photo, get a text prompt. Paste it into ChatGPT, Midjourney, Gemini, or any AI. No signup to try.",
  heroRightLine1: "Generate a Prompt",
  heroRightLine2: "From Any Image",
  uploadSupportText:
    "Drop an image and the image prompt generator turns it into text. Use the prompt in any AI—ChatGPT, Gemini, Midjourney, DALL·E, and more.",
  toolInterfaceH2: "How the image prompt generator works",
  toolInterfaceIntro:
    "Add an image, press generate, then copy or save the prompt. Your plan and credits appear above. Saved prompts stay in your account.",
  howToUseH2: "How to use the image prompt generator",
  howToUseIntro: "Three steps. Try it without signing up. Under a minute.",
  steps: [
    {
      title: "Add your image",
      description: "Drag and drop or choose a file. JPG, PNG, or WebP. The image prompt generator works best with clear, well-lit photos."
    },
    {
      title: "Generate",
      description: "Click generate. The image prompt generator writes a text description—subject, lighting, style. Takes a few seconds. Edit the text if you want before copying."
    },
    {
      title: "Copy and use",
      description: "Copy the prompt and paste it into ChatGPT, Midjourney, DALL·E, Gemini, or any tool. Save prompts you like for next time."
    }
  ],
  features: [
    { title: "Generates prompts from images", description: "Describes what’s in the photo—subject, light, style. You can edit the text before copying." },
    { title: "JPG, PNG, WebP", description: "Standard formats. No special setup." },
    { title: "Fast", description: "Most images get a prompt in seconds." },
    { title: "Copy or save", description: "One-click copy. Sign in to save prompts from the image prompt generator." },
    { title: "We don’t store your image", description: "Used only to generate the prompt. You can delete saved prompts anytime." },
    { title: "Web and Chrome extension", description: "One login. Same saved prompts on the site and the extension." }
  ],
  useCases: [
    { title: "AI art and Midjourney", description: "Reference image → image prompt generator → text prompt → paste in Midjourney or DALL·E for variations." },
    { title: "Design", description: "UI or moodboard screenshot → generate prompt → use the text in ChatGPT or another AI for concepts." },
    { title: "Content and social", description: "Product shot or thumbnail → prompt in seconds. Reuse for captions, briefs, or more AI images." },
    { title: "Game and concept art", description: "Environment or character art in → prompt out. Tweak for Stable Diffusion, Leonardo, or similar." },
    { title: "ChatGPT and multimodal", description: "Have an image, need words? Use the image prompt generator, then paste the prompt into ChatGPT or Gemini." },
    { title: "Marketing", description: "Product and brand images → consistent prompts. Same wording across campaigns." }
  ],
  benefits: [
    { title: "Less manual writing", description: "The image prompt generator does the describing. You edit and paste where you need it." },
    { title: "No expertise needed", description: "Upload a photo and get a usable prompt. Tweak the text when you want more control." },
    { title: "No install", description: "Use the image prompt generator in the browser. Upload, generate, copy. Optional extension for tab capture." },
    { title: "Free tier", description: "Try the image prompt generator without signup. Upgrade for more generations or saved prompts." }
  ],
  faqs: [
    { question: "Is the image prompt generator free?", answer: "Yes. You can use the free image prompt generator without signing up. Paid plans give more generations and saved prompts." },
    { question: "How do I use the prompt in Midjourney or DALL·E?", answer: "Copy the prompt from the image prompt generator and paste it into Midjourney’s /imagine or DALL·E’s prompt field. Add style words if you want. You can edit before pasting." },
    { question: "Which AI tools work with the prompts?", answer: "Any tool that takes text: ChatGPT, Midjourney, DALL·E, Gemini, Stable Diffusion, Leonardo, Runway. Plain language." },
    { question: "Are my images stored?", answer: "No. We use them only to generate the prompt. Saved prompts are in your account; you can delete them." },
    { question: "What formats does the image prompt generator accept?", answer: "JPG, PNG, WebP. Large files may be resized. Clear images give better prompts." },
    { question: "How good is the prompt?", answer: "Depends on the image. Clear subject and good light usually help. You can edit the text before copying." },
    { question: "Do I need an account?", answer: "No for the free tier. Sign in to save prompts, get higher limits, and use the Chrome extension." },
    { question: "On mobile?", answer: "Yes. Use the image prompt generator in your mobile browser. Extension is for desktop." },
    { question: "Monthly vs annual?", answer: "Annual is cheaper. Same features. Change or cancel in your profile." }
  ],
  seoCopy: [
    {
      heading: "What is an image prompt generator?",
      paragraphs: [
        "An image prompt generator turns a picture into a text prompt. You upload an image; it gives you a description you can paste into ChatGPT, Midjourney, DALL·E, Gemini, or any AI. No need to write the description yourself.",
        "A good image prompt generator turns what you see—subject, lighting, style—into clear text so your first try is usable."
      ]
    },
    {
      heading: "Why use an image prompt generator?",
      paragraphs: [
        "Lots of people have a reference image but find it hard to put it into words. An image prompt generator reads the image and writes the prompt. Teams can use one image and one generated prompt so everyone’s on the same page.",
        "You still edit the prompt if you want. The image prompt generator gives you a draft; you keep control."
      ]
    },
    {
      heading: "How to use the image prompt generator",
      paragraphs: [
        "Pick a clear image—product shot, screenshot, or reference. Upload it here, click generate, then copy the text. Edit the prompt if you like before pasting into Midjourney, ChatGPT, or elsewhere. Save prompts you reuse."
      ]
    },
    {
      heading: "What makes a good prompt?",
      paragraphs: [
        "Strong prompts usually include: what’s in the scene, style (e.g. cinematic, flat lay), lighting, and mood. An image prompt generator drafts that from your image. You can add or remove detail (e.g. 'oil painting,' 'wide angle') after.",
        "If the result feels generic, try a clearer source image or add a line of your own. The image prompt generator gives a solid start; you choose the final wording."
      ]
    },
    {
      heading: "Image prompt generator vs writing yourself",
      paragraphs: [
        "Writing prompts from scratch is flexible but slow. An image prompt generator gives you a starting prompt in seconds so you spend time editing, not typing from zero.",
        "Common pattern: use the image prompt generator for the first draft, then adjust for brand, campaign, or audience."
      ]
    },
    {
      heading: "Privacy and speed",
      paragraphs: [
        "We use your image only to generate the prompt. We don’t keep the image. Saved prompts live in your account; you can delete them. We use HTTPS and aim for fast loading and generation.",
        "For details, see our privacy policy. Short version: images aren’t stored long-term; you own your prompts."
      ]
    },
    {
      heading: "Who uses an image prompt generator?",
      paragraphs: [
        "Anyone who needs a text prompt from an image: AI artists, designers, content creators, marketers, concept artists. If you often have a reference and need a prompt for Midjourney, ChatGPT, or another tool, an image prompt generator does that step.",
        "Also useful when several people need the same visual brief. One image, one generated prompt, same language."
      ]
    }
  ],
  seoGuideTitle: "Image prompt generator: a short guide",
  seoGuideIntro: "What an image prompt generator does and how to use it. Upload a photo, get a prompt, paste it anywhere.",
  reviewsKicker: "Reviews",
  reviewsH2: "What people say about the image prompt generator",
  reviews: DEFAULT_REVIEWS,
  pricingSubtitlePrefix: "Simple pricing for the image prompt generator. Save when you pay yearly; switch plans from your profile. ",
  schemaPageName: "Image Prompt Generator",
  schemaPagePath: "image-prompt-generator",
  schemaAppName: "Image Prompt Generator",
  schemaAppDescription:
    "Free image prompt generator: upload a photo, get a text prompt. Paste it into ChatGPT, Midjourney, Gemini, or any AI. No signup to try."
};

/** Image to Prompt Converter page – same as default but with its own hero image and schema. */
const IMAGE_TO_PROMPT_CONVERTER: LandingContent = {
  ...IMAGE_TO_PROMPT_DEFAULT,
  examples: EXAMPLES_SET_1,
  heroImageUrl: "/Assets/A-clear-close-up-photo-of-a-woman-removebg-preview.png",
  heroImageAlt: "Image to Prompt Converter – turn any image into an AI-ready prompt",
  schemaPageName: "Image to Prompt Converter",
  schemaPagePath: "image-to-prompt-converter",
  schemaAppName: "Image to Prompt Converter",
  schemaAppDescription:
    "Use our free image to prompt converter online. Upload an image, generate AI-ready prompts, and use them for ChatGPT, Midjourney, Gemini, and more."
};

const CONTENT_MAP: Record<string, LandingContent> = {
  "image-to-prompt": IMAGE_TO_PROMPT_DEFAULT,
  "image-to-prompt-converter": IMAGE_TO_PROMPT_CONVERTER,
  "gemini-ai-photo-prompt": GEMINI_AI_PHOTO_PROMPT,
  "ai-gemini-photo-prompt": AI_GEMINI_PHOTO_PROMPT,
  "google-gemini-ai-photo-prompt": GOOGLE_GEMINI_AI_PHOTO_PROMPT,
  "gemini-prompt": GEMINI_PROMPT,
  "image-prompt-generator": IMAGE_PROMPT_GENERATOR
};

export function getLandingContent(variant: string): LandingContent {
  return CONTENT_MAP[variant] ?? IMAGE_TO_PROMPT_DEFAULT;
}

export const LANDING_VARIANTS = [
  "image-to-prompt",
  "image-to-prompt-converter",
  "gemini-ai-photo-prompt",
  "ai-gemini-photo-prompt",
  "google-gemini-ai-photo-prompt",
  "gemini-prompt",
  "image-prompt-generator"
] as const;
