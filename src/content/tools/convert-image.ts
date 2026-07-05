import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "convert-image",
  intro:
    "To convert an image between PNG, JPG, and WebP for free, open Klipzo’s editor, pick your target format, adjust quality if it’s a lossy format, and export. The conversion happens entirely in your browser on your device, so nothing is uploaded, no account is needed, and there’s no watermark. Switch formats in seconds without any software to install.",
  body:
    "Different formats suit different jobs: PNG is lossless and supports transparency, JPEG is compact and ideal for photographs, and WebP often beats both on size at the same quality. Klipzo re-encodes your image to whichever you choose, with a quality slider for JPEG and WebP so you control the size-versus-detail trade-off. Converting a transparent PNG to JPEG flattens the transparency onto a background color, while converting to PNG or WebP keeps it. Since everything runs on-device with Canvas, conversion is instant and your original file never leaves your computer.",
  howTo: {
    title: "How to convert image formats online",
    description: "Change an image between PNG, JPG, and WebP in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and add your image by dragging it in or clicking to browse. It loads on your device." },
      { name: "Open the Convert tool", text: "Select Convert from the tool rail to see the available output formats." },
      { name: "Choose a target format", text: "Pick PNG for lossless and transparency, JPG for small photo files, or WebP for the best size-to-quality ratio." },
      { name: "Set the quality", text: "For JPG or WebP, drag the quality slider to balance file size against detail. PNG stays lossless." },
      { name: "Choose a background if needed", text: "When converting a transparent image to JPG, pick a background color to flatten the transparency onto." },
      { name: "Export the converted file", text: "Click Export to download the image in the new format. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is the image converter free?",
      answer:
        "Yes, converting is completely free with no account, no watermark, and no limit on the number of files. Nothing about the conversion tool is paywalled.",
    },
    {
      question: "Is my file sent to a server to convert it?",
      answer:
        "No. Klipzo decodes and re-encodes the image right in your browser, so it stays on your device throughout. That local processing is why conversions are instant.",
    },
    {
      question: "Which formats can I convert between?",
      answer:
        "You can convert among PNG, JPG (JPEG), and WebP in any direction. Choose PNG for lossless graphics and transparency, JPG for compact photos, and WebP for the smallest files at good quality.",
    },
    {
      question: "What happens to transparency when I convert to JPG?",
      answer:
        "JPG doesn’t support transparency, so any transparent areas are flattened onto a background color you choose. Convert to PNG or WebP instead if you need to keep the transparent background.",
    },
    {
      question: "Does converting change my image’s quality?",
      answer:
        "Converting to PNG is lossless. Converting to JPG or WebP re-encodes with lossy compression, so use the quality slider to keep the result looking clean while reducing size.",
    },
  ],
  tips: [
    "Convert photos to WebP to get noticeably smaller files than JPG at the same visual quality.",
    "Keep logos, icons, and screenshots with sharp edges as PNG to avoid compression fuzz.",
    "Before converting a transparent PNG to JPG, decide on a background color that matches where you’ll place it.",
    "For maximum browser compatibility on older systems, JPG and PNG are the safest choices; WebP is best for modern web use.",
    "Convert then compress in one pass by nudging the quality slider down during export.",
  ],
  related: ["png-to-jpg", "jpg-to-png", "webp-converter", "compress-image"],
};

export default content;
