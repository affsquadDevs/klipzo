import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "crop-video",
  intro:
    "To crop a video for free and privately, open Klipzo, drag your clip in, drag the crop box (or pick a ratio like 1:1 or 9:16) over the frame, and export. The crop is applied on your own device in the browser, so your video is never uploaded, there's no account to make, and the download carries no watermark.",
  body:
    "Cropping a video reframes every frame the same way — you're cutting off edges, removing a distracting border, or changing the composition so the subject sits where you want. Klipzo lets you drag a crop box freely or snap to presets people actually use, like square 1:1 for feeds, 4:5 for portrait posts, and 9:16 for reels and shorts. The re-encode runs locally through WebCodecs and Mediabunny, so a high-resolution clip crops without any upload wait, and a progress bar with a cancel button keeps long exports under your control. Nothing touches a server at any point.",
  howTo: {
    title: "How to crop a video online",
    description: "Reframe a video by cropping its edges in your browser, with nothing uploaded.",
    totalTime: "PT2M",
    steps: [
      { name: "Import your video", text: "Open Klipzo and drop your clip onto the canvas, or click to browse. It loads on your device instantly, no upload." },
      { name: "Open the Crop tool", text: "Choose Crop from the tool rail. A crop box appears over the video frame with draggable handles." },
      { name: "Pick a ratio or drag freely", text: "Tap a preset like Square 1:1, Portrait 4:5, or Vertical 9:16, or drag the handles for a custom crop." },
      { name: "Position the frame", text: "Drag the crop box to place the subject where you want it. The live output dimensions update as you move it." },
      { name: "Preview the crop", text: "Scrub or play the clip to make sure the subject stays inside the crop for the whole shot." },
      { name: "Export and download", text: "Click Export to re-encode the cropped video on your device and download it. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "What's the difference between cropping and resizing a video?",
      answer:
        "Cropping cuts away the outer edges of the frame to change what's visible, while resizing scales the whole picture to new pixel dimensions. Use crop to reframe or remove a border, and resize when you need an exact width and height.",
    },
    {
      question: "Is my video private when I crop it?",
      answer:
        "Yes. The crop is computed frame by frame in your browser on your own machine. Your clip is never sent anywhere, so you can crop personal footage knowing it never leaves your device.",
    },
    {
      question: "Can I crop to a vertical 9:16 for reels or shorts?",
      answer:
        "Yes. Klipzo has one-tap presets for square 1:1, portrait 4:5, vertical 9:16, and widescreen 16:9, plus free-form cropping so you can dial in any composition you need.",
    },
    {
      question: "Does cropping lower my video's quality?",
      answer:
        "Cropping only removes pixels outside the box; the pixels you keep are re-encoded at high quality. For the best result on heavy footage, use desktop Chrome or Edge, where WebCodecs hardware acceleration keeps the export sharp and fast.",
    },
    {
      question: "Is Klipzo's video cropper free to use?",
      answer:
        "It is fully free, with no account and no watermark added to the output. Ads on the guide pages support the site, so cropping and downloading your video never costs anything.",
    },
  ],
  tips: [
    "Crop to 9:16 before posting to TikTok or Reels so nothing important sits in the area the app would cover.",
    "Keep your subject slightly off-center inside the crop box for a more natural, less static composition.",
    "Check the last few seconds too — a subject that drifts can slide out of a tight crop by the end.",
    "Run big exports in desktop Chrome or Edge and leave the tab focused for the fastest encode.",
  ],
  related: ["trim-video", "resize-video-for-instagram", "rotate-video", "compress-video"],
};

export default content;
