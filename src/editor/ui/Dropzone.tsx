import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onFiles: (files: FileList | File[]) => void;
}

/** Import surface: drag & drop, click-to-browse, and paste-from-clipboard. */
export function Dropzone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.files;
      if (items && items.length > 0) onFiles(items);
    },
    [onFiles],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return (
    <div className="ed-dz-wrap">
      <div
        className={`ed-dz ${dragging ? "ed-dz--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <div className="ed-dz__icon" aria-hidden>
          ⬆️
        </div>
        <p className="ed-dz__title">Drag &amp; drop a photo or video</p>
        <p className="ed-dz__sub">or click to browse · or paste from your clipboard</p>
        <p className="ed-dz__privacy">🔒 Files are opened on your device and never uploaded.</p>
        <p className="ed-dz__sub">…or open a saved <strong>.klipzo</strong> project</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*,audio/*,.klipzo"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <style>{dzStyles}</style>
    </div>
  );
}

const dzStyles = `
.ed-dz-wrap { display: grid; place-items: center; width: 100%; padding: 2rem; }
.ed-dz {
  width: min(38rem, 100%); aspect-ratio: 16 / 8; max-height: 60dvh;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem;
  border: 2px dashed var(--color-border); border-radius: var(--radius-xl);
  background: var(--color-surface); cursor: pointer; text-align: center; padding: 2rem;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.ed-dz:hover, .ed-dz--active { border-color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 6%, var(--color-surface)); }
.ed-dz__icon { font-size: 2rem; }
.ed-dz__title { font-weight: 620; font-size: 1.1rem; color: var(--color-fg); }
.ed-dz__sub { color: var(--color-fg-muted); font-size: 0.9rem; }
.ed-dz__privacy { margin-top: 0.75rem; color: var(--color-fg-subtle); font-size: 0.8rem; }
`;
