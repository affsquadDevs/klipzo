import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "auto-caption-video",
  intro:
    "To add automatic captions to a video for free, open Klipzo’s editor, import your clip, and run Auto-caption — an AI speech-recognition model (Whisper) transcribes the spoken words right on your device. Your audio is never uploaded; only the model is downloaded to your browser, so the whole process is private, watermark-free, and completely free.",
  body:
    "Captions boost watch time and make videos usable with the sound off, but typing them by hand is slow. Klipzo listens to your clip’s speech and generates timed caption lines automatically, then burns them into the video when you export. Every line stays editable as plain text, so you can fix a misheard word or nudge the timing, and you can also export the transcript as a standard .srt subtitle file for YouTube or other players. Because the transcription runs locally, the words you speak never leave your computer — the browser only fetches the recognition model itself.",
  howTo: {
    title: "How to add automatic captions to a video online",
    description: "Generate timed captions from your video’s speech in the browser, with the audio never uploaded.",
    totalTime: "PT5M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your video in, or click to browse. It loads instantly on your device." },
      { name: "Open Auto-caption", text: "Select the Captions tool from the rail. The first run downloads the speech-recognition model once, then caches it for next time." },
      { name: "Generate the transcript", text: "Click Generate. Klipzo transcribes the spoken audio locally and lays timed caption lines onto the timeline." },
      { name: "Edit the text and timing", text: "Review each line, fix any misheard words, and nudge start or end times where the auto-detected timing needs a small adjustment." },
      { name: "Style your captions", text: "Choose the font, size, color, and position so the captions sit cleanly on the frame." },
      { name: "Export the video or .srt", text: "Export the video with captions burned in, or download the transcript as an .srt subtitle file. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is this auto-caption tool free to use?",
      answer:
        "Yes, it’s 100% free with no account, no watermark, and no export limits. You only download the speech-recognition model once; there’s nothing to pay and no subscription.",
    },
    {
      question: "Is my audio uploaded to a server for transcription?",
      answer:
        "No. The Whisper speech-recognition model runs entirely in your browser, so your audio stays on your device. The only thing downloaded is the model file — your video and its sound are never sent anywhere.",
    },
    {
      question: "How accurate are the automatic captions?",
      answer:
        "Accuracy depends on how clear the audio is and the language spoken. It’s strong on clean speech, but auto-detected words and timings can need small edits — every caption line stays fully editable so you can correct them quickly.",
    },
    {
      question: "What device and browser do I need?",
      answer:
        "It works best on desktop Chrome or Edge, which support WebGPU for fast, on-device transcription. Without WebGPU it falls back to a slower CPU mode, so a modern computer is recommended over a phone.",
    },
    {
      question: "Can I export the captions as a subtitle file?",
      answer:
        "Yes. Alongside burning captions into the video, you can download the transcript as a standard .srt file to upload to YouTube or attach to other players as separate subtitles.",
    },
  ],
  tips: [
    "The model downloads once (a few hundred MB) and is cached, so later videos caption much faster.",
    "Record or export with clear audio and minimal background noise for the most accurate transcription.",
    "Read through the generated lines before exporting — a quick pass to fix names and jargon makes a big difference.",
    "Keep captions in the lower third and add a subtle background or outline so text stays readable on busy footage.",
    "Export an .srt if you plan to upload to YouTube, so viewers can toggle subtitles on or off.",
  ],
  related: ["add-text-to-video", "trim-video", "extract-audio-from-video", "add-music-to-video"],
};

export default content;
