import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "png-to-jpg",
  intro:
    "To convert a PNG to JPG for free, open Klipzo’s editor, load your PNG, choose a background color for any transparent areas, set the quality, and export as JPG. It all runs in your browser on your device, so the file is never uploaded, no account is required, and there’s no watermark. The resulting JPG is typically much smaller than the original PNG.",
  body:
    "PNGs are lossless and often heavy, especially for photographs, so converting to JPG is the quickest way to slash file size for email, web pages, and uploads that reject large files. Because JPG can’t store transparency, Klipzo flattens any transparent pixels onto a solid background color you pick — white is the usual choice. A quality slider lets you decide how aggressively to compress, with a live preview so you can keep the image looking clean. Everything is processed locally on your device, so even a large PNG converts instantly with nothing sent to a server.",
  howTo: {
    title: "How to convert PNG to JPG online",
    description: "Turn a PNG into a compact JPG in your browser, flattening transparency, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your PNG in, or click to browse. It opens on your device with no upload." },
      { name: "Open the Convert tool", text: "Select Convert from the tool rail and set the output format to JPG." },
      { name: "Pick a background color", text: "JPG has no transparency, so choose a fill color — usually white — for any transparent areas of the PNG." },
      { name: "Adjust the quality", text: "Drag the quality slider to balance file size against detail; the estimated size updates as you go." },
      { name: "Preview the result", text: "Check the preview to confirm the flattened image and compression look right." },
      { name: "Export as JPG", text: "Click Export to download the JPG. No sign-up and no watermark are added." },
    ],
  },
  faqs: [
    {
      question: "Is converting PNG to JPG free?",
      answer:
        "Yes, it’s free with no account and no watermark on the output. You can convert as many PNG files to JPG as you want at no cost.",
    },
    {
      question: "Does my PNG get uploaded anywhere?",
      answer:
        "No. The PNG is decoded and re-saved as JPG entirely within your browser, so it never leaves your device. That’s why the conversion happens right away.",
    },
    {
      question: "What happens to the transparent parts of my PNG?",
      answer:
        "JPG can’t store transparency, so transparent pixels are filled with a background color you choose before export. White is the most common choice, but you can pick any color.",
    },
    {
      question: "Will the JPG be smaller than the PNG?",
      answer:
        "Usually, yes — often dramatically so for photos and detailed images, because JPG uses lossy compression while PNG is lossless. Lower the quality slider for even smaller files.",
    },
    {
      question: "Is any image quality lost in the conversion?",
      answer:
        "JPG is a lossy format, so some fine detail is discarded to save space. At high quality settings the difference is hard to see, so use the preview to pick a level you’re happy with.",
    },
  ],
  tips: [
    "Use a white background for photos going into documents and a matching page color for web graphics.",
    "Keep quality around 80% for a big size drop with detail that still looks sharp.",
    "If your PNG has crisp text or a transparent logo you need to preserve, keep it as PNG or use WebP instead.",
    "Resize the image down before converting to shrink the JPG even further.",
    "Converting screenshots from PNG to JPG can cut their size by more than half.",
  ],
  related: ["jpg-to-png", "convert-image", "compress-image", "webp-converter"],
};

export default content;
