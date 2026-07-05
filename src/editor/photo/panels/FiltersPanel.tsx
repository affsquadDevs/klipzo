import { useEditor } from "../store";
import { FILTERS } from "../filters";

export function FiltersPanel() {
  const adjustments = useEditor((s) => s.present?.adjustments);
  const commit = useEditor((s) => s.commit);
  if (!adjustments) return null;

  const activeId = FILTERS.find(
    (f) => JSON.stringify(f.adjustments) === JSON.stringify(adjustments),
  )?.id;

  return (
    <div className="ed-panel">
      <div className="ed-panel__head">
        <h3>Filters</h3>
      </div>
      <p className="ed-panel__hint">
        A filter sets the adjustment sliders — switch to <strong>Adjust</strong> to fine-tune.
      </p>
      <div className="ed-filtergrid">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`ed-filterchip ${activeId === f.id ? "is-active" : ""}`}
            onClick={() => commit((d) => (d.adjustments = { ...f.adjustments }))}
          >
            <span className="ed-filterchip__swatch" data-filter={f.id} aria-hidden />
            <span>{f.name}</span>
          </button>
        ))}
      </div>
      <style>{`
        .ed-filtergrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
        .ed-filterchip { display: grid; gap: 0.35rem; padding: 0.5rem; border: 1px solid var(--color-border);
          border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-fg-muted);
          font-size: 0.75rem; cursor: pointer; align-items: center; }
        .ed-filterchip:hover { border-color: var(--color-accent); color: var(--color-fg); }
        .ed-filterchip.is-active { border-color: var(--color-accent); color: var(--color-fg); box-shadow: 0 0 0 1px var(--color-accent); }
        .ed-filterchip__swatch { height: 34px; width: 100%; border-radius: var(--radius-sm);
          background: linear-gradient(135deg,#6a8cff,#c86bff,#ffb56b); }
        .ed-filterchip__swatch[data-filter="bw"], .ed-filterchip__swatch[data-filter="noir"] { filter: grayscale(1) contrast(1.2); }
        .ed-filterchip__swatch[data-filter="sepia"] { filter: sepia(0.7); }
        .ed-filterchip__swatch[data-filter="warm"] { filter: saturate(1.3) hue-rotate(-12deg); }
        .ed-filterchip__swatch[data-filter="cool"] { filter: saturate(1.1) hue-rotate(18deg); }
        .ed-filterchip__swatch[data-filter="fade"], .ed-filterchip__swatch[data-filter="matte"] { filter: contrast(0.8) brightness(1.1); }
      `}</style>
    </div>
  );
}
