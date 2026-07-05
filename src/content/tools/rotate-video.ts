import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "rotate-video",
  intro:
    "To rotate a video for free, open Klipzo, choose 90, 180, or 270 degrees to turn sideways or upside-down footage upright, and export. Everything runs on your device in the browser using WebCodecs and Mediabunny, so your video is never uploaded, no account is needed, and there’s no watermark.",
  body:
    "Phones often record video in the wrong orientation, leaving a clip that plays sideways or fully flipped once you move it to a computer. Klipzo fixes that by re-encoding the frames at the rotation you pick — a single 90-degree turn rights a sideways clip, 180 flips upside-down footage, and 270 handles the opposite tilt. Because the rotation is baked into the pixels on export, the corrected video plays the right way up in every player, not just the one that happened to read a rotation flag. It all processes locally, privately, and quickly, with a cancelable progress bar on longer files and the fastest exports in desktop Chrome or Edge.",
  howTo: {
    title: "How to rotate a video online",
    description: "Turn a sideways or upside-down video the right way up in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open your video", text: "Go to Klipzo and drag your clip in, or click to browse. It loads on your device instantly with no upload." },
      { name: "Open the rotate tool", text: "Choose the Rotate option to see your video in the preview with rotation controls." },
      { name: "Pick a rotation", text: "Select 90° to right a sideways clip, 180° to flip upside-down footage, or 270° for the opposite tilt." },
      { name: "Check the preview", text: "Confirm the video now plays the right way up in the preview before you render." },
      { name: "Export the video", text: "Click Export to bake the rotation into the file on your device, then download the corrected video." },
    ],
  },
  faqs: [
    {
      question: "Is rotating a video free on Klipzo?",
      answer:
        "Yes, it’s free to rotate as many videos as you like, with no account and no watermark added to your export.",
    },
    {
      question: "Is my footage uploaded when I rotate it?",
      answer:
        "No. Klipzo rotates and re-encodes the video entirely in your browser, so the file never leaves your device and nothing is sent to a server. Your clip stays private.",
    },
    {
      question: "Will the rotation stick in every video player?",
      answer:
        "Yes. Klipzo bakes the new orientation into the pixels on export, so the corrected video plays upright everywhere — not only in players that happen to respect an orientation flag.",
    },
    {
      question: "Which angle do I need for a sideways phone video?",
      answer:
        "Try 90° first and check the preview; if it’s now upside down instead, switch to 270°. Use 180° when the whole clip is flipped top to bottom.",
    },
    {
      question: "Does rotating reduce the video quality?",
      answer:
        "Rotating requires re-encoding, but Klipzo uses a high-quality setting so the difference is negligible. The picture is simply reoriented, and heavy exports run fastest in desktop Chrome or Edge.",
    },
  ],
  tips: [
    "Start with 90° and watch the preview — if it lands upside down, 270° is the correct turn.",
    "Use 180° for footage that came in fully flipped, such as a clip recorded with the phone inverted.",
    "Rotate before adding text or captions so your overlays sit correctly on the final orientation.",
    "If your clip is also the wrong shape after rotating, follow up with the crop or resize tool.",
    "For long videos, export in desktop Chrome or Edge for the quickest local re-encode.",
  ],
  related: ["crop-video", "resize-video-for-instagram", "trim-video", "compress-video"],
};

export default content;
