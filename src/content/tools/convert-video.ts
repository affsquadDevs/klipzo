import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "convert-video",
  intro:
    "To convert a video between MP4 and WebM for free, open Klipzo, add your clip, pick the format you want out, and export. The conversion is encoded on your own device in the browser, so your file is never uploaded, you don't need an account, and the converted video downloads with no watermark.",
  body:
    "Converting swaps the container and codec so a clip plays where you need it: MP4 is the safe, universal choice for phones, editors, and social apps, while WebM is the lean, open format that keeps web pages light. Klipzo reads your source and re-encodes it locally through WebCodecs and Mediabunny, so a large file converts without any upload and stays entirely on your machine. A progress bar with a cancel button lets you stop a long conversion whenever you like, and Klipzo checks your browser first, falling back gracefully and telling you honestly if a specific format pair isn't supported where you are.",
  howTo: {
    title: "How to convert video formats online",
    description: "Convert a video between MP4 and WebM in your browser, with nothing uploaded.",
    totalTime: "PT3M",
    steps: [
      { name: "Add your video", text: "Open Klipzo and drop in your clip, or click to browse. Whatever the source format, it loads locally with no upload." },
      { name: "Open the Convert tool", text: "Choose Convert. Klipzo reads the source and shows which output formats are available in your browser." },
      { name: "Pick the output format", text: "Select MP4 for broad compatibility across phones and editors, or WebM for a smaller, web-friendly file." },
      { name: "Set quality options", text: "Optionally adjust resolution or quality so the converted file matches how you'll use it." },
      { name: "Preview the result", text: "Play back the loaded clip to confirm it's the one you want before starting the encode." },
      { name: "Export and download", text: "Click Export to convert on your device and download the new file. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Should I convert to MP4 or WebM?",
      answer:
        "Choose MP4 when you need the widest compatibility — phones, video editors, and most social platforms all accept it. Choose WebM when you're embedding on a website and want a smaller, open-format file that loads faster.",
    },
    {
      question: "Is my file uploaded during conversion?",
      answer:
        "No. The whole conversion is encoded in your browser on your own hardware, so the clip never reaches a server. That keeps private videos private and avoids any upload-size limits.",
    },
    {
      question: "Does converting reduce quality?",
      answer:
        "Any re-encode can change quality slightly, but Klipzo lets you keep the resolution and set a high-quality level so the difference stays minimal. You can preview and adjust before exporting to strike the balance you want.",
    },
    {
      question: "Which browser handles conversion best?",
      answer:
        "Conversion is fastest in desktop Chrome or Edge because of WebCodecs hardware acceleration. Klipzo detects your browser's capabilities, falls back to MediaRecorder or ffmpeg.wasm when needed, and tells you plainly if a particular format pair isn't supported.",
    },
    {
      question: "Is the video converter free?",
      answer:
        "Yes, it's free to convert and download with no account and no watermark. The site is funded by ads on its guide pages rather than by charging for conversions.",
    },
  ],
  tips: [
    "Pick MP4 when you're unsure where the file will be played — it's the most universally accepted format.",
    "Use WebM for website backgrounds and hero videos to keep the page lightweight and fast.",
    "Keep the source resolution during conversion unless you specifically need a smaller frame size.",
    "Convert large files in desktop Chrome or Edge and leave the tab focused for the quickest encode.",
  ],
  related: ["mp4-to-webm", "compress-video", "trim-video", "video-to-gif"],
};

export default content;
