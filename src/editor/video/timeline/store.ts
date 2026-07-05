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
  setClipAdjustments,
  setClipChroma,
  setClipSpeed,
  setClipVolume,
  addText,
  updateText,
  removeText,
  setCaptions,
  clearCaptions,
  addMusic,
  updateMusic,
  removeMusic,
  totalDuration,
  type Project,
  type SourceAsset,
  type Clip,
  type TimedText,
  type Transition,
  type Adjustments,
  type ChromaKey,
  type MusicTrack,
} from "./model";

interface HistoryEntry {
  clips: Clip[];
  texts: TimedText[];
  music: MusicTrack[];
}

const MAX_HISTORY = 40;

function snap(p: Project): HistoryEntry {
  return { clips: p.clips, texts: p.texts, music: p.music }; // arrays are immutable (ops copy)
}

interface TimelineState {
  project: Project;
  past: HistoryEntry[];
  future: HistoryEntry[];
  selectedClipIndex: number | null;
  selectedTextId: string | null;
  selectedMusicId: string | null;
  _stroke: HistoryEntry | null;

  addAsset: (asset: SourceAsset) => void;
  splitAtTime: (t: number) => void;
  deleteClip: (index: number) => void;
  moveClipBy: (index: number, dir: -1 | 1) => void;
  trimClip: (index: number, inT: number, outT: number, history?: boolean) => void;
  setClipTransition: (index: number, transition: Transition) => void;
  setClipAdjustments: (index: number, adjustments: Adjustments, history?: boolean) => void;
  setClipChroma: (index: number, chroma: ChromaKey, history?: boolean) => void;
  setClipSpeed: (index: number, speed: number, history?: boolean) => void;
  setClipVolume: (index: number, volume: number, history?: boolean) => void;

  addTextAt: (t: number) => void;
  patchText: (id: string, patch: Partial<TimedText>, history?: boolean) => void;
  deleteText: (id: string) => void;

  addMusicTrack: (init: Parameters<typeof addMusic>[1]) => void;
  patchMusic: (id: string, patch: Partial<MusicTrack>, history?: boolean) => void;
  deleteMusic: (id: string) => void;

  setCaptions: (segments: Array<{ text: string; start: number; end: number }>) => void;
  clearCaptions: () => void;

  selectClip: (index: number | null) => void;
  selectText: (id: string | null) => void;
  selectMusic: (id: string | null) => void;

  loadProjectData: (project: Project) => void;

  beginStroke: () => void;
  endStroke: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useTimeline = create<TimelineState>((set, get) => {
  /** Apply a clips/texts change with a history checkpoint. */
  function commit(mutate: (p: Project) => Partial<Pick<Project, "clips" | "texts" | "music">>) {
    set((s) => {
      const changes = mutate(s.project);
      const changed =
        (changes.clips && changes.clips !== s.project.clips) ||
        (changes.texts && changes.texts !== s.project.texts) ||
        (changes.music && changes.music !== s.project.music);
      if (!changed) return s;
      return {
        past: [...s.past, snap(s.project)].slice(-MAX_HISTORY),
        future: [],
        project: { ...s.project, ...changes },
      };
    });
  }

  /** Live (no-history) project patch for slider drags. */
  function live(mutate: (p: Project) => Partial<Pick<Project, "clips" | "texts" | "music">>) {
    set((s) => ({ project: { ...s.project, ...mutate(s.project) } }));
  }

  return {
    project: emptyProject(),
    past: [],
    future: [],
    selectedClipIndex: null,
    selectedTextId: null,
    selectedMusicId: null,
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

    setClipAdjustments: (index, adjustments, history = true) => {
      if (history) commit((p) => ({ clips: setClipAdjustments(p.clips, index, adjustments) }));
      else
        set((s) => ({
          project: { ...s.project, clips: setClipAdjustments(s.project.clips, index, adjustments) },
        }));
    },

    setClipChroma: (index, chroma, history = true) => {
      if (history) commit((p) => ({ clips: setClipChroma(p.clips, index, chroma) }));
      else
        set((s) => ({
          project: { ...s.project, clips: setClipChroma(s.project.clips, index, chroma) },
        }));
    },

    setClipSpeed: (index, speed, history = true) => {
      const mut = (p: Project) => ({ clips: setClipSpeed(p.clips, index, speed) });
      history ? commit(mut) : live(mut);
    },

    setClipVolume: (index, volume, history = true) => {
      const mut = (p: Project) => ({ clips: setClipVolume(p.clips, index, volume) });
      history ? commit(mut) : live(mut);
    },

    addMusicTrack: (init) => {
      commit((p) => ({ music: addMusic(p.music, init) }));
      set((s) => ({ selectedMusicId: s.project.music[s.project.music.length - 1]?.id ?? null }));
    },

    patchMusic: (id, patch, history = true) => {
      const mut = (p: Project) => ({ music: updateMusic(p.music, id, patch) });
      history ? commit(mut) : live(mut);
    },

    deleteMusic: (id) => {
      commit((p) => ({ music: removeMusic(p.music, id) }));
      set((s) => (s.selectedMusicId === id ? { selectedMusicId: null } : s));
    },

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

    setCaptions: (segments) => commit((p) => ({ texts: setCaptions(p.texts, segments) })),
    clearCaptions: () => commit((p) => ({ texts: clearCaptions(p.texts) })),

    selectClip: (selectedClipIndex) =>
      set({ selectedClipIndex, selectedTextId: null, selectedMusicId: null }),
    selectText: (selectedTextId) =>
      set({ selectedTextId, selectedClipIndex: null, selectedMusicId: null }),
    selectMusic: (selectedMusicId) =>
      set({ selectedMusicId, selectedClipIndex: null, selectedTextId: null }),

    beginStroke: () => set((s) => ({ _stroke: snap(s.project) })),
    endStroke: () =>
      set((s) => {
        if (!s._stroke) return { _stroke: null };
        const changed =
          s._stroke.clips !== s.project.clips ||
          s._stroke.texts !== s.project.texts ||
          s._stroke.music !== s.project.music;
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
          selectedMusicId: null,
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
          selectedMusicId: null,
        };
      }),

    loadProjectData: (project) => {
      const old = get().project;
      for (const a of Object.values(old.assets)) URL.revokeObjectURL(a.url);
      for (const m of old.music) URL.revokeObjectURL(m.url);
      set({
        project,
        past: [],
        future: [],
        selectedClipIndex: project.clips.length ? 0 : null,
        selectedTextId: null,
        selectedMusicId: null,
        _stroke: null,
      });
    },

    reset: () => {
      // Revoke asset + music object URLs before dropping them (session hygiene).
      const p = get().project;
      for (const a of Object.values(p.assets)) URL.revokeObjectURL(a.url);
      for (const m of p.music) URL.revokeObjectURL(m.url);
      set({
        project: emptyProject(),
        past: [],
        future: [],
        selectedClipIndex: null,
        selectedTextId: null,
        selectedMusicId: null,
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
        music: s.project.music,
      },
      selectedClipIndex: s.project.clips.length, // select the new clip
    }));
  }
});
