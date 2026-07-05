import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "crop-image",
  intro:
    "To crop an image for free without uploading it, open Klipzo’s editor, choose the Crop tool, drag the crop box (or pick an aspect ratio like 1:1 or 9:16), and export. The whole thing runs in your browser, so your photo never leaves your device and there’s no watermark.",
  body:
    "Cropping is the fastest way to fix composition, remove distractions at the edges, or reshape a photo for a specific platform. Klipzo gives you a free-form crop box plus one-tap presets for the sizes people actually need — square for profile pictures, 4:5 and 9:16 for social, 16:9 for thumbnails and slides. Because nothing is uploaded, even a large, high-resolution photo crops instantly with no waiting on a server, and the exported file keeps full quality with camera and location metadata stripped for privacy.",
  howTo: {
    title: "How to crop an image online",
    description: "Crop a photo to any size or aspect ratio in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your photo in, or click to browse. It loads instantly on your device." },
      { name: "Select the Crop tool", text: "Pick Crop from the tool rail on the left. A crop box appears over your image." },
      { name: "Choose a ratio or drag freely", text: "Tap an aspect-ratio preset like Square 1:1, Portrait 4:5, or Story 9:16 — or drag the handles for a custom crop." },
      { name: "Position the crop", text: "Drag the box to frame the part you want to keep. The live pixel dimensions update as you go." },
      { name: "Apply and export", text: "Click Apply crop, then Export to download a PNG, JPEG, or WebP. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is this image cropper really free?",
      answer:
        "Yes — completely free, with no account, no watermark, and no export limits. Klipzo is supported by ads on its guide pages, not by charging you for the tool.",
    },
    {
      question: "Is my photo uploaded when I crop it?",
      answer:
        "No. Cropping happens entirely in your browser on your own device. Your image is never sent to a server, which is why it works instantly even with large files.",
    },
    {
      question: "Can I crop to a specific aspect ratio like 1:1 or 9:16?",
      answer:
        "Yes. Klipzo includes one-tap presets for square (1:1), portrait (4:5), story/reel (9:16), widescreen (16:9), and more, plus free-form cropping with live pixel dimensions.",
    },
    {
      question: "Will cropping reduce my image quality?",
      answer:
        "No. Cropping only removes pixels outside the box; the pixels you keep are untouched. When you export, you can choose PNG for lossless quality or JPEG/WebP with a quality slider.",
    },
    {
      question: "Does the cropped file keep my location and camera data?",
      answer:
        "No. Klipzo removes EXIF metadata (including GPS location and camera model) on export by default, so your cropped photo doesn’t carry hidden personal data.",
    },
  ],
  tips: [
    "Use the Square 1:1 preset for profile pictures and 9:16 for Instagram/TikTok stories and reels.",
    "Crop before adding text so your captions sit correctly on the final frame.",
    "For thumbnails, crop to 16:9 and keep the subject slightly off-center for a stronger composition.",
    "Need an exact pixel size afterward? Use the Resize tool once you’ve cropped.",
  ],
  related: ["resize-image", "rotate-image", "compress-image", "add-text-to-photo"],
};

export default content;
