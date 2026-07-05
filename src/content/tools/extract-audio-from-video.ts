import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "extract-audio-from-video",
  intro:
    "To extract the audio from a video for free, open Klipzo, load your clip, choose MP3 or WAV, and export just the sound. The whole process runs on your device in the browser using WebCodecs and Mediabunny, so your video is never uploaded, no account is required, and there’s no watermark.",
  body:
    "Pulling the audio track out of a video is the quickest way to grab a voiceover, capture a song or interview, or feed a podcast clip into a transcription tool. Klipzo decodes the video’s audio stream locally and re-encodes it to a standalone file — pick MP3 when you want a small, universally playable file, or WAV when you need uncompressed audio for editing. Because nothing leaves your device, even a long recording extracts privately and quickly, with heavy files handled fastest in desktop Chrome or Edge. A progress bar keeps you informed on longer clips and can be canceled anytime.",
  howTo: {
    title: "How to extract audio from a video online",
    description: "Save the sound from any video as an MP3 or WAV file in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Load your video", text: "Open Klipzo and drag in the video file, or click to browse. It loads on your device instantly with no upload." },
      { name: "Open the extract-audio tool", text: "Choose the Extract Audio option. Klipzo reads the audio track already inside your video." },
      { name: "Pick a format", text: "Select MP3 for a small, shareable file or WAV for uncompressed, edit-ready audio." },
      { name: "Trim if needed", text: "Optionally set a start and end point to save only the part of the audio you actually want." },
      { name: "Export the audio", text: "Click Export to render the audio file on your device, then download the MP3 or WAV." },
    ],
  },
  faqs: [
    {
      question: "Is extracting audio from video free on Klipzo?",
      answer:
        "Yes, it’s free with no account and no watermark. You can pull the audio out of as many videos as you want, with no export limits.",
    },
    {
      question: "Is my video sent anywhere when I extract the audio?",
      answer:
        "No. Klipzo reads and re-encodes the audio entirely in your browser, so the video never leaves your device and nothing is uploaded to a server. Your recording stays private.",
    },
    {
      question: "Should I choose MP3 or WAV?",
      answer:
        "Choose MP3 for a small file that plays everywhere and is easy to share. Choose WAV when you need lossless, uncompressed audio for further editing, mastering, or archiving.",
    },
    {
      question: "Can I extract only part of the audio?",
      answer:
        "Yes. Set a start and end point before exporting and Klipzo will save just that section, which is handy for grabbing a single quote, chorus, or clip from a longer recording.",
    },
    {
      question: "Does extracting audio re-record or reduce the quality?",
      answer:
        "The audio is decoded from your video and re-encoded to the format you pick. WAV keeps it lossless; MP3 uses a high-quality compressed setting that sounds clean for speech and music while keeping the file small.",
    },
  ],
  tips: [
    "Use WAV when you plan to edit or clean up the audio later, then export a final MP3 once you’re done.",
    "Trim to the exact section you need before exporting to keep the file small and skip silent intros.",
    "MP3 is the safest choice for sharing — it plays on virtually every phone, browser, and player.",
    "For long recordings, run the export in desktop Chrome or Edge for the fastest local processing.",
    "Extracting audio strips the video, so keep your original file if you might still need the picture.",
  ],
  related: ["convert-video", "trim-video", "compress-video", "add-text-to-video"],
};

export default content;
