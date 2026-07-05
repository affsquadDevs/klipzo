import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "trim-video",
  intro:
    "To trim a video for free, open Klipzo, drag your clip onto the timeline, set the start and end handles around the part you want to keep, and export. Everything runs in your browser using your device's own hardware, so the file is never uploaded, there's no account, and there's no watermark on the result.",
  body:
    "Trimming is about keeping the good part and dropping dead air at the head and tail, or splitting a clip and deleting a section in the middle. Klipzo gives you a multi-track timeline where you can scrub frame by frame, drop a split at the playhead, and remove any segment you don't want, then join what's left. Because the encode happens locally through WebCodecs and Mediabunny, a long recording trims without waiting on an upload, and your footage never leaves the tab. Heavy exports are fastest in desktop Chrome or Edge, and a progress bar with a cancel button keeps you in control.",
  howTo: {
    title: "How to trim a video online",
    description: "Cut the start, end, or middle out of a video in your browser, with nothing uploaded.",
    totalTime: "PT2M",
    steps: [
      { name: "Import your clip", text: "Open Klipzo and drag your video into the timeline, or click to browse. It loads locally, so even a large file is ready in seconds." },
      { name: "Find the section to keep", text: "Scrub the playhead across the timeline and use frame stepping to land exactly on the first frame you want." },
      { name: "Set the trim handles", text: "Drag the start and end handles inward to bracket the segment you want to keep. The preview updates as you drag." },
      { name: "Split and remove extras", text: "Need to drop a middle section? Drop a split at the playhead, select the unwanted piece, and delete it, then close the gap." },
      { name: "Preview the result", text: "Play back the trimmed timeline to confirm the cut points feel right before committing." },
      { name: "Export and download", text: "Click Export to encode the trimmed video on your device and download it. No sign-up and no watermark." },
    ],
  },
  faqs: [
    {
      question: "Does trimming re-encode the whole video?",
      answer:
        "Klipzo encodes the segments you keep so the output plays cleanly from the first frame. Because this happens on your device with hardware acceleration, it's quick, and a progress bar with a cancel button shows you exactly how far along the export is.",
    },
    {
      question: "Is my footage uploaded to trim it?",
      answer:
        "No. The clip you trim stays in your browser tab and is processed on your own machine. Nothing is sent to a server, which is why you can trim private recordings without them ever leaving your device.",
    },
    {
      question: "Can I cut a section out of the middle, not just the ends?",
      answer:
        "Yes. Drop a split at each edge of the part you want gone, select that piece, and delete it. The remaining clips close the gap, so you can remove any interior section, not only the head and tail.",
    },
    {
      question: "Which browser should I use for trimming?",
      answer:
        "Trimming works across modern browsers, but heavy exports finish fastest in desktop Chrome or Edge thanks to WebCodecs hardware acceleration. Klipzo detects your browser and falls back to MediaRecorder or ffmpeg.wasm when needed, and tells you honestly if a specific export isn't supported.",
    },
    {
      question: "Is Klipzo's video trimmer actually free?",
      answer:
        "Yes, it's free with no account, no export cap, and no watermark stamped on your video. The tool is supported by ads on the surrounding guide pages, not by charging you to trim or download.",
    },
  ],
  tips: [
    "Zoom into the timeline before setting handles so you can land on the exact frame instead of guessing.",
    "Trim first, then add text or audio — a shorter timeline makes every later edit and export faster.",
    "Use split-and-delete to remove a cough or a stumble in the middle without re-recording the whole take.",
    "For the fastest export on a long clip, run it in desktop Chrome or Edge and keep the tab in the foreground.",
  ],
  related: ["crop-video", "compress-video", "convert-video", "extract-audio-from-video"],
};

export default content;
