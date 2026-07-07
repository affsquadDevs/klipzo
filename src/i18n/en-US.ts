/**
 * en-US string dictionary. Every user-facing string lives here (§1: no hardcoded
 * strings in components). Keys are dot-namespaced by area. To localize later, add a
 * sibling file (e.g. `de-DE.ts`) with the same keys and register it in `index.ts`.
 */
export const strings = {
  // Global / brand
  "brand.name": "Klipzo",
  "brand.tagline": "Edit photos & video in your browser. Free. No sign-up. Nothing uploaded.",

  // Navigation
  "nav.home": "Home",
  "nav.editor": "Open editor",
  "nav.photoTools": "Photo tools",
  "nav.videoTools": "Video tools",
  "nav.guides": "Guides",
  "nav.howItWorks": "How it works",
  "nav.about": "About",
  "nav.skipToContent": "Skip to content",
  "nav.menu": "Menu",
  "nav.close": "Close",

  // Home / hero
  "home.hero.title": "The free, private photo & video editor that runs in your browser",
  "home.hero.subtitle":
    "Crop, trim, convert, and export photos and video instantly. No account, no upload. Your files never leave your device.",
  "home.hero.ctaPrimary": "Open the editor",
  "home.hero.ctaSecondary": "See how it works",
  "home.trust.noUpload": "Nothing is uploaded",
  "home.trust.noAccount": "No sign-up, ever",
  "home.trust.onDevice": "Runs 100% on your device",
  "home.trust.free": "Free, no watermarks",

  // Privacy banner (shown during processing)
  "privacy.processingLocal": "Processing locally on your device — nothing is uploaded.",
  "privacy.filesStayHere": "Your files never leave this device.",

  // Session controls (§2.3)
  "session.clearAll": "Clear session",
  "session.clearAllDescription":
    "Delete every open project and all scratch media from this device. This cannot be undone.",
  "session.cleared": "Session cleared. All media removed from this device.",
  "session.clearConfirm": "Delete everything and start fresh?",

  // Editor — shell
  "editor.title": "Editor",
  "editor.import": "Import",
  "editor.importDrop": "Drag & drop a photo or video, or click to browse",
  "editor.importPaste": "…or paste from your clipboard",
  "editor.export": "Export",
  "editor.undo": "Undo",
  "editor.redo": "Redo",
  "editor.reset": "Reset",
  "editor.cancel": "Cancel",
  "editor.done": "Done",
  "editor.apply": "Apply",
  "editor.loading": "Loading editor…",
  "editor.noFile": "No file open yet",

  // Editor — photo tools
  "tool.crop": "Crop",
  "tool.rotate": "Rotate",
  "tool.flip": "Flip",
  "tool.straighten": "Straighten",
  "tool.resize": "Resize",
  "tool.adjust": "Adjust",
  "tool.filters": "Filters",
  "tool.text": "Text",
  "tool.draw": "Draw",
  "tool.shapes": "Shapes",
  "tool.annotate": "Annotate",

  // Adjustments
  "adjust.brightness": "Brightness",
  "adjust.contrast": "Contrast",
  "adjust.exposure": "Exposure",
  "adjust.saturation": "Saturation",
  "adjust.vibrance": "Vibrance",
  "adjust.temperature": "Temperature",
  "adjust.tint": "Tint",
  "adjust.highlights": "Highlights",
  "adjust.shadows": "Shadows",
  "adjust.sharpen": "Sharpen",
  "adjust.blur": "Blur",

  // Export dialog
  "export.format": "Format",
  "export.quality": "Quality",
  "export.resize": "Resize",
  "export.stripMetadata": "Remove metadata (EXIF)",
  "export.stripMetadataHint": "On by default for privacy. Removes camera, location, and edit data.",
  "export.download": "Download",
  "export.ready": "Your file is ready",
  "export.preparing": "Preparing your export…",
  "export.exifStripped": "Location & camera metadata removed.",

  // Video editor
  "video.timeline": "Timeline",
  "video.trim": "Trim",
  "video.split": "Split",
  "video.merge": "Merge",
  "video.reframe": "Reframe",
  "video.speed": "Speed",
  "video.addAudio": "Add audio",
  "video.extractAudio": "Extract audio",
  "video.captureFrame": "Capture frame",
  "video.toGif": "Export GIF",
  "video.play": "Play",
  "video.pause": "Pause",

  // Progress
  "progress.processing": "Processing…",
  "progress.encoding": "Encoding…",
  "progress.decoding": "Decoding…",
  "progress.muxing": "Finalizing…",
  "progress.cancelled": "Cancelled.",
  "progress.percent": "{value}% complete",

  // Capability / compatibility (§10)
  "cap.unsupported": "This export isn’t supported in your current browser.",
  "cap.tryDesktop": "For heavy video export, we recommend desktop Chrome or Edge.",
  "cap.fallbackUsed": "Using a compatibility encoder — this may be slower.",
  "cap.largeFileWarning":
    "That’s a large file. Editing may be slow and use a lot of memory. Continue?",

  // Errors
  "error.generic": "Something went wrong. Your files are safe and still on your device.",
  "error.unsupportedFile": "That file type isn’t supported yet.",
  "error.outOfMemory": "Ran out of memory. Try a smaller file or lower export settings.",

  // Consent / cookies (§7)
  "consent.title": "Cookies & ads",
  "consent.body":
    "We use cookies for ads and anonymous analytics. Your photos and videos are never uploaded or shared. This only concerns website usage.",
  "consent.accept": "Accept all",
  "consent.reject": "Reject non-essential",
  "consent.manage": "Manage choices",
  "consent.save": "Save choices",

  // Footer
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms",
  "footer.disclaimer": "Disclaimer",
  "footer.editorial": "Editorial Policy",
  "footer.contact": "Contact",
  "footer.about": "About",
  "footer.howItWorks": "How it works",
  "footer.rights": "All rights reserved.",
  "footer.builtBy": "Built for people who value their privacy.",

  // Generic
  "generic.free": "Free",
  "generic.noSignup": "No sign-up",
  "generic.private": "Private",
  "generic.lastUpdated": "Last updated",
  "generic.readMore": "Read more",
  "generic.faq": "Frequently asked questions",
  "generic.steps": "Steps",
} as const;

export type StringKey = keyof typeof strings;
