/**
 * Editor root (client-only). Phase 1 provides the shell layout + import dropzone and
 * a privacy banner; Phase 2 mounts the photo canvas/tools, Phase 3 the video timeline.
 * This component and everything it imports must NEVER be imported by a content page.
 */
import { lazy, Suspense, useState } from "react";
import { EditorShell } from "./ui/EditorShell";
import { Dropzone } from "./ui/Dropzone";
import { classifyFile, type LoadedMedia } from "./core/media";

// Lazy-load the heavy editors so their engines (Konva ~150kB, Mediabunny ~500kB)
// only download when the matching media type is actually opened.
const PhotoEditor = lazy(() =>
  import("./photo/PhotoEditor").then((m) => ({ default: m.PhotoEditor })),
);
const VideoEditor = lazy(() =>
  import("./video/VideoEditor").then((m) => ({ default: m.VideoEditor })),
);

function EngineLoading() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--color-fg-muted)" }}>
      Loading editor tools…
    </div>
  );
}

export default function EditorApp() {
  const [media, setMedia] = useState<LoadedMedia | null>(null);

  async function handleFiles(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    const kind = classifyFile(file);
    if (kind === "unknown") {
      alert("That file type isn’t supported yet.");
      return;
    }
    setMedia({ file, kind, url: URL.createObjectURL(file) });
  }

  function reset() {
    if (media) URL.revokeObjectURL(media.url);
    setMedia(null);
  }

  return (
    <EditorShell hasMedia={Boolean(media)} onReset={reset}>
      {!media ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <Suspense fallback={<EngineLoading />}>
          {media.kind === "image" ? (
            <PhotoEditor media={media} onClose={reset} />
          ) : (
            <VideoEditor media={media} onClose={reset} />
          )}
        </Suspense>
      )}
    </EditorShell>
  );
}
