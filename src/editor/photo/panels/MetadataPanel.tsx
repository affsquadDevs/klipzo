import { useEffect, useState } from "react";
import { useEditor } from "../store";

interface Props {
  file: File;
}

interface Meta {
  loading: boolean;
  rows: Array<[string, string]>;
  gps: { lat: number; lng: number } | null;
  hadExif: boolean;
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Reads and displays the photo's embedded metadata (EXIF/GPS). Exporting the image
 *  re-encodes it, which strips all of this — the private way to scrub a photo. */
export function MetadataPanel({ file }: Props) {
  const present = useEditor((s) => s.present);
  const [meta, setMeta] = useState<Meta>({ loading: true, rows: [], gps: null, hadExif: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows: Array<[string, string]> = [
        ["File name", file.name],
        ["File size", fmtBytes(file.size)],
        ["Type", file.type || "unknown"],
      ];
      if (present) rows.push(["Dimensions", `${present.width} × ${present.height} px`]);

      let gps: { lat: number; lng: number } | null = null;
      let hadExif = false;
      try {
        const exifr = (await import("exifr")).default;
        const data: Record<string, unknown> | undefined = await exifr
          .parse(file, { gps: true })
          .catch(() => undefined);
        if (data) {
          const add = (label: string, v: unknown, suffix = "") => {
            if (v === undefined || v === null || v === "") return;
            hadExif = true;
            rows.push([label, `${v instanceof Date ? v.toLocaleString() : String(v)}${suffix}`]);
          };
          add("Camera", [data.Make, data.Model].filter(Boolean).join(" "));
          add("Lens", data.LensModel);
          add("Taken", data.DateTimeOriginal ?? data.CreateDate);
          add("ISO", data.ISO);
          if (typeof data.FNumber === "number") add("Aperture", `f/${data.FNumber}`);
          if (data.ExposureTime) add("Shutter", `${data.ExposureTime}s`);
          if (typeof data.FocalLength === "number") add("Focal length", `${data.FocalLength} mm`);
          add("Software", data.Software);
        }
        const g = await exifr.gps(file).catch(() => undefined);
        if (g && Number.isFinite(g.latitude) && Number.isFinite(g.longitude)) {
          gps = { lat: g.latitude, lng: g.longitude };
          hadExif = true;
        }
      } catch {
        /* no parseable metadata */
      }
      if (!cancelled) setMeta({ loading: false, rows, gps, hadExif });
    })();
    return () => {
      cancelled = true;
    };
  }, [file, present]);

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Metadata (EXIF)</h3>
      </div>

      {meta.gps && (
        <p className="ed-meta-warn">
          📍 This photo contains GPS location ({meta.gps.lat.toFixed(5)}, {meta.gps.lng.toFixed(5)}). Export to remove it.
        </p>
      )}

      <dl className="ed-meta">
        {meta.rows.map(([k, v]) => (
          <div className="ed-meta__row" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {!meta.loading && !meta.hadExif && (
        <p className="ed-panel__hint">No camera or GPS metadata found in this file.</p>
      )}

      <p className="ed-panel__hint">
        Click <strong>Export</strong> to download a clean copy — re-encoding removes all EXIF, GPS, and other metadata. Nothing is uploaded.
      </p>

      <style>{`
        .ed-meta { margin: 0.25rem 0 0.75rem; }
        .ed-meta__row { display: flex; justify-content: space-between; gap: 1rem; padding: 0.35rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.82rem; }
        .ed-meta__row dt { color: var(--color-fg-subtle); }
        .ed-meta__row dd { color: var(--color-fg); margin: 0; text-align: right; word-break: break-word; }
        .ed-meta-warn { font-size: 0.8rem; color: var(--color-fg); background: color-mix(in srgb, var(--color-danger, #e5484d) 14%, transparent); border: 1px solid color-mix(in srgb, var(--color-danger, #e5484d) 40%, transparent); border-radius: var(--radius-sm, 6px); padding: 0.5rem 0.6rem; line-height: 1.4; }
      `}</style>
    </div>
  );
}
