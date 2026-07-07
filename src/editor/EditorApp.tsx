/**
 * Editor root (client-only). Phase 1 provides the shell layout + import dropzone and
 * a privacy banner; Phase 2 mounts the photo canvas/tools, Phase 3 the video timeline.
 * This component and everything it imports must NEVER be imported by a content page.
 */
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { EditorShell } from "./ui/EditorShell";
import { Dropzone } from "./ui/Dropzone";
import { classifyFile, type LoadedMedia } from "./core/media";

/**
 * Lazy-load the heavy editors so their engines (Konva ~150kB, Mediabunny ~500kB)
 * only download when the matching media type is actually opened.
 *
 * `lazyWithRetry` retries a failed dynamic import once after a short delay. Chunk
 * loads fail in real life — dev-server re-optimization, flaky networks, or stale
 * hashed chunks right after a redeploy — and without this the import rejection used
 * to unmount the whole island into a black screen.
 */
function lazyWithRetry<T extends { default: React.ComponentType<never> } | Record<string, unknown>>(
  factory: () => Promise<T>,
  pick: (m: T) => React.ComponentType<any>,
) {
  return lazy(async () => {
    try {
      return { default: pick(await factory()) };
    } catch {
      await new Promise((r) => setTimeout(r, 800));
      return { default: pick(await factory()) };
    }
  });
}

const PhotoEditor = lazyWithRetry(() => import("./photo/PhotoEditor"), (m) => m.PhotoEditor);
const VideoEditor = lazyWithRetry(() => import("./video/VideoEditor"), (m) => m.VideoEditor);

function EngineLoading() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--color-fg-muted)" }}>
      Loading editor tools…
    </div>
  );
}

/**
 * Last line of defense: if anything in the editor throws (including a failed chunk
 * load after the retry), show a recoverable message instead of a black screen. The
 * user's file is still on their device, so a reload loses nothing except open edits.
 */
class EditorErrorBoundary extends Component<
  { onReset: () => void; children: ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|Outdated Optimize Dep|Loading chunk/i.test(
      String(this.state.error?.message ?? this.state.error),
    );
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", padding: 24 }}>
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: 420, textAlign: "center", justifyItems: "center" }}>
          <p style={{ fontSize: "1.05rem", fontWeight: 620, color: "var(--color-fg)" }}>
            {isChunkError ? "The editor failed to load" : "Something went wrong in the editor"}
          </p>
          <p style={{ color: "var(--color-fg-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Your file is safe — it never left your device. {isChunkError
              ? "This usually happens right after an update. Reloading fixes it."
              : "Reloading the editor usually fixes it."}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="k-btn k-btn-ghost" onClick={() => { this.setState({ error: null }); this.props.onReset(); }}>
              Back to import
            </button>
            <button className="k-btn k-btn-primary" onClick={() => window.location.reload()}>
              Reload editor
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default function EditorApp() {
  const [media, setMedia] = useState<LoadedMedia | null>(null);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const file = arr[0];
    if (!file) return;

    // A .klipzo project file opens straight into the video editor with its embedded
    // media and edits restored — so a returning user can resume from the dropzone.
    if (/\.klipzo$/i.test(file.name)) {
      try {
        const { loadProject } = await import("./video/project/klipzo");
        const { useTimeline } = await import("./video/timeline/store");
        const project = await loadProject(file);
        useTimeline.getState().loadProjectData(project);
        setMedia(null);
        setProjectLoaded(true);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Couldn’t open that project file.");
      }
      return;
    }

    const kind = classifyFile(file);
    if (kind === "unknown") {
      alert("That file type isn’t supported yet.");
      return;
    }
    setProjectLoaded(false);
    // Multiple videos dropped/selected at once → append the rest as clips (merge).
    setExtraFiles(kind === "video" ? arr.slice(1).filter((f) => classifyFile(f) === "video") : []);
    setMedia({ file, kind, url: URL.createObjectURL(file) });
  }

  function reset() {
    if (media) URL.revokeObjectURL(media.url);
    setMedia(null);
    setProjectLoaded(false);
    setExtraFiles([]);
  }

  const active = Boolean(media) || projectLoaded;

  // Guard against losing unsaved work to an accidental refresh, tab close, or
  // back-navigation. Edits live only in memory (nothing is uploaded), so once
  // something is open the browser should confirm before the page unloads.
  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Some older browsers still require a returnValue to show the prompt.
      (e as unknown as { returnValue: string }).returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);

  return (
    <EditorShell hasMedia={active} onReset={reset}>
      {!active ? (
        <Dropzone onFiles={handleFiles} />
      ) : (
        <EditorErrorBoundary onReset={reset}>
          <Suspense fallback={<EngineLoading />}>
            {media?.kind === "image" ? (
              <PhotoEditor media={media} onClose={reset} />
            ) : (
              <VideoEditor media={media} onClose={reset} projectPreloaded={projectLoaded} extraFiles={extraFiles} />
            )}
          </Suspense>
        </EditorErrorBoundary>
      )}
    </EditorShell>
  );
}
