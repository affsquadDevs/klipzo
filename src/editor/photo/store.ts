/**
 * Photo editor state + undo/redo (§5.1). A Snapshot is the full editable document:
 * the geometry-baked working-source canvas + adjustments + overlays. Geometry ops and
 * discrete edits push history checkpoints; live slider drags mutate the present and
 * are bracketed by beginStroke()/endStroke() so one drag = one undo step.
 */
import { create } from "zustand";
import { ZERO_ADJUSTMENTS, type Adjustments } from "./gl/AdjustmentRenderer";
import type { Overlay, ToolId } from "./types";

export interface Snapshot {
  /** Geometry-baked working image (immutable per snapshot). */
  source: HTMLCanvasElement;
  width: number;
  height: number;
  adjustments: Adjustments;
  overlays: Overlay[];
}

const MAX_HISTORY = 30;

function cloneSnapshot(s: Snapshot): Snapshot {
  return {
    source: s.source, // canvases are treated as immutable; geometry ops create new ones
    width: s.width,
    height: s.height,
    adjustments: { ...s.adjustments },
    // Deep-copy the points array only for overlays that actually have one (line/draw).
    // Never write a `points: undefined` key onto text/shape overlays: a second clone
    // would then see `"points" in o` true and do `[...undefined]`, throwing — which
    // silently broke every edit (and undo/redo) once any overlay existed.
    overlays: s.overlays.map((o) => {
      const clone = { ...o } as Overlay;
      const pts = (o as { points?: number[] }).points;
      if (Array.isArray(pts)) (clone as { points: number[] }).points = [...pts];
      return clone;
    }),
  };
}

interface EditorState {
  present: Snapshot | null;
  past: Snapshot[];
  future: Snapshot[];
  activeTool: ToolId;
  selectedId: string | null;
  /** internal: snapshot captured at the start of a live stroke */
  _strokeStart: Snapshot | null;

  load: (source: HTMLCanvasElement) => void;
  clear: () => void;
  setTool: (tool: ToolId) => void;
  select: (id: string | null) => void;

  /** Discrete edit with a history checkpoint. */
  commit: (mutator: (draft: Snapshot) => void) => void;
  /** Live mutation with no history (slider drag). */
  setLive: (mutator: (draft: Snapshot) => void) => void;
  beginStroke: () => void;
  endStroke: () => void;

  addOverlay: (overlay: Overlay) => void;
  updateOverlay: (id: string, patch: Partial<Overlay>, history?: boolean) => void;
  removeSelected: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditor = create<EditorState>((set, get) => ({
  present: null,
  past: [],
  future: [],
  activeTool: "adjust",
  selectedId: null,
  _strokeStart: null,

  load: (source) =>
    set({
      present: {
        source,
        width: source.width,
        height: source.height,
        adjustments: { ...ZERO_ADJUSTMENTS },
        overlays: [],
      },
      past: [],
      future: [],
      selectedId: null,
      activeTool: "adjust",
    }),

  clear: () => set({ present: null, past: [], future: [], selectedId: null }),

  setTool: (activeTool) => set({ activeTool, selectedId: null }),
  select: (selectedId) => set({ selectedId }),

  commit: (mutator) =>
    set((state) => {
      if (!state.present) return state;
      const past = [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY);
      const next = cloneSnapshot(state.present);
      mutator(next);
      return { past, present: next, future: [] };
    }),

  setLive: (mutator) =>
    set((state) => {
      if (!state.present) return state;
      const next = cloneSnapshot(state.present);
      mutator(next);
      return { present: next };
    }),

  beginStroke: () =>
    set((state) => ({ _strokeStart: state.present ? cloneSnapshot(state.present) : null })),

  endStroke: () =>
    set((state) => {
      if (!state._strokeStart) return { _strokeStart: null };
      const past = [...state.past, state._strokeStart].slice(-MAX_HISTORY);
      return { past, future: [], _strokeStart: null };
    }),

  addOverlay: (overlay) =>
    set((state) => {
      if (!state.present) return state;
      const past = [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY);
      const next = cloneSnapshot(state.present);
      next.overlays = [...next.overlays, overlay];
      return { past, present: next, future: [], selectedId: overlay.id };
    }),

  updateOverlay: (id, patch, history = true) =>
    set((state) => {
      if (!state.present) return state;
      const apply = (snap: Snapshot) => {
        snap.overlays = snap.overlays.map((o) =>
          o.id === id ? ({ ...o, ...patch } as Overlay) : o,
        );
      };
      if (history) {
        const past = [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY);
        const next = cloneSnapshot(state.present);
        apply(next);
        return { past, present: next, future: [] };
      }
      const next = cloneSnapshot(state.present);
      apply(next);
      return { present: next };
    }),

  removeSelected: () =>
    set((state) => {
      if (!state.present || !state.selectedId) return state;
      const past = [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY);
      const next = cloneSnapshot(state.present);
      next.overlays = next.overlays.filter((o) => o.id !== state.selectedId);
      return { past, present: next, future: [], selectedId: null };
    }),

  undo: () =>
    set((state) => {
      if (!state.past.length || !state.present) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [cloneSnapshot(state.present), ...state.future].slice(0, MAX_HISTORY),
        selectedId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.future.length || !state.present) return state;
      const next = state.future[0]!;
      return {
        past: [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY),
        present: next,
        future: state.future.slice(1),
        selectedId: null,
      };
    }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
