import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "merge-video",
  intro:
    "To merge videos for free without uploading them, open Klipzo's merge tool and drop in all your clips at once. They line up on the timeline in order; drag to rearrange them, then export one combined video. It all runs in your browser, so your footage never leaves your device, with no account and no watermark.",
  body:
    "Joining clips is how you turn separate takes into a single story: stitch together a few phone videos, add an intro and outro, or compile highlights into one file. Klipzo puts every clip you add on a timeline, so you can reorder them, trim each one, and add a crossfade or dip-to-black between them for a smoother cut. You can also drop in text, captions, or a music track that plays across the whole thing. Because export runs on your device with WebCodecs, large clips do not wait in an upload queue, nothing leaves your machine, and the finished video has no branding of ours.",
  howTo: {
    title: "How to merge videos online",
    description:
      "Join multiple clips into one video in your browser, reorder them on a timeline, and export.",
    totalTime: "PT3M",
    steps: [
      {
        name: "Open the merge tool",
        text: "Go to Klipzo and drop in your clips. You can select several at once, and they all load on your device.",
      },
      {
        name: "Add more clips",
        text: "Use Add clip to bring in any additional videos. Each one appears as a segment on the timeline.",
      },
      {
        name: "Reorder and trim",
        text: "Drag clips to change their order and trim the start or end of each so they flow together.",
      },
      {
        name: "Add transitions (optional)",
        text: "Drop a crossfade or dip-to-black between clips, and add text or a music track if you want.",
      },
      {
        name: "Export the combined video",
        text: "Click Export to save one MP4 or WebM with every clip joined. No sign-up, no watermark.",
      },
    ],
  },
  faqs: [
    {
      question: "Is merging videos free?",
      answer:
        "Yes. It costs nothing, needs no account, and never adds a watermark. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Are my clips uploaded to join them?",
      answer:
        "No. All the clips are combined in your browser with WebCodecs, so your footage stays entirely on your device.",
    },
    {
      question: "Can I merge clips that are different sizes or formats?",
      answer:
        "Yes. Klipzo renders every clip to one consistent output frame on export, so mixed resolutions and formats combine into a single clean video.",
    },
    {
      question: "How many clips can I merge?",
      answer:
        "There is no server-side limit because nothing is uploaded. The practical limit is your device's memory; desktop Chrome or Edge handle long timelines best.",
    },
  ],
  tips: [
    "Drop all your clips in at once to save time; they queue up on the timeline in the order you add them.",
    "A short crossfade or dip-to-black between clips hides hard cuts and makes the join look intentional.",
    "Trim the dead air off the start and end of each clip before exporting so the final video stays tight.",
    "Add one music track over the whole timeline rather than per clip for a consistent soundtrack.",
    "For social, set the output aspect ratio first so every clip is framed the same way.",
  ],
  related: ["trim-video", "add-music-to-video", "add-text-to-video", "resize-video-for-instagram"],
};

export default content;
