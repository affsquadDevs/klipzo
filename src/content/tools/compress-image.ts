import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "compress-image",
  intro:
    "To compress an image for free, open Klipzo’s editor, choose Compress, drag the quality slider until the file is small enough, and export. Everything runs on your device in the browser, so your photo is never uploaded, there’s no account, and there’s no watermark. Watch the estimated file size update live as you adjust.",
  body:
    "Compression shrinks a photo’s file size by re-encoding it, which is what you want for faster-loading web pages, smaller email attachments, and staying under upload limits. Klipzo lets you re-encode JPEG, PNG, and WebP with a quality slider, and shows an estimated output size so you can trade a little visual detail for a much lighter file. For photographs, JPEG and WebP compress dramatically; WebP usually wins on size at the same quality. Because the encoding happens on your own device, there’s no queue and no waiting on a server round-trip.",
  howTo: {
    title: "How to compress an image online",
    description: "Reduce a photo’s file size with a quality slider in your browser, with nothing uploaded.",
    totalTime: "PT1M",
    steps: [
      { name: "Open the editor", text: "Go to the Klipzo editor and drop your image in, or click to browse. It opens locally with no upload." },
      { name: "Choose Compress", text: "Select the Compress tool from the rail. The current estimated file size appears." },
      { name: "Drag the quality slider", text: "Lower the quality to shrink the file. The estimated output size updates live as you move the slider." },
      { name: "Pick an output format", text: "Choose JPEG or WebP for photos to get the smallest files; WebP is usually smallest at the same quality." },
      { name: "Check the preview", text: "Zoom in to confirm the compressed image still looks clean before you commit." },
      { name: "Export the smaller file", text: "Click Export to download the compressed image. No sign-up and no watermark are added." },
    ],
  },
  faqs: [
    {
      question: "Is the image compressor free to use?",
      answer:
        "It is — there’s no charge, no sign-up, and no watermark on the output. You can compress as many images as you like at no cost.",
    },
    {
      question: "Do my photos get uploaded to compress them?",
      answer:
        "Never. The re-encoding runs directly in your browser on your device, so the image is not sent anywhere. That’s also why it finishes instantly.",
    },
    {
      question: "Which format compresses best?",
      answer:
        "For photographs, WebP typically produces the smallest file at a given quality, followed by JPEG. PNG stays larger because it’s lossless, so switch photos to JPEG or WebP for the biggest savings.",
    },
    {
      question: "Does compressing reduce image quality?",
      answer:
        "Lossy formats like JPEG and WebP discard some detail to save space, so very low quality settings can show artifacts. Use the live preview and estimated size to find a balance that stays visually clean.",
    },
    {
      question: "Will compressing remove my photo’s metadata?",
      answer:
        "Yes. Klipzo strips EXIF data such as GPS location and camera model on export by default, so the smaller file also carries less hidden personal information.",
    },
  ],
  tips: [
    "Aim for a quality around 70–80% — it usually cuts file size a lot while staying visually indistinguishable.",
    "Resize the dimensions down first; fewer pixels compress to a much smaller file than quality changes alone.",
    "Convert screenshots and photos from PNG to JPEG or WebP before compressing for far bigger savings.",
    "Keep logos and graphics with sharp edges or transparency as PNG — lossy compression blurs their crisp lines.",
    "Zoom to 100% and check skies and skin tones, where JPEG artifacts show up first.",
  ],
  related: ["resize-image", "convert-image", "png-to-jpg", "webp-converter"],
};

export default content;
