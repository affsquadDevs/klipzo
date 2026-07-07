/**
 * The tool catalog — the hub-and-spoke backbone (§6). Each entry is a real editor
 * preset AND a landing page. Used by nav, footer, internal linking, sitemap, and the
 * dynamically-generated tool pages. Every `editorPreset` deep-links into /editor.
 *
 * Anti-thin-content rule (§6.1): each tool must be genuinely distinct and map to a
 * real editor mode — no spun near-duplicates.
 */
export type ToolKind = "photo" | "video";

export interface Tool {
  /** URL slug and page route: /{slug} */
  slug: string;
  kind: ToolKind;
  /** Nav / card label. */
  label: string;
  /** H1 on the landing page. */
  h1: string;
  /** <title> (brand appended automatically). */
  title: string;
  /** Meta description (unique per tool). */
  description: string;
  /** Editor deep-link preset key (?tool=…). */
  editorPreset: string;
  /** Short benefit line for cards. */
  tagline: string;
  /** v1 or phase-2 (phase-2 pages ship "coming soon" copy but still rank). */
  status: "v1" | "phase-2";
}

export const PHOTO_TOOLS: Tool[] = [
  {
    slug: "crop-image",
    kind: "photo",
    label: "Crop image",
    h1: "Crop an image online — free, in your browser",
    title: "Crop Image Online Free — No Upload, No Sign-up",
    description:
      "Crop photos to any size or aspect ratio right in your browser. Free, no account, and nothing is uploaded — your image never leaves your device.",
    editorPreset: "crop",
    tagline: "Trim to any ratio or exact pixel size.",
    status: "v1",
  },
  {
    slug: "resize-image",
    kind: "photo",
    label: "Resize image",
    h1: "Resize an image online — free and private",
    title: "Resize Image Online Free — Private, No Upload",
    description:
      "Resize photos by pixels or percentage without losing quality. 100% in-browser, no upload, no sign-up. Great for social, web, and email.",
    editorPreset: "resize",
    tagline: "Scale by pixels or percent, keep it sharp.",
    status: "v1",
  },
  {
    slug: "compress-image",
    kind: "photo",
    label: "Compress image",
    h1: "Compress an image online — smaller files, on your device",
    title: "Compress Image Online Free — On-Device, No Upload",
    description:
      "Shrink JPEG, PNG, and WebP file sizes with a live quality preview. Everything runs on your device — your photos are never uploaded.",
    editorPreset: "compress",
    tagline: "Hit a target size without the blur.",
    status: "v1",
  },
  {
    slug: "convert-image",
    kind: "photo",
    label: "Convert image",
    h1: "Convert image formats online — PNG, JPG, WebP",
    title: "Convert Image Online Free — PNG, JPG, WebP, No Upload",
    description:
      "Convert between PNG, JPG, and WebP in your browser. No upload, no sign-up, no watermark — conversion happens entirely on your device.",
    editorPreset: "convert",
    tagline: "PNG ⇄ JPG ⇄ WebP, instantly.",
    status: "v1",
  },
  {
    slug: "png-to-jpg",
    kind: "photo",
    label: "PNG to JPG",
    h1: "Convert PNG to JPG — free, no upload",
    title: "PNG to JPG Converter — Free, Private, No Upload",
    description:
      "Turn PNG images into smaller JPG files right in your browser. Pick a background for transparency and control quality. Nothing is uploaded.",
    editorPreset: "convert:jpg",
    tagline: "Flatten PNGs to compact JPGs.",
    status: "v1",
  },
  {
    slug: "jpg-to-png",
    kind: "photo",
    label: "JPG to PNG",
    h1: "Convert JPG to PNG — free, in your browser",
    title: "JPG to PNG Converter — Free, No Sign-up, No Upload",
    description:
      "Convert JPG photos to lossless PNG on your device. Free, private, and instant — your image never leaves your browser.",
    editorPreset: "convert:png",
    tagline: "Lossless PNG from any JPG.",
    status: "v1",
  },
  {
    slug: "webp-converter",
    kind: "photo",
    label: "WebP converter",
    h1: "WebP converter — to and from WebP, free",
    title: "WebP Converter Online — Free, Private, No Upload",
    description:
      "Convert images to WebP for smaller, faster web pages — or turn WebP back into PNG/JPG. Runs 100% in your browser with no upload.",
    editorPreset: "convert:webp",
    tagline: "Modern, lighter images for the web.",
    status: "v1",
  },
  {
    slug: "rotate-image",
    kind: "photo",
    label: "Rotate image",
    h1: "Rotate or flip an image online — free",
    title: "Rotate Image Online Free — No Upload, No Sign-up",
    description:
      "Rotate, flip, and straighten photos in your browser. Fix sideways phone photos in seconds. Private and free — nothing is uploaded.",
    editorPreset: "rotate",
    tagline: "Straighten and flip in seconds.",
    status: "v1",
  },
  {
    slug: "add-text-to-photo",
    kind: "photo",
    label: "Add text to photo",
    h1: "Add text to a photo online — free",
    title: "Add Text to Photo Online Free — Private, No Upload",
    description:
      "Add captions, titles, and watermarks to photos with full control over font, color, and stroke. In-browser, no account, nothing uploaded.",
    editorPreset: "text",
    tagline: "Captions, titles, and watermarks.",
    status: "v1",
  },
  {
    slug: "meme-generator",
    kind: "photo",
    label: "Meme generator",
    h1: "Meme generator: make a meme online, free",
    title: "Meme Generator Online Free, No Upload, No Watermark",
    description:
      "Make a meme in your browser with classic top and bottom Impact text. Free, no sign-up, no watermark, and nothing is uploaded. Your image never leaves your device.",
    editorPreset: "meme",
    tagline: "Top and bottom Impact text, instantly.",
    status: "v1",
  },
  {
    slug: "remove-background",
    kind: "photo",
    label: "Remove background",
    h1: "Remove an image background — on your device",
    title: "Remove Background from Image — Free, On-Device, Private",
    description:
      "Cut out the background from a photo using on-device AI. The model runs in your browser — your image is never uploaded to a server.",
    editorPreset: "remove-bg",
    tagline: "On-device cutouts, no server.",
    status: "phase-2",
  },
];

