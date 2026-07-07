import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "meme-generator",
  intro:
    "To make a meme for free without uploading anything, open Klipzo, drop in your image, and it drops in the classic top and bottom Impact caption boxes for you. Double-click a caption to type your text, drag it into place, and tweak the size or color if you want. Everything runs in your browser, so your image stays on your device with no account, no watermark, and nothing uploaded.",
  body:
    "A meme is just an image with bold, high-contrast caption text, and that is exactly what this tool sets up in one step. When you open it, Klipzo adds two ready-made text layers in the meme-standard Impact font, white with a thick black outline so the words stay readable over any background. Type your top and bottom lines, drag them where you want, and resize them to taste. Because it is the full photo editor underneath, you are not limited to two lines: add more text, change the font or color, crop the image, or draw on it. Rendering happens on Canvas at the image's real resolution, so the meme stays crisp, nothing is uploaded, and the exported PNG or JPG carries no branding of ours.",
  howTo: {
    title: "How to make a meme online",
    description:
      "Add classic top and bottom Impact captions to any image in your browser, then export a clean meme.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the meme generator",
        text: "Go to Klipzo and drag your image in, or click to browse. It loads instantly and never leaves your device.",
      },
      {
        name: "Type the captions",
        text: "Two Impact caption boxes appear at the top and bottom. Double-click each one and type your lines.",
      },
      {
        name: "Position and size them",
        text: "Drag each caption where you want it and adjust the size. Add more text layers if you need extra lines.",
      },
      {
        name: "Style it (optional)",
        text: "Change the color, outline width, or font, or crop and draw on the image using the other tools.",
      },
      {
        name: "Export and download",
        text: "Click Export to save a PNG or JPG with the captions flattened in. No sign-up, no watermark.",
      },
    ],
  },
  faqs: [
    {
      question: "Is the meme generator free?",
      answer:
        "Yes. It costs nothing, needs no account, and never stamps a watermark on your meme. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my image get uploaded to make a meme?",
      answer:
        "No. The captions are drawn onto your image in the browser with the Canvas API, so the image and your text stay entirely on your device.",
    },
    {
      question: "Which font does it use?",
      answer:
        "It uses Impact, the classic meme font, in white with a black outline so the text stays readable over any background. You can switch to any of the built-in or 100+ Google Fonts if you prefer a different look.",
    },
    {
      question: "Can I add more than two lines of text?",
      answer:
        "Yes. The meme generator is the full photo editor, so you can add as many text layers as you like, plus crop, draw, and adjust the image.",
    },
  ],
  tips: [
    "Keep captions short and punchy; a few big words read better than a full sentence squeezed small.",
    "The white fill with a thick black outline is the classic look because it stays legible on any background. Bump the outline width if the image is busy.",
    "Type in ALL CAPS for the traditional meme feel, or switch the case if you want something softer.",
    "Drag a caption anywhere; the top and bottom are just defaults. Center a single caption for a modern look.",
    "Crop the image to a square or 4:5 first if you are posting to social, so nothing important gets cut off.",
  ],
  related: ["add-text-to-photo", "crop-image", "resize-image", "add-text-to-video"],
};

export default content;
