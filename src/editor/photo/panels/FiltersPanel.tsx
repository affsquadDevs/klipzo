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
    </div>
  );
}
