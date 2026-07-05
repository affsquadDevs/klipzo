import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "add-text-to-video",
  intro:
    "To add text or captions to a video for free, open Klipzo, drop in a text layer, then position it, time when it appears and disappears, and style the font, size, and color before exporting. It all runs on your device in the browser using WebCodecs and Mediabunny, so your video is never uploaded, there’s no account, and there’s no watermark.",
  body:
    "On-screen text is what makes short videos work without sound — titles hook viewers, captions carry the message, and a small watermark keeps your work yours. Klipzo lets you place each text block exactly where you want it, set the seconds it stays on screen, and dial in the font, size, and color so it reads clearly against your footage. You can stack multiple overlays for lower-thirds, opening titles, and end cards on the same clip. Rendering happens locally, so nothing leaves your device, and heavier exports run fastest in desktop Chrome or Edge with a progress bar you can cancel.",
  howTo: {
    title: "How to add text to a video online",
    description: "Overlay titles, captions, and watermarks on any video in your browser, with nothing uploaded.",
    totalTime: "PT3M",
    steps: [
      { name: "Import your video", text: "Open Klipzo and drag your clip in, or click to browse. It loads on your device instantly — no upload." },
      { name: "Add a text layer", text: "Click Add Text and type your title, caption, or watermark. A movable text box appears over the video." },
      { name: "Position it", text: "Drag the text where you want it — a centered title, a lower-third caption, or a corner watermark." },
      { name: "Set the timing", text: "Choose when the text appears and disappears on the timeline so it shows only during the right moments." },
      { name: "Style the text", text: "Pick the font, size, and color, and adjust it until it reads clearly against your footage." },
      { name: "Export the video", text: "Click Export to render the video with your text burned in on your device, then download it." },
    ],
  },
  faqs: [
    {
      question: "Is adding text to video free with Klipzo?",
      answer:
        "Yes, adding titles, captions, and watermarks is completely free — no sign-up, no watermark of ours on your export, and no limits on how many clips you caption.",
    },
    {
      question: "Does my video get uploaded when I add captions?",
      answer:
        "No. The text is composited onto your video right in the browser, so the footage stays on your device and is never sent to any server. That keeps your project private.",
    },
    {
      question: "Can I control when each caption appears and disappears?",
      answer:
        "Yes. Every text layer has its own start and end time on the timeline, so you can sync titles, lower-thirds, and end cards to the exact moments you want.",
    },
    {
      question: "Can I change the font, size, and color of the text?",
      answer:
        "Yes. You can set the font, adjust the size, and pick a color for each text block so your captions stay readable over any background.",
    },
    {
      question: "Is the text permanently added to the video?",
      answer:
        "The text is burned into the exported file, so it plays on any device without needing a separate caption track. Keep your original video if you want to re-edit the wording later.",
    },
  ],
  tips: [
    "Use a bold font with a contrasting color so captions stay readable against busy or bright footage.",
    "Keep on-screen text short — a few words per line reads faster than a full sentence.",
    "Place captions in the lower third and titles up top so nothing overlaps the main subject.",
    "Add a small corner watermark to protect clips you plan to post on social platforms.",
    "For long clips with lots of text layers, export in desktop Chrome or Edge for the fastest rendering.",
  ],
  related: ["trim-video", "crop-video", "resize-video-for-instagram", "video-to-gif"],
};

export default content;
