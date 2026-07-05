import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "webp-converter",
  intro:
    "To convert images to and from WebP for free without uploading anything, open Klipzo, drop in your file, and export as WebP for smaller, faster-loading web images — or convert an existing .webp back to PNG or JPEG. It all runs in your browser on your own device, with no account and no watermark.",
  body:
    "WebP typically produces files 25–35% smaller than JPEG or PNG at the same visual quality, which means faster pages and lower bandwidth. Klipzo lets you go both directions: turn a heavy PNG or JPEG into a lightweight WebP for a website or app, or convert a .webp you downloaded into a PNG or JPEG that older software and social uploaders accept. A quality slider on export lets you trade file size against fidelity, and because the encode happens locally on Canvas, even batches of large photos convert instantly with no server round-trip.",
  howTo: {
    title: "How to convert to and from WebP online",
    description: "Encode images as WebP or decode WebP back to PNG or JPEG, entirely in your browser.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the converter", text: "Go to Klipzo and drag your image in, or click to browse. A PNG, JPEG, or existing .webp all load instantly on your device." },
      { name: "Pick the target format", text: "Choose WebP to shrink an image for the web, or choose PNG/JPEG to convert an existing WebP into a more widely supported format." },
      { name: "Set the quality", text: "For WebP or JPEG, drag the quality slider to balance file size and sharpness. Watch the estimated output size update as you adjust." },
      { name: "Preview the result", text: "Compare the converted image against the original to confirm the compression level looks right before you save." },
      { name: "Export and download", text: "Click Export to download the converted file. No sign-up, no watermark, and metadata is stripped on the way out." },
    ],
  },
  faqs: [
    {
      question: "Does converting to WebP cost anything?",
      answer:
        "No. The WebP converter is free with no account, no watermark, and no daily limit. Ads on the surrounding guide pages keep it running, not fees for the tool itself.",
    },
    {
      question: "Are my images sent to a server to be converted?",
      answer:
        "Never. Both encoding to WebP and decoding from WebP happen in your browser using the Canvas API, so your files stay on your device the entire time.",
    },
    {
      question: "Can I convert a WebP back into a JPG or PNG?",
      answer:
        "Yes. Load any .webp and export it as JPEG or PNG. This is handy when a program or upload form rejects WebP files.",
    },
    {
      question: "Will WebP look worse than my original JPEG or PNG?",
      answer:
        "At the same file size WebP usually looks as good or better. You control the trade-off with the quality slider; set it near the top for near-lossless results.",
    },
    {
      question: "Does WebP support transparency?",
      answer:
        "Yes. WebP keeps an alpha channel, so a transparent PNG converts to a transparent WebP without a background being added.",
    },
  ],
  tips: [
    "For photos on a website, WebP at around 80% quality is a strong default that cuts file size sharply with little visible loss.",
    "Converting a transparent PNG? WebP preserves transparency and is far smaller than PNG for the same graphic.",
    "If a CMS or upload form rejects .webp, convert it to JPEG here first, then upload.",
    "Run WebP through the Compress tool afterward if you need to hit a specific size budget.",
    "Keep a copy of the original PNG if you might need to re-edit later, since re-encoding always discards some detail.",
  ],
  related: ["convert-image", "compress-image", "png-to-jpg", "jpg-to-png"],
};

export default content;
