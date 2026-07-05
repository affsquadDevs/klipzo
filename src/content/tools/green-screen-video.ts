import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "green-screen-video",
  intro:
    "To remove a green screen from a video for free, open Klipzo’s editor, add your clip, and apply the chroma key effect in the Effects tool — pick the green (or blue) backdrop color and it becomes transparent. Everything runs in your browser on your device, with no upload, no account, and no watermark.",
  body:
    "Chroma keying isolates a subject filmed against a solid backdrop by keying out one color and making it see-through. Klipzo’s chroma key is a per-clip effect with the controls that matter: similarity, which sets how close a pixel must be to the key color to be removed; smoothness (feathering) for clean edges; and spill removal to cut the green tint that bounces onto your subject. On a single video track, keyed areas turn black or transparent, which is ideal for cutting out a person or product shot on a solid green or blue background. The keying is computed on-device with WebGL, so it stays fast and private.",
  howTo: {
    title: "How to remove a green screen from a video online",
    description: "Chroma key out a green or blue backdrop in your browser, with nothing uploaded.",
    totalTime: "PT3M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your green-screen clip in, or click to browse. It loads instantly on your device." },
      { name: "Select the clip and open Effects", text: "Click the clip on the timeline, then open the Effects tool from the rail." },
      { name: "Add chroma key and pick the color", text: "Apply the chroma key effect and choose the backdrop color — green or blue — that you want to make transparent." },
      { name: "Tune similarity and smoothness", text: "Adjust similarity so the whole backdrop keys out, then raise smoothness to soften and clean up the edges." },
      { name: "Remove spill", text: "Turn up spill removal to strip any leftover green or blue tint bouncing onto your subject." },
      { name: "Export the video", text: "Export your clip with the background keyed out. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is the green screen remover free?",
      answer:
        "Yes — it’s completely free with no account, no watermark, and no limits. Klipzo runs the chroma key right in your browser, so there’s nothing to install or pay for.",
    },
    {
      question: "Does my video get uploaded to remove the background?",
      answer:
        "No. The chroma key is computed on your own device with WebGL, so your footage never leaves your computer and there’s no server processing your video.",
    },
    {
      question: "Can I key out a blue screen too, not just green?",
      answer:
        "Yes. You choose the key color, so blue-screen footage works the same way as green. Pick whichever color your backdrop actually is for the cleanest result.",
    },
    {
      question: "The edges look rough — how do I fix them?",
      answer:
        "Increase the smoothness (feather) control to soften edges and use spill removal to cut color that bled onto the subject. Even, well-lit backdrops key far more cleanly than shadowed or wrinkled ones.",
    },
    {
      question: "What happens to the area I key out?",
      answer:
        "On a single video track the keyed color becomes transparent, showing through as black or empty, which is perfect for isolating a subject shot against a solid backdrop.",
    },
  ],
  tips: [
    "Shoot against an evenly lit, wrinkle-free backdrop — good lighting makes keying dramatically cleaner.",
    "Start with similarity low and raise it slowly until the whole backdrop disappears without eating into your subject.",
    "Always apply spill removal on green screens to kill the green tint on hair and shoulders.",
    "Keep your subject a step or two away from the backdrop to avoid casting shadows that are hard to key.",
    "Choose a key color that isn’t in your subject’s clothing, or that part will vanish too.",
  ],
  related: ["add-text-to-video", "crop-video", "trim-video", "add-music-to-video"],
};

export default content;
