/**
 * Editor root (client-only). Phase 1 provides the shell layout + import dropzone and
 * a privacy banner; Phase 2 mounts the photo canvas/tools, Phase 3 the video timeline.
 * This component and everything it imports must NEVER be imported by a content page.
 */
import { useState } from "react";
import { EditorShell } from "./ui/EditorShell";
import { PhotoEditor } from "./photo/PhotoEditor";
import { Dropzone } from "./ui/Dropzone";
import { classifyFile, type LoadedMedia } from "./core/media";

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
      ) : media.kind === "image" ? (
        <PhotoEditor media={media} onClose={reset} />
      ) : (
        <VideoComingSoon onClose={reset} />
      )}
    </EditorShell>
  );
}

function VideoComingSoon({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", gap: "1rem", padding: 24 }}>
      <p style={{ color: "var(--color-fg-muted)", maxWidth: 420, textAlign: "center" }}>
        The video timeline lands in Phase 3 (WebCodecs + Mediabunny pipeline). Your file was loaded
        locally and never uploaded.
      </p>
      <button className="k-btn k-btn-ghost" onClick={onClose}>
        Choose a different file
      </button>
    </div>
  );
}
