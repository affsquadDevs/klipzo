import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "speed-up-video",
  intro:
    "To speed up or slow down a video for free, open Klipzo’s editor, select your clip, and set a speed from 0.25x up to 4x. It all runs in your browser on your device — nothing is uploaded, there’s no account, and no watermark.",
  body:
    "Speed is a per-clip setting, so you can make one section a fast timelapse and leave the rest at normal pace. Changing the speed also changes how long the clip is on the timeline: a 2x clip takes half the time, a 0.5x clip takes twice as long, and everything after it shifts to stay in sync. Crucially, Klipzo preserves audio pitch using on-device time-stretching, so faster playback doesn’t give you a chipmunk voice and slow motion doesn’t sound like a growl. It’s ideal for building hyperlapses, adding dramatic slow-mo, or trimming a clip down to fit a strict time limit.",
  howTo: {
    title: "How to speed up or slow down a video online",
    description: "Change a clip’s playback speed from 0.25x to 4x in your browser, with nothing uploaded.",
    totalTime: "PT2M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your video in, or click to browse. It loads instantly on your device." },
      { name: "Select the clip", text: "Click the clip on the timeline that you want to speed up or slow down." },
      { name: "Open the Speed control", text: "Choose Speed from the rail to reveal the speed slider and presets." },
      { name: "Set the speed", text: "Pick a value from 0.25x for slow motion up to 4x for a fast timelapse. The clip’s length on the timeline updates to match." },
      { name: "Preview the result", text: "Play it back — the audio pitch stays natural at any speed, so voices don’t sound sped-up or distorted." },
      { name: "Export the video", text: "Export your clip at the new speed. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is this speed changer free?",
      answer:
        "Yes, it’s entirely free — no account, no watermark, and no export caps. The speed change happens in your browser, so there’s nothing to buy.",
    },
    {
      question: "Is my video uploaded to change its speed?",
      answer:
        "No. Klipzo re-times your clip locally on your device, so your footage never leaves your computer and nothing is sent to a server.",
    },
    {
      question: "Will speeding up my video make voices sound high-pitched?",
      answer:
        "No. Klipzo preserves the audio pitch with on-device time-stretching, so speech and music stay natural whether you speed the clip up or slow it down — no chipmunk or slowed-down effect.",
    },
    {
      question: "How fast or slow can I go?",
      answer:
        "You can set any clip from 0.25x (four times slower) up to 4x (four times faster). It’s a per-clip control, so different parts of your timeline can run at different speeds.",
    },
    {
      question: "Does changing speed shorten my video?",
      answer:
        "Yes. Speeding a clip up makes it shorter on the timeline and slowing it down makes it longer, and the clips after it shift automatically to stay in order.",
    },
  ],
  tips: [
    "Use 2x–4x to turn long, static footage into a quick timelapse or hyperlapse.",
    "Drop a clip to 0.25x–0.5x to add slow-motion emphasis on a key moment.",
    "Need to hit a time limit? Nudge the speed up slightly to fit a strict duration without cutting content.",
    "Speed different sections separately — fast through the boring parts, normal speed for the payoff.",
    "Trim first, then set speed, so you’re only re-timing the footage you actually keep.",
  ],
  related: ["trim-video", "add-music-to-video", "crop-video", "video-to-gif"],
};

export default content;
