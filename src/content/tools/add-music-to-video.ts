import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "add-music-to-video",
  intro:
    "To add music to a video for free, open Klipzo’s editor, import your clip, and drop in an audio file as a background music track. Everything is mixed on your device — nothing is uploaded, there’s no account, and no watermark on the final video.",
  body:
    "Klipzo lets you layer a background music track over your footage, or record a voiceover with your microphone straight into the project — and that recording is captured locally and never uploaded. Each track has its own volume so you can balance the music against the video’s original audio, plus a fade-out so the song ends gracefully instead of cutting off. The music is automatically clipped to the length of your video, and per-clip volume gives you finer control over the source audio. When you export, Klipzo mixes the music and the video’s own sound together on your device into one file.",
  howTo: {
    title: "How to add music to a video online",
    description: "Add a background music track or voiceover and mix it in your browser, with nothing uploaded.",
    totalTime: "PT3M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drag your video in, or click to browse. It loads instantly on your device." },
      { name: "Open the Audio tool", text: "Select Audio from the rail to work with music and voiceover tracks." },
      { name: "Add music or record a voiceover", text: "Import a music file to add a background track, or record a voiceover with your microphone — the recording is captured locally on your device." },
      { name: "Balance the volume", text: "Set the volume for the music track and adjust per-clip volume so the song sits under your original audio, not over it." },
      { name: "Add a fade-out", text: "Apply a fade-out so the music tapers off smoothly at the end. The track is clipped to your video’s length automatically." },
      { name: "Export the video", text: "Export to mix the music and your video’s audio into one file on your device. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is adding music to a video free here?",
      answer:
        "Yes — it’s free with no account, no watermark, and no export limits. Klipzo mixes the audio in your browser, so there’s nothing to pay for.",
    },
    {
      question: "Is my video or music file uploaded to add the track?",
      answer:
        "No. Your video, your music file, and any voiceover you record all stay on your device. The mixing happens locally in your browser, so nothing is sent to a server.",
    },
    {
      question: "Can I keep the video’s original sound and add music too?",
      answer:
        "Yes. The music sits on its own track and is mixed with the video’s existing audio at export. Use per-track and per-clip volume to balance the two.",
    },
    {
      question: "Can I record a voiceover instead of adding a music file?",
      answer:
        "Yes. You can record a voiceover with your microphone directly in the editor. The recording is captured locally and never uploaded, just like your other media.",
    },
    {
      question: "What if the song is longer than my video?",
      answer:
        "The music is automatically clipped to the length of your video, so it won’t run past the end. Add a fade-out to make the ending sound smooth rather than abrupt.",
    },
  ],
  tips: [
    "Lower the music volume so it sits under narration or dialogue instead of drowning it out.",
    "Add a fade-out on the music track so the song doesn’t stop abruptly when the video ends.",
    "Recording a voiceover? Do it in a quiet room and keep the mic close for clean audio.",
    "Use per-clip volume to duck the original audio during moments where the music should take over.",
    "Trim your video to its final length first, since the music track is clipped to match it.",
  ],
  related: ["extract-audio-from-video", "trim-video", "add-text-to-video", "auto-caption-video"],
};

export default content;
