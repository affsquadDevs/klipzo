import { useEditor } from "../store";
import { cropSource, type CropRect } from "../geometry";
import { ASPECT_RATIOS } from "../aspectRatios";

interface Props {
  cropRect: CropRect | null;
  setCropRect: (r: CropRect) => void;
  aspectId: string;
  setAspectId: (id: string) => void;
}

export function CropPanel({ cropRect, setCropRect, aspectId, setAspectId }: Props) {
  const present = useEditor((s) => s.present);
  const commit = useEditor((s) => s.commit);
  if (!present || !cropRect) return null;

  const { width: iw, height: ih } = present;

  function applyAspect(id: string) {
    setAspectId(id);
    const preset = ASPECT_RATIOS.find((a) => a.id === id);
    let ratio = preset?.ratio ?? null;
    if (id === "original") ratio = iw / ih;
    if (!ratio) return; // free
    // Fit a centered rect of the target ratio inside the image.
    let w = iw;
    let h = w / ratio;
    if (h > ih) {
      h = ih;
      w = h * ratio;
    }
    setCropRect({ x: (iw - w) / 2, y: (ih - h) / 2, width: w, height: h });
  }

  function applyCrop() {
    if (!cropRect) return;
    commit((d) => {
      d.source = cropSource(d.source, cropRect);
      d.width = d.source.width;
      d.height = d.source.height;
    });
  }

  function resetCrop() {
    setCropRect({ x: 0, y: 0, width: iw, height: ih });
    setAspectId("free");
  }

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Crop</h3>
      </div>
      <div className="ed-aspectgrid">
        {ASPECT_RATIOS.map((a) => (
          <button
            key={a.id}
            className={`ed-aspectchip ${aspectId === a.id ? "is-active" : ""}`}
            onClick={() => applyAspect(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="ed-cropdims">
        <span>{Math.round(cropRect.width)} × {Math.round(cropRect.height)} px</span>
      </div>
      <div className="ed-btnrow">
        <button className="k-btn k-btn-ghost ed-btn-sm" onClick={resetCrop}>Reset</button>
        <button className="k-btn k-btn-primary ed-btn-sm" onClick={applyCrop}>Apply crop</button>
      </div>
    </div>
  );
}
