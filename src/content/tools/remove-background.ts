import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "remove-background",
  intro:
    "Klipzo's background remover is designed to cut a subject out of a photo entirely on your device — no upload, no account, no watermark. It uses on-device AI segmentation: a small model downloads to your browser once, then runs locally so the image is never sent to a server. This feature is rolling out, and it aims to give you a fast, private cutout without a cloud service ever seeing your photo.",
  body:
    "Most background removers upload your image to a remote server to run their AI. Klipzo takes a different approach: the segmentation model is fetched to your browser the first time you use the tool and cached, after which it runs on your own hardware with WebGL acceleration. That means your photo stays private and you can even work offline once the model is cached. Results are strongest on clear subject-and-background separation like a person or product against a plain-ish backdrop; very fine hair, glass, or low-contrast edges are harder, so expect to touch up tricky areas rather than assume a flawless cutout every time.",
  howTo: {
    title: "How to remove an image background on your device",
    description: "Cut out a subject with on-device AI segmentation that keeps your photo off any server.",
    totalTime: "PT2M",
    steps: [
      { name: "Open the editor", text: "Go to Klipzo and drag your photo in, or click to browse. It loads locally and is never uploaded." },
      { name: "Choose Remove Background", text: "Select the background remover from the tool rail. The first time, a small AI model downloads to your browser and is cached for next time." },
      { name: "Let it run on your device", text: "The model analyzes the image locally with WebGL to separate the subject from the background. Nothing is sent to a server." },
      { name: "Review and refine the edges", text: "Check the cutout, especially around hair and fine detail, and refine any areas the automatic pass missed." },
      { name: "Export with transparency", text: "Export as a PNG or WebP to keep the transparent background. No sign-up and no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is my photo uploaded to remove the background?",
      answer:
        "No. The AI segmentation runs in your browser on your own device. The model is downloaded to you once, and your image itself is never transmitted to any server.",
    },
    {
      question: "Is the background remover available right now?",
      answer:
        "It is rolling out as an on-device feature. The privacy-first design means the model runs locally rather than in the cloud, so availability may depend on your browser and device.",
    },
    {
      question: "Will it produce a perfect cutout?",
      answer:
        "Not always. Automatic segmentation does well with clear subjects on plainer backgrounds, but fine hair, transparent objects, and low-contrast edges can need manual touch-up.",
    },
    {
      question: "Does it cost anything or add a watermark?",
      answer:
        "No. Like the rest of Klipzo it is free, needs no account, and never stamps a watermark on your result. Ads on the guide pages support the tool.",
    },
    {
      question: "Why does it need to download a model the first time?",
      answer:
        "Running AI locally requires the model files in your browser. They download once and are cached, so later cutouts start faster and can even work offline.",
    },
  ],
  tips: [
    "Shoot or pick a photo where the subject stands out clearly from the background for the cleanest automatic cutout.",
    "The first run downloads the model, so give it a moment; subsequent images process faster from the cache.",
    "Export as PNG or WebP to keep transparency — JPEG has no alpha channel and would fill the background with a solid color.",
    "Zoom in to check edges around hair and fingers, where automatic segmentation is most likely to need a touch-up.",
    "After cutting out the subject, add it over a new backdrop or a solid color for product shots and profile images.",
  ],
  related: ["crop-image", "add-text-to-photo", "resize-image", "convert-image"],
};

export default content;
