import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "resize-video-for-instagram",
  intro:
    "To resize a video for Instagram for free, open Klipzo, pick a preset — 9:16 for Reels and Stories, 1:1 for the feed, or 4:5 for portrait posts — reframe your shot, and export. It all runs on your device in the browser using WebCodecs and Mediabunny, so your video stays private, there’s no account, and there’s no watermark.",
  body:
    "Instagram uses several aspect ratios, and posting the wrong one leaves your video letterboxed or awkwardly cropped. Klipzo’s presets snap your clip to the exact shapes the app expects: tall 9:16 for full-screen Reels and Stories, square 1:1 for a tidy grid, and 4:5 portrait for feed posts that take up the most vertical space. You reframe by dragging your subject to stay centered inside the new canvas, so nothing important gets cut off. The reframing and re-encoding run locally for speed and privacy, with a cancelable progress bar on longer clips and the fastest performance in desktop Chrome or Edge.",
  howTo: {
    title: "How to resize a video for Instagram online",
    description: "Reframe any video to Instagram’s Reels, feed, or portrait sizes in your browser, with nothing uploaded.",
    totalTime: "PT2M",
    steps: [
      { name: "Import your video", text: "Open Klipzo and drag your clip in, or click to browse. It loads on your device instantly — no upload." },
      { name: "Choose an Instagram preset", text: "Pick 9:16 for Reels and Stories, 1:1 for the feed grid, or 4:5 for a tall portrait post." },
      { name: "Reframe the shot", text: "Drag your video inside the new canvas so your subject stays centered and nothing important is cut off." },
      { name: "Check the edges", text: "Confirm the framing in the preview so the final crop looks right for the ratio you chose." },
      { name: "Export the video", text: "Click Export to render the resized clip on your device, then download it ready to post." },
    ],
  },
  faqs: [
    {
      question: "Is resizing a video for Instagram free on Klipzo?",
      answer:
        "Yes, it’s completely free to reframe your videos, with no account required and no watermark on the export. There are no limits on how many clips you resize.",
    },
    {
      question: "Is my video uploaded when I resize it for Instagram?",
      answer:
        "No. Klipzo reframes and re-encodes the video right in your browser, so it never leaves your device and nothing is sent to a server. Your footage stays private.",
    },
    {
      question: "Which size should I use for Reels versus the feed?",
      answer:
        "Use 9:16 for full-screen Reels and Stories, 4:5 for portrait feed posts that fill more vertical space, and 1:1 square for a clean, uniform grid. Klipzo has a one-tap preset for each.",
    },
    {
      question: "Will resizing crop out part of my video?",
      answer:
        "Changing the aspect ratio can trim the edges, which is why you drag to reframe. Position your subject in the center of the new canvas so the important part of the shot is always kept.",
    },
    {
      question: "Does resizing lower the video quality?",
      answer:
        "Reframing re-encodes the clip, but Klipzo uses a high-quality setting so it stays crisp for Instagram. For the fastest export on larger videos, use desktop Chrome or Edge.",
    },
  ],
  tips: [
    "Use 9:16 for Reels and Stories — it fills the whole phone screen and gets the most reach.",
    "Keep your subject centered while reframing so it survives every crop, even the tighter square.",
    "Choose 4:5 for feed posts when you want the largest vertical footprint without going full portrait.",
    "Resize before adding captions so text lands inside the visible area of the new ratio.",
    "Trim to Instagram’s length limits first, then resize, to avoid re-encoding footage you’ll cut anyway.",
  ],
  related: ["crop-video", "rotate-video", "trim-video", "add-text-to-video"],
};

export default content;
