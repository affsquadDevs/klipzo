---
title: "How to add captions to a video automatically (on-device AI)"
description: "Auto-caption any video for free in your browser. On-device AI transcribes the speech, nothing is uploaded, and you can edit the text and export burned-in captions or a .srt file."
excerpt: "Open Klipzo's auto-caption tool, add your clip, and generate captions with AI that runs entirely in your browser. Your audio never leaves your device — only the speech model downloads once — and you can edit the wording, retime each line, and export burned-in captions or a .srt sidecar."
datePublished: "2026-07-02"
dateModified: "2026-07-06"
category: "Video"
faqs:
  - question: "Is my audio uploaded to caption it?"
    answer: "No. The speech-to-text model runs inside your browser, so your audio is never sent to a server. The only thing downloaded is the AI model itself, once, from a public CDN — after that it is cached and your recordings stay on your device."
  - question: "How accurate are the automatic captions?"
    answer: "Accuracy depends on how clear the speech is. Clean, close-mic audio in a common accent transcribes well; heavy background noise, overlapping speakers, or strong accents produce more mistakes. Always read through and fix the text before you publish — Klipzo makes every caption line editable."
  - question: "Why is the first caption run slow?"
    answer: "The first time you generate captions, the browser downloads the speech model (around 150 MB). That happens once and is then cached. Transcription is fastest on desktop Chrome or Edge, which can use WebGPU; other browsers fall back to WebAssembly, which works but is slower."
  - question: "Can I export an .srt subtitle file?"
    answer: "Yes. You can burn the captions into the video, or export a .srt sidecar file to upload alongside your video on platforms that support separate subtitle tracks."
relatedTools: ["auto-caption-video", "add-text-to-video", "trim-video"]
---

You can add captions to a video automatically by using an in-browser editor like Klipzo, where an on-device AI listens to the speech and writes out time-stamped caption lines for you. Open the [auto-caption tool](/auto-caption-video), add your clip, and click to generate. The transcription runs inside your browser using your own device, so your audio is never uploaded, there is no account to create, no watermark on the result, and it is completely free.

## Why on-device captioning is different

Most "automatic subtitle" services upload your video to a server, run speech recognition in the cloud, and send the text back. That means your footage and its audio leave your device, and you are trusting a company with a recording that might contain names, addresses, or anything else people said on camera.

Klipzo works the other way around. The speech-recognition model — a version of Whisper — is downloaded to your browser once and then runs locally on your hardware. Your audio is fed to the model inside the page and never sent anywhere. The only thing that travels over the network is the model itself, fetched a single time from a public CDN and cached afterward. From then on, captioning a clip is something your own machine does, offline if you like.

## What you need

- A modern browser. For the fastest transcription, use desktop Chrome or Edge, which can run the model on WebGPU.
- The video file on your device. Common formats like MP4, MOV, and WebM work well.
- Some patience on the very first run, while the model downloads. After that it is cached.
- No account, no software install, no plugins.

## Step-by-step: caption a video automatically

1. Open the [auto-caption a video](/auto-caption-video) tool, or start from [the editor](/editor) and choose the caption tool.
2. Drag your video onto the page or click to browse and select it. It loads locally, so this is instant even for large files.
3. Click to generate captions. The first time, your browser downloads the speech model (around 150 MB). This one-time step is why the first run feels slow; later runs skip it because the model is cached.
4. Wait while the AI transcribes the audio. It processes the speech and produces a list of caption lines, each with its own start and end time.
5. Read through the caption list against the video. This is the important part — check every line for wrong words, missed words, or bad punctuation.
6. Click any line to edit its wording. Fix names, jargon, and homophones the model guessed wrong, and tidy up capitalization.
7. Optionally restyle the captions — the lines become editable text overlays, so you can change how they look on screen.
8. If a caption appears too early or lingers too long, drag the edges of its bar on the timeline to adjust its timing until it matches the speech.
9. Export. Either burn the captions directly into the video, or download a `.srt` sidecar file instead.

The whole loop — generate, read, fix, retime, export — happens on your device. There is no upload before it starts and no server processing your video in the middle.

## Fixing the text and timing

Automatic transcription gets you most of the way, but it is a starting point, not a finished script. Expect to correct proper nouns, brand names, and technical terms, since a general model has no way to know your spelling of an unusual word. Editing a caption in Klipzo is just editing text, so you can rewrite a whole line if the model mangled it.

Timing usually needs small tweaks too. Because each caption is a bar on the timeline, you can drag its start or end to line up with exactly when the words are spoken. If a sentence was split awkwardly, shortening one bar and extending its neighbor is often enough to make the captions read naturally.

Since the caption lines are ordinary text overlays, the same skills carry over to [adding text to a video](/add-text-to-video) by hand — for a title card, a lower third, or a note the transcript would never capture.

## Speed, accuracy, and browser support, honestly

On-device AI is powerful, but it is fair to be clear about the trade-offs:

- **Desktop Chrome or Edge:** fastest. These browsers can run the model on WebGPU, which speeds up transcription considerably.
- **Other modern browsers:** still work. Klipzo falls back to WebAssembly, which runs the same model on the CPU — it is slower but produces the same kind of result.
- **Phones and older machines:** fine for short clips, but a long recording takes more time and memory, and the initial model download is a larger commitment on a slow connection.

Accuracy is the other honest caveat. Clean, close-mic speech in a common accent transcribes well. Heavy background noise, music under the voice, overlapping speakers, or a strong accent will produce more mistakes. There is no way around reviewing the text before you publish — treat the AI as a fast typist you still have to proofread.

## What to do next

Once your captions are correct and well timed, a few things pair naturally with them:

- If your clip runs long, [trim the video](/trim-video) first so the model only transcribes the part you actually need — this is faster and gives you fewer lines to review.
- Burn the captions in for platforms that autoplay silently, or export a `.srt` file to upload alongside your video where separate subtitle tracks are supported.

Everything above runs client-side, which is the whole point. If you want the full picture of how that keeps your files off other people's servers, the guide on [how browser editing keeps files private](/guides/how-browser-editing-keeps-files-private) explains it in more depth.

## Quick recap

Adding captions automatically comes down to letting an on-device model do the first draft and then cleaning it up yourself. Open the [auto-caption tool](/auto-caption-video), add your clip, generate the captions, and wait once for the model to download. Read the lines, fix any wrong words, drag a caption bar to fix its timing, and export either burned-in or as a `.srt` file. It is free, needs no account, adds no watermark, and your audio never leaves your device.
