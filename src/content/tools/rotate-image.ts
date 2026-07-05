import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "rotate-image",
  intro:
    "To rotate or flip a photo for free without uploading it, open Klipzo, load your image, and rotate in 90-degree steps, flip horizontally or vertically, or nudge a fine angle to straighten a crooked shot. Everything happens in your browser on your device, with no account, no watermark, and no wait.",
  body:
    "This is the quickest fix for a phone photo that came in sideways or upside down, or a horizon that tilts a few degrees off level. Use the 90/180/270 buttons to reorient a photo, mirror it with a horizontal or vertical flip, or drag the straighten slider for fine angle correction down to a fraction of a degree. When you straighten by a small angle, the corners that would otherwise show empty triangles are automatically cropped away so you get a clean rectangle. The transform is applied on Canvas at full resolution, so nothing is uploaded and quality is preserved.",
  howTo: {
    title: "How to rotate or flip an image online",
    description: "Rotate in 90-degree steps, flip, or straighten a tilted photo — all in your browser.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to Klipzo and drag your photo in, or click to browse. It loads on your device with nothing uploaded." },
      { name: "Choose Rotate", text: "Select the Rotate tool from the tool rail to reveal the rotate, flip, and straighten controls." },
      { name: "Rotate by 90 degrees", text: "Tap rotate right or left to fix a sideways photo. Press again to reach 180 or 270 degrees." },
      { name: "Flip if needed", text: "Use flip horizontal to mirror the image left-to-right, or flip vertical to mirror top-to-bottom." },
      { name: "Straighten a tilt", text: "Drag the angle slider to level a crooked horizon. The empty corners are auto-cropped so the result stays a clean rectangle." },
      { name: "Export and download", text: "Click Export to save a PNG, JPEG, or WebP. No sign-up and no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is the rotate tool free to use?",
      answer:
        "Yes, entirely free. There is no account to create, no watermark added, and no cap on how many photos you rotate. The guide pages carry ads; the tool does not charge you.",
    },
    {
      question: "Is my picture uploaded when I rotate it?",
      answer:
        "No. The rotation and flip are computed in your browser with the Canvas API, so the image never leaves your device and processing is instant.",
    },
    {
      question: "Can I straighten a photo by a small angle, not just 90 degrees?",
      answer:
        "Yes. Alongside the 90-degree buttons there is a fine angle slider for leveling a tilted horizon by a fraction of a degree.",
    },
    {
      question: "Why does straightening crop my photo slightly?",
      answer:
        "Rotating by a small angle leaves empty triangular corners. Klipzo automatically trims those so you keep a clean rectangular image with no blank edges.",
    },
    {
      question: "Does rotating lower the image quality?",
      answer:
        "A 90, 180, or 270-degree turn is lossless. Fine-angle straightening resamples the pixels once, and you still choose PNG for lossless output or JPEG/WebP with a quality slider on export.",
    },
  ],
  tips: [
    "If a photo looks correct on your phone but sideways here, its EXIF orientation flag was misread — a quick 90-degree turn fixes it, and export bakes the orientation in.",
    "Flip horizontal is great for correcting mirror-selfies so text in the shot reads the right way.",
    "Straighten using a strong horizontal line like the horizon or a table edge as your reference.",
    "Do rotation before cropping so your crop box lines up with the corrected frame.",
    "Use 180-degree rotation to fix a photo that scanned or imported upside down.",
  ],
  related: ["crop-image", "resize-image", "add-text-to-photo", "convert-image"],
};

export default content;
