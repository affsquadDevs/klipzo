import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "compress-video",
  intro:
    "To compress a video on-device for free, open Klipzo, add your clip, lower the resolution or bitrate (or aim at a target file size), and export a smaller file. All of the encoding happens in your browser on your own hardware, so the video is never uploaded, no account is needed, and the smaller file downloads without a watermark.",
  body:
    "Compression shrinks a video so it fits an email attachment limit, sends quickly over a messaging app, or loads fast on a web page. Klipzo lets you trade size for quality on your terms: drop from 4K to 1080p or 720p, pick a lower bitrate, nudge a quality slider, or set a target size and let the encoder work toward it. Everything runs locally through WebCodecs and Mediabunny, so a large file compresses without a round trip to any server, and a progress bar with a cancel button lets you stop a long export at any time. Desktop Chrome or Edge gives the fastest results on big files.",
  howTo: {
    title: "How to compress a video online",
    description: "Make a video file smaller for email, messaging, or the web, all in your browser.",
    totalTime: "PT3M",
    steps: [
      { name: "Add your video", text: "Open Klipzo and drop in the clip you want to shrink, or click to browse. It loads locally with no upload." },
      { name: "Open the Compress tool", text: "Choose Compress. You'll see controls for resolution, bitrate, quality, and an estimated output size." },
      { name: "Lower the resolution", text: "Step the resolution down, for example from 4K to 1080p or 720p — this usually cuts size the most with little visible loss." },
      { name: "Set bitrate or a target size", text: "Reduce the bitrate or enter a target file size, such as fitting under a 25 MB email limit, and watch the estimate update." },
      { name: "Check the estimate", text: "Review the projected size and preview quality, then adjust the sliders until the trade-off looks right." },
      { name: "Export and download", text: "Click Export to encode the smaller file on your device and download it. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "How does Klipzo make the file smaller?",
      answer:
        "It re-encodes the video at a lower resolution, bitrate, or quality setting, which are the levers that control file size. You can also set a target size and let the encoder aim for it, so you keep as much quality as your size budget allows.",
    },
    {
      question: "Is my video uploaded to be compressed?",
      answer:
        "No. Compression runs entirely in your browser on your own device, so the clip is never sent to a server. That's also why there are no size limits imposed by an upload — you're only limited by your own machine.",
    },
    {
      question: "Can I compress a video to fit under an email size limit?",
      answer:
        "Yes. Set a target file size, such as 25 MB, and Klipzo works toward it by adjusting bitrate and resolution. The live estimate shows whether you'll come in under the limit before you export.",
    },
    {
      question: "Will compressing noticeably hurt quality?",
      answer:
        "It depends how far you push it. Dropping resolution one step or trimming bitrate a little is usually hard to notice, while very aggressive settings show more. The live preview and size estimate let you find the point where the file is small but still looks good.",
    },
    {
      question: "What's the best setup for compressing large files?",
      answer:
        "Heavy compression is fastest in desktop Chrome or Edge, where WebCodecs hardware acceleration does the work. Klipzo detects your browser, falls back to MediaRecorder or single-threaded ffmpeg.wasm when needed, and tells you honestly if an export isn't supported.",
    },
  ],
  tips: [
    "Dropping the resolution one step is usually the single biggest size win with the least visible quality loss.",
    "For messaging apps, 720p at a modest bitrate keeps the file small enough to send quickly.",
    "Trim out dead footage first — a shorter clip compresses to a smaller file at the same quality.",
    "If a target-size export looks soft, raise the resolution back up and lower the bitrate instead.",
    "Compress big files in desktop Chrome or Edge and keep the tab in focus for the quickest encode.",
  ],
  related: ["trim-video", "convert-video", "mp4-to-webm", "resize-video-for-instagram"],
};

export default content;
