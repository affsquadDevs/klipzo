import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "resize-image",
  intro:
    "To resize an image for free, open Klipzo’s editor, type a new width or height in pixels (or pick a percentage like 50% or 200%), and export. It runs entirely in your browser, so nothing is uploaded, there’s no account, and your photo is never sent to a server. Lock the aspect ratio to scale cleanly without stretching.",
  body:
    "Resizing changes an image’s pixel dimensions — useful for fitting a forum avatar limit, meeting an email attachment cap, or matching a template that expects an exact size. Klipzo lets you set width and height directly, or scale by percentage with quick 50%, 75%, and 200% presets. Keep the lock icon on to preserve proportions so nothing looks squashed; turn it off when you deliberately need a non-proportional size. Because the math runs on your own device with Canvas, even a 6000-pixel photo resizes the instant you hit apply, with no upload wait.",
  howTo: {
    title: "How to resize an image online",
    description: "Change a photo’s pixel dimensions or scale it by percentage in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your image in, or click to browse. It loads on your device with no upload." },
      { name: "Open the Resize tool", text: "Choose Resize from the tool rail. You’ll see the current width and height in pixels." },
      { name: "Enter a new size", text: "Type a target width or height, or pick a percentage preset like 50%, 75%, or 200% to scale up or down." },
      { name: "Lock the aspect ratio", text: "Keep the lock icon on so width and height change together and the photo isn’t stretched." },
      { name: "Apply the change", text: "Click Apply. The canvas updates to the new dimensions and the live pixel readout confirms the size." },
      { name: "Export the result", text: "Click Export to download a PNG, JPEG, or WebP at your new size. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Does resizing cost anything?",
      answer:
        "No — Klipzo’s resizer is free to use with no account, no watermark, and no cap on how many images you resize. The tool itself never charges you.",
    },
    {
      question: "Are my images uploaded to resize them?",
      answer:
        "They aren’t. All resizing happens locally in your browser using HTML5 Canvas, so the file stays on your device and is never transmitted to any server.",
    },
    {
      question: "Can I resize by percentage instead of exact pixels?",
      answer:
        "Yes. You can scale by percentage with one-tap 50%, 75%, and 200% presets, or type any custom width or height in pixels for precise control.",
    },
    {
      question: "Will enlarging an image make it blurry?",
      answer:
        "Scaling up past a photo’s native resolution adds pixels the camera never captured, so it can look soft. Downscaling stays crisp. For the sharpest results, resize down rather than up whenever possible.",
    },
    {
      question: "How do I keep the aspect ratio the same?",
      answer:
        "Leave the lock icon enabled. When it’s on, changing the width automatically updates the height (and vice versa) so the image keeps its original proportions.",
    },
  ],
  tips: [
    "For website hero images, resize to around 1600–1920 pixels wide before compressing to keep pages fast.",
    "Use the 50% preset to quickly halve oversized phone photos for email attachments.",
    "Resize first, then compress — shrinking dimensions cuts file size more than quality tweaks alone.",
    "For social avatars, resize to the exact square size the platform lists (for example 400×400) to avoid awkward auto-cropping.",
    "Turn the lock off only when a layout demands a fixed, non-proportional size such as a banner strip.",
  ],
  related: ["compress-image", "crop-image", "convert-image", "rotate-image"],
};

export default content;
