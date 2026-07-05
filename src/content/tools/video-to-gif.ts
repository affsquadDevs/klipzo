import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "video-to-gif",
  intro:
    "To turn a video into an animated GIF for free, open Klipzo, pick the section you want to loop, set the output width and frame rate, and export a GIF. Everything runs on your device in the browser using WebCodecs and Mediabunny, so your clip is never uploaded, there’s no account, and there’s no watermark.",
  body:
    "GIFs are perfect for short reaction loops, product demos, and README animations where autoplay and silent looping matter more than audio. Klipzo lets you scrub to the exact start and end, then trade file size against smoothness by lowering the frame rate (10–15 fps is plenty for most loops) and scaling the width down to 480 or 320 pixels. Because the frames are decoded and re-encoded locally, a quick clip becomes a GIF in seconds, and heavy exports run fastest in desktop Chrome or Edge. Longer or larger GIFs show a progress bar you can cancel at any time.",
  howTo: {
    title: "How to convert a video to GIF online",
    description: "Make an animated GIF from any video clip in your browser, with nothing uploaded.",
    totalTime: "PT2M",
    steps: [
      { name: "Open your video", text: "Go to Klipzo and drag your video file in, or click to browse. It loads instantly on your device — no upload." },
      { name: "Pick the range to loop", text: "Drag the start and end handles on the timeline to select the few seconds you want to turn into a GIF." },
      { name: "Set the size", text: "Choose an output width like 480px or 320px. Smaller dimensions make a much smaller GIF file." },
      { name: "Choose a frame rate", text: "Set frames per second — 10 to 15 fps keeps loops smooth while keeping the file light." },
      { name: "Export the GIF", text: "Click Export to render the animated GIF on your device, watch the progress bar, then download the looping file." },
    ],
  },
  faqs: [
    {
      question: "Is Klipzo’s video-to-GIF converter free?",
      answer:
        "Yes, making GIFs is completely free with no sign-up and no watermark on the output. There are no export caps, so you can create as many GIF loops as you like.",
    },
    {
      question: "Does my video get uploaded to make the GIF?",
      answer:
        "No. The conversion happens entirely in your browser using WebCodecs, so the video stays on your device and nothing is sent to a server. That’s also why short clips convert almost instantly.",
    },
    {
      question: "Why is my GIF file so large?",
      answer:
        "GIF only supports 256 colors and stores every frame, so long clips and high frame rates balloon in size. Trim to a few seconds, drop the width to 480px or less, and lower the frame rate to 10–15 fps to shrink it dramatically.",
    },
    {
      question: "Will the GIF have sound?",
      answer:
        "No. The GIF format cannot store audio, so the exported loop is silent by design. If you need the sound, keep the original video or export the audio separately.",
    },
    {
      question: "What frame rate should I use?",
      answer:
        "For most reaction loops and demos, 10 to 15 fps looks smooth and keeps the file small. Higher rates look slightly smoother but grow the file quickly, so only raise them for fast motion.",
    },
  ],
  tips: [
    "Keep GIFs under about five seconds — short loops feel snappier and stay small enough to embed anywhere.",
    "Lower the width to 320px or 480px before exporting; scaling down is the single biggest way to cut GIF file size.",
    "Trim tightly to the action so the loop restarts on a natural beat instead of a pause.",
    "Need audio or a smaller file? Export as MP4 or WebM instead and use a video player that autoplays muted.",
    "For heavy or long exports, use desktop Chrome or Edge, where hardware-accelerated decoding is fastest.",
  ],
  related: ["trim-video", "compress-video", "convert-video", "resize-video-for-instagram"],
};

export default content;
