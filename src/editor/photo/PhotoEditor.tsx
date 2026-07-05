/**
 * Phase 1 placeholder — displays the loaded image. Phase 2 replaces this with the
 * full canvas + WebGL editor (crop/adjust/filter/text/export).
 */
import type { LoadedMedia } from "../core/media";

interface Props {
  media: LoadedMedia;
  onClose: () => void;
}

export function PhotoEditor({ media, onClose }: Props) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%", padding: 24, gap: 16 }}>
      <img
        src={media.url}
        alt={media.file.name}
        style={{ maxWidth: "100%", maxHeight: "70dvh", borderRadius: 8 }}
      />
      <p style={{ color: "var(--color-fg-muted)", fontSize: "0.85rem" }}>
        Photo editor tools arrive in Phase 2. Loaded locally — nothing uploaded.
      </p>
      <button className="k-btn k-btn-ghost" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
