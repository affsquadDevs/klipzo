import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "add-text-to-photo",
  intro:
    "To add text to a photo for free without uploading it, open Klipzo, load your image, add a text layer, and type your caption, title, or watermark. You can set the font, size, and color, add an outline or shadow, align it, and drag it into place. It all runs in your browser, so your photo stays on your device with no account and no watermark.",
  body:
    "Text is what turns a plain photo into a quote graphic, a meme, a titled thumbnail, or a subtly watermarked image you can share safely. Klipzo gives you full control over each text layer: choose a font and size, pick any color, add a contrasting outline (stroke) or a drop shadow so the words stay readable over a busy background, and set left, center, or right alignment. Drag the text anywhere on the frame to position it exactly. Because rendering happens on Canvas at the image's real resolution, your text stays crisp at full size, nothing is uploaded, and the export carries no branding of ours.",
  howTo: {
    title: "How to add text to a photo online",
    description: "Add a caption, title, or watermark with full font, color, outline, and shadow control in your browser.",
    totalTime: "PT2M",
    steps: [
      { name: "Open the editor", text: "Go to Klipzo and drag your photo in, or click to browse. It loads instantly and never leaves your device." },
      { name: "Add a text layer", text: "Select the Text tool and click Add text. An editable text box appears on your image." },
      { name: "Type and style it", text: "Type your words, then choose a font, size, and color. Adjust alignment to left, center, or right." },
      { name: "Add outline or shadow", text: "Turn on a stroke outline or a drop shadow so the text stays legible over bright or busy areas of the photo." },
      { name: "Drag into position", text: "Move the text box anywhere on the frame and fine-tune its size until the placement looks right." },
      { name: "Export and download", text: "Click Export to save a PNG, JPEG, or WebP with the text flattened in. No sign-up, no watermark." },
    ],
  },
  faqs: [
    {
      question: "Is adding text to a photo free?",
      answer:
        "Yes. It costs nothing, needs no account, and adds no watermark of ours to your image. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my photo get uploaded when I add a caption?",
      answer:
        "No. The text is drawn onto your image in the browser with the Canvas API, so the photo and your words stay entirely on your device.",
    },
    {
      question: "Can I make the text readable over a busy or bright background?",
      answer:
        "Yes. Add a contrasting outline (stroke) or a drop shadow, and the words stay legible even over a light or cluttered part of the photo.",
    },
    {
      question: "Can I add more than one line or block of text?",
      answer:
        "Yes. Add multiple text layers, each with its own font, size, color, and position, so you can set a title and a caption separately.",
    },
    {
      question: "Will the text stay sharp when I save?",
      answer:
        "Yes. Text is rendered at the image's full resolution, so it exports crisp. Choose PNG for the cleanest edges or JPEG/WebP with a quality slider.",
    },
  ],
  tips: [
    "Use a white fill with a thin black outline (or the reverse) to keep captions readable on almost any background.",
    "For a discreet watermark, lower the text opacity and place it near a corner so it protects the image without dominating it.",
    "Add a soft drop shadow to lift a title off a photo and give it depth.",
    "Keep titles short and large; long paragraphs shrink and get lost on small screens.",
    "Crop or resize the photo to your final dimensions first, then add text so it sits correctly on the exported frame.",
  ],
  related: ["crop-image", "resize-image", "add-text-to-video", "rotate-image"],
};

export default content;
