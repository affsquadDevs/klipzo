import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "circle-crop",
  intro:
    "To crop a photo into a circle for free, open Klipzo's circle crop tool, position the square selection over the part you want, and click Crop to circle. It keeps the round area and makes the corners transparent, so you can export a PNG that drops cleanly into a profile picture or avatar. It all runs in your browser, so your photo never leaves your device.",
  body:
    "A circle crop is what you need whenever an avatar or badge is displayed as a round frame: profile pictures, team headshots, community icons, and stickers. Klipzo crops to your selection and masks everything outside the inscribed circle to transparency, then lets you export a PNG (or WebP) that preserves those transparent corners so the image sits perfectly on any background. Choose the 1:1 ratio first for a perfect circle, or use any rectangle for an oval. Because it renders on Canvas at the image's real resolution and nothing is uploaded, the cutout stays crisp and completely private.",
  howTo: {
    title: "How to crop a photo into a circle",
    description:
      "Crop an image to a circle in your browser and export a transparent PNG, with no upload.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the circle crop tool",
        text: "Go to Klipzo and drag your image in, or click to browse. It loads on your device and is never uploaded.",
      },
      {
        name: "Pick the 1:1 ratio",
        text: "Choose the 1:1 (square) ratio so the circle comes out perfectly round, then position the selection over the part you want.",
      },
      {
        name: "Crop to circle",
        text: "Click Crop to circle. The area inside the circle is kept and the corners become transparent.",
      },
      {
        name: "Export as PNG",
        text: "Click Export and choose PNG or WebP to keep the transparent corners. No sign-up, no watermark.",
      },
    ],
  },
  faqs: [
    {
      question: "Is circle crop free?",
      answer:
        "Yes. It costs nothing, needs no account, and never stamps a watermark on your image. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my photo get uploaded to crop it?",
      answer:
        "No. The crop and the circular mask are applied in your browser with the Canvas API, so your image stays entirely on your device.",
    },
    {
      question: "Why should I export as PNG?",
      answer:
        "PNG (and WebP) support transparency, so the corners outside the circle stay see-through. JPG has no transparency, so it would fill the corners with a solid color instead.",
    },
    {
      question: "How do I get a perfect circle instead of an oval?",
      answer:
        "Select the 1:1 (square) ratio before cropping. A square selection produces a round circle; a non-square selection produces an oval.",
    },
  ],
  tips: [
    "Use the 1:1 ratio for a round result; anything else gives you an ellipse.",
    "Center the important part of the photo in the selection, since the edges get masked away.",
    "Export PNG for avatars so the transparent corners sit cleanly on any background color.",
    "Resize the circle after cropping if a site needs a specific avatar size like 400x400.",
  ],
  related: ["crop-image", "resize-image", "add-text-to-photo", "convert-image"],
};

export default content;
