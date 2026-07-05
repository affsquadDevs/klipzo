import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "jpg-to-png",
  intro:
    "To convert a JPG to PNG for free, open Klipzo’s editor, load your JPG, choose PNG as the output format, and export. The conversion runs in your browser on your device, so your file is never uploaded, no account is needed, and there’s no watermark. PNG output is lossless, so no further quality is thrown away when you re-save.",
  body:
    "Converting JPG to PNG gives you a lossless file that won’t degrade further each time it’s edited and saved — handy when you plan to layer edits, add text, or hand the image to a tool that prefers PNG. PNG also supports transparency, so it’s the right container if you’ll later cut out a background. Note that converting can’t recover detail a JPG already discarded; the PNG simply preserves whatever the JPG contains without adding new compression. Klipzo does this entirely on your device with Canvas, so the file stays private and the export is instant.",
  howTo: {
    title: "How to convert JPG to PNG online",
    description: "Turn a JPG into a lossless PNG in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drop your JPG in, or click to browse. It loads on your device with no upload." },
      { name: "Open the Convert tool", text: "Select Convert from the tool rail and set the output format to PNG." },
      { name: "Confirm PNG settings", text: "PNG is lossless, so there’s no quality slider to set — the tool preserves the current pixels as-is." },
      { name: "Preview the image", text: "Check the preview to make sure the image looks right before exporting." },
      { name: "Export as PNG", text: "Click Export to download the PNG. No sign-up and no watermark are added." },
    ],
  },
  faqs: [
    {
      question: "Is the JPG to PNG converter free?",
      answer:
        "Yes — it’s free to use with no account, no watermark, and no cap on how many files you convert. The converter is fully unlocked.",
    },
    {
      question: "Is my JPG uploaded to a server?",
      answer:
        "It isn’t. Klipzo re-encodes the JPG to PNG locally in your browser, so the image never leaves your device. Local processing is also why the export is instant.",
    },
    {
      question: "Is PNG conversion lossless?",
      answer:
        "The PNG output itself is lossless, meaning no additional compression is applied when saving. It faithfully preserves the pixels from your JPG rather than degrading them further.",
    },
    {
      question: "Will converting to PNG improve my image quality?",
      answer:
        "No. Any detail a JPG already lost to compression can’t be restored by converting. PNG keeps the current quality intact but doesn’t add back what was discarded.",
    },
    {
      question: "Does the resulting PNG support transparency?",
      answer:
        "PNG as a format supports transparency, but a JPG has none to carry over, so the converted file starts fully opaque. You can add transparency later with a background-removal step.",
    },
  ],
  tips: [
    "Convert to PNG before making layered edits so repeated saves don’t stack up JPG compression artifacts.",
    "PNG files from photos are larger than the JPG — expect a bigger file when you switch.",
    "Choose PNG when a design tool, printer, or platform specifically requires a lossless format.",
    "If you plan to remove the background next, PNG is the right container because it can store transparency.",
    "For sharing photos where size matters more than lossless quality, keep them as JPG or use WebP instead.",
  ],
  related: ["png-to-jpg", "convert-image", "remove-background", "webp-converter"],
};

export default content;
