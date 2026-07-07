import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "mute-video",
  intro:
    "To mute a video for free without uploading it, open Klipzo's mute tool and drop your clip in. It opens already silenced, so all you have to do is export a muted copy. Everything runs in your browser, so the video never leaves your device, and there is no account and no watermark.",
  body:
    "Muting is the fastest way to strip distracting or copyrighted audio off a clip before you post it, add your own soundtrack, or drop it into a slideshow. Klipzo sets the clip's volume to zero the moment it loads, so the export carries no sound. Because it is the full video editor underneath, you can also trim the clip, change its speed, add captions, or layer in new music before you export. All of it happens on your device with WebCodecs, so nothing is uploaded and the result has no branding of ours.",
  howTo: {
    title: "How to mute a video online",
    description: "Silence a video's audio in your browser and export a muted copy, with no upload.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the mute tool",
        text: "Go to Klipzo and drag your video in, or click to browse. It loads on your device and is never uploaded.",
      },
      {
        name: "It opens muted",
        text: "The clip's volume is set to zero automatically, so the audio is already off. You can confirm it in the clip panel.",
      },
      {
        name: "Adjust if you want",
        text: "Optionally trim the clip, change its speed, or add your own music or captions before exporting.",
      },
      {
        name: "Export the muted video",
        text: "Click Export to save a silent MP4 or WebM. No sign-up, no watermark.",
      },
    ],
  },
  faqs: [
    {
      question: "Is muting a video free?",
      answer:
        "Yes. It costs nothing, needs no account, and never adds a watermark. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my video get uploaded to mute it?",
      answer:
        "No. The clip is processed in your browser with WebCodecs, so it and its audio stay entirely on your device.",
    },
    {
      question: "Can I add my own music after muting?",
      answer:
        "Yes. Once the original audio is off, use the audio panel to add a music track or record a voiceover, all mixed on your device.",
    },
    {
      question: "Will the exported file still have an audio track?",
      answer:
        "The exported video is silent. If you want to keep it small, muting removes the sound so there is nothing distracting to hear.",
    },
  ],
  tips: [
    "Mute is per clip, so if you split the video you can silence just one part and keep sound on the rest.",
    "Muting pairs well with adding a fresh soundtrack: strip the original audio first, then drop in music at the volume you want.",
    "Silent autoplay is the norm on social feeds, so mute plus burned-in captions is a reliable combo.",
    "Trim before you export to keep only the section you actually need.",
  ],
  related: ["add-music-to-video", "trim-video", "extract-audio-from-video", "auto-caption-video"],
};

export default content;
