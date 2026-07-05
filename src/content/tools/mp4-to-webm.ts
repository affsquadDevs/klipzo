import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "mp4-to-webm",
  intro:
    "To convert MP4 to WebM for free in your browser, open Klipzo, drop in your MP4, choose WebM as the output, and export a smaller, web-ready file. The re-encode runs on your own device, so the MP4 is never uploaded, no account is required, and the WebM downloads without a watermark.",
  body:
    "Turning an MP4 into a WebM is the standard move for putting video on the web: WebM is an open format that tends to produce a smaller file at similar quality, which means faster page loads and lighter background or hero videos. Klipzo reads your MP4 and encodes WebM locally through WebCodecs and Mediabunny, so even a large source stays on your machine and converts without an upload wait. You can keep the resolution or scale it down for the web, and a progress bar with a cancel button lets you stop the export anytime. WebM encoding is fastest and most reliable in desktop Chrome or Edge.",
  howTo: {
    title: "How to convert MP4 to WebM online",
    description: "Turn an MP4 into a smaller WebM for the web, all in your browser with nothing uploaded.",
    totalTime: "PT3M",
    steps: [
      { name: "Add your MP4", text: "Open Klipzo and drop your MP4 in, or click to browse. It loads on your device with no upload." },
      { name: "Choose WebM output", text: "Open the Convert tool and set the output format to WebM. Klipzo confirms your browser can encode it." },
      { name: "Set resolution for the web", text: "Keep the original size, or scale down to 1080p or 720p if the video is for a web page where load speed matters." },
      { name: "Tune the quality", text: "Adjust the quality level to balance a small file against how sharp the WebM needs to look." },
      { name: "Preview before encoding", text: "Play back the loaded clip to make sure it's the right one, then confirm your settings." },
      { name: "Export and download", text: "Click Export to encode the WebM on your device and download it. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Why convert MP4 to WebM at all?",
      answer:
        "WebM is an open, web-optimized format that usually yields a smaller file than MP4 at comparable quality. That makes it a strong choice for embedding video on a website, where a lighter file means faster loading for your visitors.",
    },
    {
      question: "Is my MP4 uploaded to convert it?",
      answer:
        "No. The MP4-to-WebM encode happens entirely in your browser on your own device, so the file never goes to a server. Your video stays private and there's no upload-size cap to worry about.",
    },
    {
      question: "Will the WebM look worse than the original MP4?",
      answer:
        "Not noticeably if you keep the resolution and choose a high quality level — WebM often matches the look at a smaller size. You can preview and adjust the quality before exporting so you're happy with the trade-off.",
    },
    {
      question: "Do all browsers play WebM?",
      answer:
        "Most modern browsers play WebM well, though very old browsers and some environments may prefer MP4. If broad compatibility matters more than file size, keep an MP4 copy alongside your WebM.",
    },
    {
      question: "What's the best browser for encoding WebM?",
      answer:
        "WebM export is fastest and most dependable in desktop Chrome or Edge thanks to WebCodecs hardware acceleration. Klipzo checks your browser, falls back to MediaRecorder or ffmpeg.wasm where needed, and tells you honestly if the export isn't supported.",
    },
  ],
  tips: [
    "For website video, scale down to 1080p or 720p — the WebM gets much smaller with little visible difference on screen.",
    "Keep an MP4 fallback if you need to support very old browsers that don't play WebM.",
    "Trim the clip before converting so you're not encoding seconds you'll never show.",
    "Run the WebM export in desktop Chrome or Edge and keep the tab focused for the fastest, most reliable result.",
  ],
  related: ["convert-video", "compress-video", "video-to-gif", "trim-video"],
};

export default content;
