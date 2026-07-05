/**
 * Timeline project store (Phase A): zustand + snapshot undo, mirroring the photo
 * editor's history model — discrete ops push checkpoints, one drag = one undo step
 * via beginStroke/endStroke. Assets are NOT part of undo history (they're immutable
 * decoded media; undoing a clip delete restores the clip, the asset never left).
 */
import { create } from "zustand";
import {
  emptyProject,
  appendClip,
  splitAt,
  removeClip,
  moveClip,
  setClipTrim,
  setTransition,
  addText,
  updateText,
  removeText,
  totalDuration,
  type Project,
  type SourceAsset,
  type Clip,
  type TimedText,
  type Transition,
} from "./model";

interface HistoryEntry {
  clips: Clip[];
  texts: TimedText[];
}

const MAX_HISTORY = 40;

function snap(p: Project): HistoryEntry {
  return { clips: p.clips, texts: p.texts }; // arrays are immutable (ops always copy)
}

interface TimelineState {
  project: Project;
  past: HistoryEntry[];
  future: HistoryEntry[];
  selectedClipIndex: number | null;
  selectedTextId: string | null;
  _stroke: HistoryEntry | null;

  addAsset: (asset: SourceAsset) => void;
  splitAtTime: (t: number) => void;
  deleteClip: (index: number) => void;
  moveClipBy: (index: number, dir: -1 | 1) => void;
  trimClip: (index: number, inT: number, outT: number, history?: boolean) => void;
  setClipTransition: (index: number, transition: Transition) => void;

  addTextAt: (t: number) => void;
  patchText: (id: string, patch: Partial<TimedText>, history?: boolean) => void;
  deleteText: (id: string) => void;

  selectClip: (index: number | null) => void;
  selectText: (id: string | null) => void;

  beginStroke: () => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useTimeline = create<TimelineState>((set, get) => {
  /** Apply a clips/texts change with a history checkpoint. */
  function commit(mutate: (p: Project) => Partial<Pick<Project, "clips" | "texts">>) {
    set((s) => {
      const changes = mutate(s.project);
      const changed =
        (changes.clips && changes.clips !== s.project.clips) ||
        (changes.texts && changes.texts !== s.project.texts);
      if (!changed) return s;
      return {
        past: [...s.past, snap(s.project)].slice(-MAX_HISTORY),
        future: [],
        project: { ...s.project, ...changes },
      };
    });
  }

  return {
    project: emptyProject(),
    past: [],
    future: [],
    selectedClipIndex: null,
    selectedTextId: null,
    _stroke: null,

    addAsset: (asset) =>
      commitWithAsset(set, asset),

    splitAtTime: (t) => commit((p) => ({ clips: splitAt(p.clips, t) })),

    deleteClip: (index) => {
      commit((p) => ({ clips: removeClip(p.clips, index) }));
      set((s) => ({
        selectedClipIndex:
          s.selectedClipIndex === null
            ? null
            : Math.min(s.selectedClipIndex, s.project.clips.length - 1),
      }));
    },

    moveClipBy: (index, dir) => {
      commit((p) => ({ clips: moveClip(p.clips, index, dir) }));
      set((s) => {
        const j = index + dir;
        return s.selectedClipIndex === index && j >= 0 && j < s.project.clips.length
          ? { selectedClipIndex: j }
          : s;
      });
    },

    trimClip: (index, inT, outT, history = true) => {
      const { project } = get();
      const clip = project.clips[index];
      if (!clip) return;
      const asset = project.assets[clip.assetId];
      if (!asset) return;
      if (history) {
        commit((p) => ({ clips: setClipTrim(p.clips, index, inT, outT, asset.duration) }));
      } else {
        set((s) => ({
          project: { ...s.project, clips: setClipTrim(s.project.clips, index, inT, outT, asset.duration) },
        }));
      }
    },

    setClipTransition: (index, transition) =>
      commit((p) => ({ clips: setTransition(p.clips, index, transition) })),

    addTextAt: (t) => {
      commit((p) => ({ texts: addText(p.texts, t, totalDuration(p.clips)) }));
      set((s) => ({
        selectedTextId: s.project.texts[s.project.texts.length - 1]?.id ?? null,
      }));
    },

    patchText: (id, patch, history = true) => {
      if (history) commit((p) => ({ texts: updateText(p.texts, id, patch) }));
      else
        set((s) => ({
          project: { ...s.project, texts: updateText(s.project.texts, id, patch) },
        }));
    },

    deleteText: (id) => {
      commit((p) => ({ texts: removeText(p.texts, id) }));
      set((s) => (s.selectedTextId === id ? { selectedTextId: null } : s));
    },

    selectClip: (selectedClipIndex) => set({ selectedClipIndex, selectedTextId: null }),
    selectText: (selectedTextId) => set({ selectedTextId, selectedClipIndex: null }),

    beginStroke: () => set((s) => ({ _stroke: snap(s.project) })),
    endStroke: () =>
      set((s) => {
        if (!s._stroke) return { _stroke: null };
        const changed =
          s._stroke.clips !== s.project.clips || s._stroke.texts !== s.project.texts;
        if (!changed) return { _stroke: null };
        return {
          past: [...s.past, s._stroke].slice(-MAX_HISTORY),
          future: [],
          _stroke: null,
        };
      }),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return s;
        return {
          past: s.past.slice(0, -1),
          future: [snap(s.project), ...s.future].slice(0, MAX_HISTORY),
          project: { ...s.project, ...prev },
          selectedClipIndex: null,
          selectedTextId: null,
        };
      }),

    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        return {
          past: [...s.past, snap(s.project)].slice(-MAX_HISTORY),
          future: s.future.slice(1),
          project: { ...s.project, ...next },
          selectedClipIndex: null,
          selectedTextId: null,
        };
      }),

    reset: () => {
      // Revoke asset object URLs before dropping them (session hygiene).
      for (const a of Object.values(get().project.assets)) URL.revokeObjectURL(a.url);
      set({
        project: emptyProject(),
        past: [],
        future: [],
        selectedClipIndex: null,
        selectedTextId: null,
        _stroke: null,
      });
    },
  };

  /** addAsset needs both an asset record write and a clips checkpoint. */
  function commitWithAsset(
    setState: typeof set,
    asset: SourceAsset,
  ) {
    setState((s) => ({
      past: [...s.past, snap(s.project)].slice(-MAX_HISTORY),
      future: [],
      project: {
        assets: { ...s.project.assets, [asset.id]: asset },
        clips: appendClip(s.project.clips, asset),
        texts: s.project.texts,
      },
      selectedClipIndex: s.project.clips.length, // select the new clip
    }));
  }
});
