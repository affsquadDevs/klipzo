import type { ToolContent } from "../toolTypes";

const content: ToolContent = {
  slug: "remove-exif",
  intro:
    "To remove EXIF metadata from a photo for free, open Klipzo and drop your image in, then open the EXIF panel. It shows the hidden data your camera or phone saved, including the model, the date, and often your GPS location. Click Export and Klipzo saves a clean copy with all of that stripped out. It runs in your browser, so the photo and its metadata never leave your device.",
  body:
    "Every photo your phone or camera takes carries invisible metadata: the device and lens, the exact date and time, camera settings, and frequently the GPS coordinates of where you were standing. That is fine for your own library, but it is a privacy risk the moment you post the image, since anyone can read it back out. Klipzo shows you exactly what is embedded, flags a GPS location if one is present, and removes all of it when you export, because re-encoding the image on Canvas produces a fresh file with no metadata attached. Nothing is uploaded, so the sensitive details are scrubbed entirely on your own machine.",
  howTo: {
    title: "How to remove EXIF metadata from a photo",
    description: "View and strip EXIF, GPS, and camera metadata from an image in your browser.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the EXIF tool",
        text: "Go to Klipzo and drag your photo in, or click to browse. It loads on your device and is never uploaded.",
      },
      {
        name: "Review the metadata",
        text: "Open the EXIF panel to see the camera, date, settings, and any GPS location saved in the file.",
      },
      {
        name: "Export a clean copy",
        text: "Click Export and save as JPEG, PNG, or WebP. The re-encoded file has all EXIF, GPS, and other metadata removed.",
      },
    ],
  },
  faqs: [
    {
      question: "Is removing EXIF data free?",
      answer:
        "Yes. It costs nothing, needs no account, and never adds a watermark. The tool is free; ads on the surrounding guides fund it.",
    },
    {
      question: "Does my photo get uploaded to strip its metadata?",
      answer:
        "No. The metadata is read and removed in your browser, so your image and everything it reveals stay entirely on your device.",
    },
    {
      question: "What metadata gets removed?",
      answer:
        "Exporting re-encodes the image, which drops all embedded metadata: EXIF (camera, lens, settings), the capture date, GPS location, and any editing-software tags. The visible pixels are unchanged.",
    },
    {
      question: "Why does my photo have GPS location in it?",
      answer:
        "Most phones geotag photos by default, saving the coordinates where each shot was taken. Klipzo flags this if it is present so you can strip it before sharing.",
    },
  ],
  tips: [
    "Check the EXIF panel before posting; a GPS tag can reveal your home or a private location.",
    "Any export format works to strip metadata, since re-encoding drops it; pick JPG or WebP for a smaller file.",
    "Screenshots usually have no camera metadata, but photos straight from a phone almost always do.",
    "If you only want to hide part of the picture rather than the metadata, use the blur tool instead.",
  ],
  related: ["blur-image", "compress-image", "convert-image", "resize-image"],
};

export default content;
