import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "blur-image",
  intro:
    "To blur or censor part of a photo for free without uploading it, open Klipzo's blur tool, drag the box over the face or detail you want to hide, choose Blur or Pixelate, and apply. You can repeat it for as many spots as you need, then export. Everything runs in your browser, so the photo and whatever you are hiding never leave your device.",
  body:
    "Blurring is how you protect what should not be public: faces, kids, house numbers, license plates, ID cards, screens, and anything else in the background you did not mean to share. Klipzo lets you drag a box over each area and either soften it with a gaussian blur or break it into blocks with a pixelate (mosaic) effect, then bakes that change into the image. Turn the strength up for a stronger, unrecoverable censor. Because it all happens on Canvas in your browser, the sensitive area is never uploaded to anyone, and the export carries no watermark. This is the private way to redact a photo before you post it.",
  howTo: {
    title: "How to blur or censor part of a photo",
    description:
      "Blur or pixelate faces and sensitive details in an image, in your browser, with no upload.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the blur tool",
        text: "Go to Klipzo and drag your photo in, or click to browse. It loads on your device and is never uploaded.",
      },
      {
        name: "Position the box",
        text: "Drag the box over the face or detail you want to hide, and resize it with the corner handles.",
      },
      {
        name: "Choose blur or pixelate",
        text: "Pick Blur for a soft smear or Pixelate for a blocky mosaic, and set the strength.",
      },
      {
        name: "Apply, then repeat",
        text: "Click Apply to bake it in. Move the box to the next spot and apply again for each area.",
      },
      {
        name: "Export and download",
        text: "Click Export to save a PNG, JPEG, or WebP with the censored areas flattened in. No sign-up, no watermark.",
      },
    ],
  },
  faqs: [
    {
      question: "Is blurring a photo free?",
      answer:
        "Yes. It costs nothing, needs no account, and never adds a watermark. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my photo get uploaded to blur it?",
      answer:
        "No. The blur and pixelate effects are applied in your browser with the Canvas API, so the image, and whatever you are hiding, stay entirely on your device.",
    },
    {
      question: "Can someone reverse the blur later?",
      answer:
        "Once you apply it, the effect is baked into the pixels, so there is no hidden original underneath. Use a high strength, and pixelate for the strongest censor, when hiding something truly sensitive.",
    },
    {
      question: "Can I blur more than one thing?",
      answer:
        "Yes. Apply the box, move it to the next face or detail, and apply again. There is no limit to how many areas you can censor.",
    },
  ],
  tips: [
    "Pixelate at a high strength is the hardest to reverse; use it for faces, IDs, and license plates.",
    "Make the box a little larger than the detail so nothing peeks out around the edges.",
    "Apply bakes the effect in, so if you go too far just undo and try a lower strength.",
    "Check the background too; reflections, screens, and documents often reveal more than the main subject.",
    "Export as JPG or WebP to keep the file small once everything sensitive is hidden.",
  ],
  related: ["add-text-to-photo", "crop-image", "circle-crop", "resize-image"],
};

export default content;