export const VIDEO_TOOLS: Tool[] = [
  {
    slug: "trim-video",
    kind: "video",
    label: "Trim video",
    h1: "Trim a video online — free, no upload",
    title: "Trim Video Online Free — No Upload, No Sign-up",
    description:
      "Cut the start and end off a video, or split out the part you want — all in your browser. No upload, no watermark, nothing leaves your device.",
    editorPreset: "trim",
    tagline: "Cut to the good part, instantly.",
    status: "v1",
  },
  {
    slug: "mute-video",
    kind: "video",
    label: "Mute video",
    h1: "Mute a video online, free and private",
    title: "Mute Video Online Free, No Upload, No Watermark",
    description:
      "Remove the sound from a video in your browser. Your clip opens muted, ready to export silent. No upload, no account, no watermark, and nothing leaves your device.",
    editorPreset: "mute",
    tagline: "Silence a clip in one step.",
    status: "v1",
  },
  {
    slug: "merge-video",
    kind: "video",
    label: "Merge videos",
    h1: "Merge videos online, free and private",
    title: "Merge Videos Online Free, No Upload, No Watermark",
    description:
      "Join two or more clips into one video in your browser. Drop them all in, reorder on the timeline, and export. No upload, no account, and nothing leaves your device.",
    editorPreset: "merge",
    tagline: "Join clips into one, on your device.",
    status: "v1",
  },
  {
    slug: "crop-video",
    kind: "video",
    label: "Crop video",
    h1: "Crop a video online — free and private",
    title: "Crop Video Online Free — Private, No Upload",
    description:
      "Crop and reframe video for any platform without uploading it. Runs on your device with WebCodecs. Free, private, and watermark-free.",
    editorPreset: "crop",
    tagline: "Reframe for any screen.",
    status: "v1",
  },
  {
    slug: "compress-video",
    kind: "video",
    label: "Compress video",
    h1: "Compress a video online — smaller files, on-device",
    title: "Compress Video Online Free — On-Device, No Upload",
    description:
      "Reduce video file size for email, web, or messaging. Choose a target size or quality. Compression happens on your device — no upload.",
    editorPreset: "compress",
    tagline: "Smaller files, no server round-trip.",
    status: "v1",
  },
  {
    slug: "convert-video",
    kind: "video",
    label: "Convert video",
    h1: "Convert video formats online — MP4, WebM",
    title: "Convert Video Online Free — MP4, WebM, No Upload",
    description:
      "Convert between MP4 and WebM in your browser using WebCodecs and Mediabunny. No upload, no account — everything runs on your device.",
    editorPreset: "convert",
    tagline: "MP4 ⇄ WebM, on your device.",
    status: "v1",
  },
  {
    slug: "mp4-to-webm",
    kind: "video",
    label: "MP4 to WebM",
    h1: "Convert MP4 to WebM — free, in your browser",
    title: "MP4 to WebM Converter — Free, Private, No Upload",
    description:
      "Turn MP4 videos into smaller WebM files for the web, on your device. Free and private — your video is never uploaded to a server.",
    editorPreset: "convert:webm",
    tagline: "Web-ready WebM from any MP4.",
    status: "v1",
  },
  {
    slug: "video-to-gif",
    kind: "video",
    label: "Video to GIF",
    h1: "Convert a video to GIF — free, no upload",
    title: "Video to GIF Converter — Free, Private, No Upload",
    description:
      "Make a GIF from any video clip in your browser. Pick the range, size, and frame rate. Nothing is uploaded — it all runs on your device.",
    editorPreset: "gif",
    tagline: "Clip to loop, in seconds.",
    status: "v1",
  },
  {
    slug: "extract-audio-from-video",
    kind: "video",
    label: "Extract audio",
    h1: "Extract audio from a video — free, on-device",
    title: "Extract Audio from Video — Free MP3/WAV, No Upload",
    description:
      "Pull the audio track out of a video and save it as MP3 or WAV — entirely in your browser. Private, free, and no upload required.",
    editorPreset: "extract-audio",
    tagline: "Save the sound as MP3 or WAV.",
    status: "v1",
  },
  {
    slug: "add-text-to-video",
    kind: "video",
    label: "Add text to video",
    h1: "Add text or captions to a video — free",
    title: "Add Text to Video Online Free — Private, No Upload",
    description:
      "Overlay titles, captions, and watermarks on a video in your browser. Position and time each one precisely. Nothing is uploaded.",
    editorPreset: "text",
    tagline: "Titles and captions, on your device.",
    status: "v1",
  },
  {
    slug: "rotate-video",
    kind: "video",
    label: "Rotate video",
    h1: "Rotate a video online — free, no upload",
    title: "Rotate Video Online Free — No Sign-up, No Upload",
    description:
      "Rotate a sideways or upside-down video by 90°, 180°, or 270° in your browser. Free, private, watermark-free — nothing leaves your device.",
    editorPreset: "rotate",
    tagline: "Fix orientation in one click.",
    status: "v1",
  },
  {
    slug: "resize-video-for-instagram",
    kind: "video",
    label: "Resize for Instagram",
    h1: "Resize a video for Instagram — free, private",
    title: "Resize Video for Instagram — Free, No Upload, No Sign-up",
    description:
      "Reframe video to 9:16 Reels, 1:1 feed, or 4:5 without uploading it. Presets for every Instagram format. Runs entirely on your device.",
    editorPreset: "reframe:instagram",
    tagline: "Reels, feed, and story presets.",
    status: "v1",
  },
  {
    slug: "auto-caption-video",
    kind: "video",
    label: "Auto captions",
    h1: "Add automatic captions to a video — free, on your device",
    title: "Auto Caption Video — Free AI Subtitles, No Upload",
    description:
      "Generate captions from your video’s speech with on-device AI. The model runs in your browser — your audio is never uploaded. Burn them in or export .srt.",
    editorPreset: "captions",
    tagline: "AI captions, nothing uploaded.",
    status: "v1",
  },
  {
    slug: "green-screen-video",
    kind: "video",
    label: "Green screen",
    h1: "Remove a green screen from a video — free, in your browser",
    title: "Green Screen Video Editor — Free Chroma Key, No Upload",
    description:
      "Key out a green (or blue) screen and isolate your subject — entirely in your browser. Adjust similarity, feather, and spill. Nothing is uploaded.",
    editorPreset: "effects",
    tagline: "Chroma key without uploading.",
    status: "v1",
  },
  {
    slug: "speed-up-video",
    kind: "video",
    label: "Speed up video",
    h1: "Speed up or slow down a video — free, no upload",
    title: "Speed Up / Slow Down Video — Free, Private, No Sign-up",
    description:
      "Change a video’s speed from 0.25× to 4× in your browser, with the audio pitch preserved. Free, private, watermark-free — nothing leaves your device.",
    editorPreset: "speed",
    tagline: "0.25×–4×, pitch preserved.",
    status: "v1",
  },
  {
    slug: "add-music-to-video",
    kind: "video",
    label: "Add music",
    h1: "Add music to a video — free, no upload",
    title: "Add Music to Video — Free, Private, No Watermark",
    description:
      "Add a background music track (or record a voiceover) to your video in the browser, with volume and fades. Mixed on your device — never uploaded.",
    editorPreset: "audio",
    tagline: "Background music + voiceover.",
    status: "v1",
  },
];

export const ALL_TOOLS: Tool[] = [...PHOTO_TOOLS, ...VIDEO_TOOLS];

export function getTool(slug: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}
