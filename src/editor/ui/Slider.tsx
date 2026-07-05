/**
 * Adjustment slider (§4 standardized control). Calls onCommit at the start of a drag
 * and onCommitEnd at the end so the editor can bracket one drag into a single undo
 * step, while onChange fires live during the drag.
 */
interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  onStrokeStart?: () => void;
  onStrokeEnd?: () => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  onStrokeStart,
  onStrokeEnd,
}: Props) {
  return (
    <label className="ed-slider">
      <span className="ed-slider__row">
        <span className="ed-slider__label">{label}</span>
        <span className="ed-slider__value">
          {value > 0 ? "+" : ""}
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={() => onStrokeStart?.()}
        onPointerUp={() => onStrokeEnd?.()}
        onKeyDown={() => onStrokeStart?.()}
        onKeyUp={() => onStrokeEnd?.()}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => {
          onStrokeStart?.();
          onChange(0);
          onStrokeEnd?.();
        }}
      />
      <style>{`
        .ed-slider { display: grid; gap: 0.35rem; }
        .ed-slider__row { display: flex; justify-content: space-between; align-items: center; }
        .ed-slider__label { font-size: 0.85rem; color: var(--color-fg-muted); }
        .ed-slider__value { font-size: 0.78rem; color: var(--color-fg-subtle); font-variant-numeric: tabular-nums; }
        .ed-slider input[type="range"] { width: 100%; accent-color: var(--color-accent); cursor: pointer; }
      `}</style>
    </label>
  );
}
