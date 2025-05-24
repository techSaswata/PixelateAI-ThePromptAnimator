import { create } from 'zustand';

export interface Scene {
  id: string;
  name: string;
  duration: number;
  startTime?: number;
}

export interface AudioTrack {
  id: string;
  type: 'voice' | 'music';
  name: string;
  duration: number;
  startTime: number;
  src: string;
}

export interface TextOverlay {
  id: string;
  text: string;
  position: { x: number; y: number };
  startTime: number;
  duration: number;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
  };
}

export interface ProjectState {
  id: string | null;
  title: string;
  prompt: string;
  manimCode: string | null;
  scenes: Scene[];
  audioTracks: AudioTrack[];
  textOverlays: TextOverlay[];
  currentTime: number;
  isPlaying: boolean;
  selectedElementId: string | null;
}

interface ProjectActions {
  setProject: (project: Partial<ProjectState>) => void;
  addScene: (scene: Scene) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  addAudioTrack: (track: AudioTrack) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (id: string) => void;
  addTextOverlay: (overlay: TextOverlay) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setSelectedElement: (id: string | null) => void;
  resetProject: () => void;
}

const initialState: ProjectState = {
  id: null,
  title: 'Untitled Project',
  prompt: '',
  manimCode: null,
  scenes: [],
  audioTracks: [],
  textOverlays: [],
  currentTime: 0,
  isPlaying: false,
  selectedElementId: null,
};

type SetState = (
  partial: Partial<ProjectState> | ((state: ProjectState) => Partial<ProjectState>)
) => void;

export const useProjectStore = create<ProjectState & ProjectActions>((set: SetState) => ({
  ...initialState,

  setProject: (project: Partial<ProjectState>) => set((state: ProjectState) => ({ ...state, ...project })),

  addScene: (scene: Scene) => set((state: ProjectState) => ({
    scenes: [...state.scenes, scene]
  })),

  updateScene: (id: string, updates: Partial<Scene>) => set((state: ProjectState) => ({
    scenes: state.scenes.map((scene: Scene) => 
      scene.id === id ? { ...scene, ...updates } : scene
    )
  })),

  removeScene: (id: string) => set((state: ProjectState) => ({
    scenes: state.scenes.filter((scene: Scene) => scene.id !== id)
  })),

  addAudioTrack: (track: AudioTrack) => set((state: ProjectState) => ({
    audioTracks: [...state.audioTracks, track]
  })),

  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => set((state: ProjectState) => ({
    audioTracks: state.audioTracks.map((track: AudioTrack) => 
      track.id === id ? { ...track, ...updates } : track
    )
  })),

  removeAudioTrack: (id: string) => set((state: ProjectState) => ({
    audioTracks: state.audioTracks.filter((track: AudioTrack) => track.id !== id)
  })),

  addTextOverlay: (overlay: TextOverlay) => set((state: ProjectState) => ({
    textOverlays: [...state.textOverlays, overlay]
  })),

  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => set((state: ProjectState) => ({
    textOverlays: state.textOverlays.map((overlay: TextOverlay) => 
      overlay.id === id ? { ...overlay, ...updates } : overlay
    )
  })),

  removeTextOverlay: (id: string) => set((state: ProjectState) => ({
    textOverlays: state.textOverlays.filter((overlay: TextOverlay) => overlay.id !== id)
  })),

  setCurrentTime: (time: number) => set({ currentTime: time }),

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  setSelectedElement: (id: string | null) => set({ selectedElementId: id }),

  resetProject: () => set(initialState),
})); 