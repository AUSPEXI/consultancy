import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Video, Volume2, Upload, Check,
  Laptop, Film, ExternalLink, Sliders, Music,
  Download, Clipboard, HelpCircle, Eye, EyeOff
} from 'lucide-react';
import { STORYBOARD_DATA as BASE_STORYBOARD, DEFAULT_PROJECT } from '../data/storyboard';
import { StoryboardPanel, StoryboardProject } from '../types';
import {
  loadActiveProject,
  saveActiveProject,
  validateProject,
  deriveAutoBroll,
  CURRENT_SCHEMA_VERSION,
} from '../utils/project';
import { 
  saveAudioFile,
  getAudioFile,
  deleteAudioFile,
  saveBrollFile,
  getAllBrollFiles,
  deleteBrollFile,
  saveGenericFile,
  getGenericFile,
  deleteGenericFile
} from '../utils/indexedDb';

// Web Audio API Sound FX Synthesizer for ambient Sci-Fi logs
class CinematicSynth {
  ctx: AudioContext | null = null;
  mainMix: GainNode | null = null;
  recDestination: MediaStreamAudioDestinationNode | null = null;
  audioSourceNode: MediaElementAudioSourceNode | null = null;
  droneOsc1: OscillatorNode | null = null;
  droneOsc2: OscillatorNode | null = null;
  droneGain: GainNode | null = null;
  filterNode: BiquadFilterNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.mainMix = this.ctx.createGain();
      this.mainMix.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.mainMix.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  getMainMix(): GainNode | null {
    this.init();
    return this.mainMix;
  }

  // Bind-once helper to route narrator soundtrack element through our Web Audio synthesizer
  bindAudioElement(audioElement: HTMLAudioElement) {
    this.init();
    if (!this.ctx || !this.mainMix) return;
    if (this.audioSourceNode) return; // Already bound
    
    try {
      this.audioSourceNode = this.ctx.createMediaElementSource(audioElement);
      this.audioSourceNode.connect(this.mainMix);
    } catch (e) {
      console.warn("MediaElementAudioSourceNode initialization or routing binding blocked:", e);
    }
  }

  startDrone() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // Guard to avoid starting multiple sound drones simultaneously and leaking old oscillators
    if (this.droneOsc1 || this.droneOsc2) {
      return;
    }

    try {
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();
      this.droneGain = this.ctx.createGain();
      this.filterNode = this.ctx.createBiquadFilter();

      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.setValueAtTime(55.00, this.ctx.currentTime); // A1 deep hum

      this.droneOsc2.type = 'triangle';
      this.droneOsc2.frequency.setValueAtTime(82.41, this.ctx.currentTime); // E2 hum

      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(90, this.ctx.currentTime); // Deep cinema low rumble
      this.filterNode.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.droneGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1.2); // Soft ambient cinematic hum (not loud buzz)

      this.droneOsc1.connect(this.filterNode);
      this.droneOsc2.connect(this.filterNode);
      this.filterNode.connect(this.droneGain);
      
      const mix = this.getMainMix();
      if (mix) {
        this.droneGain.connect(mix);
      } else {
        this.droneGain.connect(this.ctx.destination);
      }

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch (e) {
      console.warn("Synth drone err", e);
    }
  }

  stopDrone() {
    if (!this.ctx) return;
    const g = this.droneGain;
    const osc1 = this.droneOsc1;
    const osc2 = this.droneOsc2;

    // Immediately clear state variables to prevent duplicates
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.filterNode = null;

    if (g) {
      try {
        g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      } catch (err) {}
    }

    setTimeout(() => {
      try {
        osc1?.stop();
        osc1?.disconnect();
      } catch (err) {}
      try {
        osc2?.stop();
        osc2?.disconnect();
      } catch (err) {}
      try {
        g?.disconnect();
      } catch (err) {}
    }, 400);
  }

  playBeep(freq = 600, duration = 0.1) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      
      const mix = this.getMainMix();
      if (mix) {
        gain.connect(mix);
      } else {
        gain.connect(this.ctx.destination);
      }
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
}

const synth = new CinematicSynth();

// Helper to reliably extract Youtube ID from generic links or raw 11 char ids
function getYouTubeId(urlOrId: string): string {
  if (!urlOrId) return 'lT6V6A-v0kU'; // default fallback ID (Simpson's Paradox video)
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = urlOrId.match(regExp);
  return (match && match[2].length === 11) ? match[2] : urlOrId.trim();
}

interface BRollVideoPlayerProps {
  src: string;
  isActive: boolean;
  onVideoEnded?: () => void;
  className?: string;
  style?: React.CSSProperties;
  key?: React.Key;
}

function BRollVideoPlayer({ src, isActive, onVideoEnded, className, style }: BRollVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasEndedTriggeredRef = useRef<boolean>(false);

  // Load resources only when src changes, preventing restarts on state trigger shifts
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    hasEndedTriggeredRef.current = false;
  }, [src]);

  // Play and pause based on active playback state transitions without reloading
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      if (video.ended || video.currentTime >= video.duration - 0.1) {
        video.currentTime = 0;
      }
      hasEndedTriggeredRef.current = false; // Reset on resume/play
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("B-roll video play was prevented:", error);
        });
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const dur = video.duration;
    const cur = video.currentTime;
    if (dur && dur > 0 && !isNaN(dur) && !hasEndedTriggeredRef.current) {
      // AI Gen videos usually put overlay text / instructions in the final 1.2 seconds of the clip.
      // By ending early at dur - 1.2s, we cut clean before the AI slop manifests.
      const clipThreshold = dur > 2.0 ? dur - 1.2 : dur - 0.2;
      if (cur >= clipThreshold) {
        hasEndedTriggeredRef.current = true;
        video.pause();
        if (onVideoEnded) {
          onVideoEnded();
        }
      }
    }
  };

  const handleEnded = () => {
    if (!hasEndedTriggeredRef.current) {
      hasEndedTriggeredRef.current = true;
      if (onVideoEnded) {
        onVideoEnded();
      }
    }
  };

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={style}
      muted
      playsInline
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
}

export default function StoryboardExplorer() {
  // ── Active project (data-driven storyboard) ──────────────────────────────
  // The whole app is driven by the loaded experiment's panels. Defaults to the
  // shipped experiment-001 project; importing another project swaps it at runtime.
  const [activeProject, setActiveProject] = useState<StoryboardProject>(() => loadActiveProject() ?? DEFAULT_PROJECT);
  const storyboard = activeProject.panels ?? BASE_STORYBOARD;
  // Alias so every existing `STORYBOARD_DATA.*` reference reads the live storyboard.
  const STORYBOARD_DATA = storyboard;
  const projectFileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPanelId, setSelectedPanelId] = useState<number>(1);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthEnabled, setIsSynthEnabled] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'auto' | 'free'>('auto');
  const [userAudioFile, setUserAudioFile] = useState<File | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  
  // Audio volume multiplier
  const [audioVolume, setAudioVolume] = useState<number>(1.0);

  // Player mode toggle: 'youtube' vs 'simulation'
  const [playerMode, setPlayerMode] = useState<'simulation' | 'youtube'>('simulation');
  const [youtubeUrlOrId, setYoutubeUrlOrId] = useState<string>('lT6V6A-v0kU'); // Default Simpson's paradox data educational video
  
  // Screen recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [ytPlayerReady, setYtPlayerReady] = useState<boolean>(false);

  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const outroVideoRef = useRef<HTMLVideoElement | null>(null);

  // New audio auto-timing states
  const [scaleTimingsToAudio, setScaleTimingsToAudio] = useState<boolean>(true);
  const [audioDuration, setAudioDuration] = useState<number>(330);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [autoFullscreenOnRecord, setAutoFullscreenOnRecord] = useState<boolean>(true);
  const [customBrollUrls, setCustomBrollUrls] = useState<Record<number, { url: string; isVideo: boolean }>>({});
  const [panelOffsets, setPanelOffsets] = useState<Record<number, number>>({});
  // Editable per-panel timing overrides (seconds). A panel's start/end default to
  // the auto-scaled timeline; type a value here to pin it exactly. Stored separately
  // so you can edit just the panels that drift.
  const [manualPanelStarts, setManualPanelStarts] = useState<Record<number, number>>(() => {
    try {
      const s = localStorage.getItem('manualPanelStarts');
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  });
  const [manualPanelEnds, setManualPanelEnds] = useState<Record<number, number>>(() => {
    try {
      const s = localStorage.getItem('manualPanelEnds');
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  });
  const [syncCalibrating, setSyncCalibrating] = useState<boolean>(false);
  const [syncMarkIndex, setSyncMarkIndex] = useState<number>(0);
  const [isBRollFeedEnabled, setIsBRollFeedEnabled] = useState<boolean>(true);
  const [cameraTarget, setCameraTarget] = useState<'main' | 'broll'>('main');
  const [copiedBrollId, setCopiedBrollId] = useState<string | null>(null);
  const [isCookbookOpen, setIsCookbookOpen] = useState<boolean>(true);

  // Intro and Outro controller states
  const [isIntroEnabled, setIsIntroEnabled] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('isIntroEnabled');
      return s !== null ? s === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [isOutroEnabled, setIsOutroEnabled] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem('isOutroEnabled');
      return s !== null ? s === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [currentSequence, setCurrentSequence] = useState<'intro' | 'storyboard' | 'outro'>('storyboard');
  const [introDuration, setIntroDuration] = useState<number>(10.0);
  const [outroDuration, setOutroDuration] = useState<number>(10.0);
  const [introTimeElapsed, setIntroTimeElapsed] = useState<number>(0);
  const [outroTimeElapsed, setOutroTimeElapsed] = useState<number>(0);

  const [customIntroUrl, setCustomIntroUrl] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [customOutroUrl, setCustomOutroUrl] = useState<{ url: string; isVideo: boolean } | null>(null);
  // Seeded from the active project: explicit autoBrollPanels if exported, else the
  // panels flagged hasBRoll in the storyboard. No longer a hardcoded magic list.
  const [autoBrollPanels, setAutoBrollPanels] = useState<Record<number, boolean>>(
    () => activeProject.autoBrollPanels ?? deriveAutoBroll(activeProject.panels)
  );

  const [brollDisplayPanel, setBrollDisplayPanel] = useState<StoryboardPanel>(STORYBOARD_DATA[0]);
  const [brollZoomed, setBrollZoomed] = useState<boolean>(false);
  const [brollPlaying, setBrollPlaying] = useState<boolean>(false);
  const [isBrollActiveState, setIsBrollActiveState] = useState<boolean>(false);
  const [lastPlayedBrollPanelId, setLastPlayedBrollPanelId] = useState<number | null>(null);

  const getBRollTitle = (phase: string) => {
    switch (phase) {
      case 'Hook': return "THE 4-ENGINE RACETRACK";
      case 'Hypothesis': return "ANCHOR GROUNDING CODENAME";
      case 'Method': return "CARBONITE SECURITY COMMITS";
      case 'The Danger': return "HAMSTER ORBIT SCALE TILT";
      case 'The Run': return "ROBOT TERMINAL BURN";
      case 'Results': return "CANINE BONE ACCREDITATION";
      case 'The Fix': return "MUSCULAR ANT 10x ODDS";
      case 'Rigor': return "ROBOT JUDGE NOODLE TRIAL";
      case 'Threats': return "HAMSTER ROCKET SNEAKER RUN";
      case 'Takeaway': return "CHALKBOARD SHOWDOWN";
      case 'Outro': return "ANVIL SUBSCRIBE CONFETTI BLAST";
      default: return "GOLDEN STATISTICS NUGGET";
    }
  };

  const getBRollDesc = (phase: string) => {
    switch (phase) {
      case 'Hook': return "Four different supercomputers on actual human legs (Gemini, Claude, ChatGPT, Perplexity) sprinting through a muddy obstacle course. One slips on a banana peel, sending paper charts and loose RAM chips flying into the air.";
      case 'Hypothesis': return "A heavy golden anchor marked '43%' dropping onto an LLM's server cabinet, keeping it from floating away into vague sales hype.";
      case 'Method': return "An over-dramatic cyber-soldier with glowing laser goggles carefully placing a tiny USB drive into a giant bank vault, then doing a ridiculous celebratory backflip.";
      case 'The Danger': return "A giant balancing scale. On the left tray sits a tiny hamster with glasses reading. On the right tray, an oversized glazed donut falls from the sky, sending the hamster flying into low earth orbit! (Simpson's Paradox)";
      case 'The Run': return "An exhausted retro robot typing frantically on red-hot mechanical keyboards with smoke pouring out of its mechanical metallic ears.";
      case 'Results': return "A distinguished golden retriever scientist in a white lab coat and safety goggles staring intensely at a flatlining heart monitor that suddenly jumps up 31% to form a massive glowing bone.";
      case 'The Fix': return "An absurdly muscular, tiny worker ant wearing a miniature hard hat, proudly carrying a solid gold trophy 10 times its size past a very confused laboratory cat.";
      case 'Rigor': return "A high-polished gold robot sitting behind a grand judge's desk, wearing a white curly wig and looking through a giant magnifying glass at a single ramen noodle on a silver platter with absolute solemnity.";
      case 'Threats': return "A realistic hamster wearing a tiny racing helmet inside a red sneaker with a rocket booster duct-taped to the heel, speeding down a track at Mach-3 with loose papers flying.";
      case 'Takeaway': return "A futuristic digital chalkboard with the formula '43% > VAGUE WORDS' written in vibrant chalk, while a cartoon chalk eraser runs away scared.";
      case 'Outro': return "A modern tech studio desk where a giant red 'SUBSCRIBE' play button drops from the ceiling like an anvil, causing an explosion of confetti that lands on a surprised cat's head.";
      default: return "A lucky golden standard coin bearing the face of a statistical wizard wearing cool electronic glasses.";
    }
  };



  const timeToSeconds = (timeStr: string) => {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const secondsToTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 24);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `00:${pad(mins)}:${pad(secs)}:${pad(ms)}`;
  };

  // The length the panels were authored against. Auto-scaling fits that authored
  // timeline onto the loaded audio, so the divisor MUST be this baseline (not a
  // hardcoded constant) — otherwise re-timing the storyboard would silently
  // re-stretch every panel.
  const baselineSec = activeProject.baselineDurationSec ?? 330;
  const totalDuration = (scaleTimingsToAudio && userAudioUrl && audioDuration > 0) ? audioDuration : baselineSec;
  const selectedPanel = STORYBOARD_DATA.find(p => p.panelId === selectedPanelId) || STORYBOARD_DATA[0];

  // The auto-scaled (or offset-nudged) start for a panel — the baseline before
  // any manual edit.
  const scaledPanelStart = (panel: StoryboardPanel) => {
    const originalStart = timeToSeconds(panel.startTime);
    const activeOffset = panelOffsets[panel.panelId] ?? 0;
    const shifted = Math.max(0, originalStart + activeOffset);
    if (scaleTimingsToAudio && userAudioUrl && audioDuration > 0) {
      return Number((shifted * (audioDuration / baselineSec)).toFixed(2));
    }
    return Number(shifted.toFixed(2));
  };

  const scaledPanelEnd = (panel: StoryboardPanel) => {
    const originalEnd = timeToSeconds(panel.endTime);
    const activeOffset = panelOffsets[panel.panelId] ?? 0;
    const shifted = Math.max(0, originalEnd + activeOffset);
    if (scaleTimingsToAudio && userAudioUrl && audioDuration > 0) {
      return Number((shifted * (audioDuration / baselineSec)).toFixed(2));
    }
    return Number(shifted.toFixed(2));
  };

  // The effective start of a panel: an edited value wins; otherwise the baseline.
  const resolvePanelStart = (panel: StoryboardPanel) => {
    if (!syncCalibrating && manualPanelStarts[panel.panelId] !== undefined) {
      return Number(manualPanelStarts[panel.panelId].toFixed(2));
    }
    return scaledPanelStart(panel);
  };

  const nextPanelOf = (panelId: number): StoryboardPanel | null => {
    const idx = STORYBOARD_DATA.findIndex(p => p.panelId === panelId);
    return (idx >= 0 && idx < STORYBOARD_DATA.length - 1) ? STORYBOARD_DATA[idx + 1] : null;
  };

  // A panel's end IS the next panel's start — one shared boundary, so a panel can
  // never end out of step with the one that follows. Only the final panel has its
  // own independent end.
  const resolvePanelEnd = (panel: StoryboardPanel) => {
    const next = nextPanelOf(panel.panelId);
    if (next) return resolvePanelStart(next);
    if (!syncCalibrating && manualPanelEnds[panel.panelId] !== undefined) {
      return Number(manualPanelEnds[panel.panelId].toFixed(2));
    }
    return scaledPanelEnd(panel);
  };

  // Is this panel's end (i.e. the next panel's start) a hand-edited value?
  const isPanelEndEdited = (panelId: number) => {
    const next = nextPanelOf(panelId);
    return next ? manualPanelStarts[next.panelId] !== undefined : manualPanelEnds[panelId] !== undefined;
  };
  // Key fragment so an End input remounts whenever its underlying value changes.
  const panelEndKey = (panelId: number) => {
    const next = nextPanelOf(panelId);
    return next ? (manualPanelStarts[next.panelId] ?? 'a') : (manualPanelEnds[panelId] ?? 'a');
  };

  const getPanelTimings = (panel: StoryboardPanel) => {
    const start = resolvePanelStart(panel);
    let end = resolvePanelEnd(panel);
    if (!(end > start)) end = start + 0.5;
    return { start: Number(start.toFixed(2)), end: Number(end.toFixed(2)) };
  };

  // ── Editable panel start / end times ─────────────────────────────────────
  // Parse "90", "1:30" or "1:30.5" into seconds.
  const parseTimeInput = (raw: string): number | null => {
    const s = (raw || '').trim();
    if (!s) return null;
    if (s.includes(':')) {
      const parts = s.split(':').map(x => parseFloat(x));
      if (parts.some(n => isNaN(n))) return null;
      const m = parts.length === 2 ? parts[0] : 0;
      const sec = parts.length === 2 ? parts[1] : parts[0];
      return m * 60 + sec;
    }
    const v = parseFloat(s);
    return isNaN(v) ? null : v;
  };

  const setPanelStart = (panelId: number, seconds: number) => {
    if (!isFinite(seconds)) return;
    const v = Math.max(0, Number(seconds.toFixed(2)));
    setManualPanelStarts(prev => ({ ...prev, [panelId]: v }));
  };

  // Editing a panel's end moves the shared boundary: for any non-final panel that
  // means setting the NEXT panel's start, so the two stay matched automatically.
  const setPanelEnd = (panelId: number, seconds: number) => {
    if (!isFinite(seconds)) return;
    const v = Math.max(0, Number(seconds.toFixed(2)));
    const next = nextPanelOf(panelId);
    if (next) {
      setManualPanelStarts(prev => ({ ...prev, [next.panelId]: v }));
    } else {
      setManualPanelEnds(prev => ({ ...prev, [panelId]: v }));
    }
  };

  const setPanelStartToPlayhead = (panel: StoryboardPanel) => {
    const t = audioRef.current ? audioRef.current.currentTime : currentTimeSec;
    setPanelStart(panel.panelId, t);
    if (isSynthEnabled) synth.playBeep(760, 0.06);
  };

  const setPanelEndToPlayhead = (panel: StoryboardPanel) => {
    const t = audioRef.current ? audioRef.current.currentTime : currentTimeSec;
    setPanelEnd(panel.panelId, t);
    if (isSynthEnabled) synth.playBeep(700, 0.06);
  };

  const clearPanelStart = (panelId: number) => {
    setManualPanelStarts(prev => { const c = { ...prev }; delete c[panelId]; return c; });
    if (isSynthEnabled) synth.playBeep(440, 0.05);
  };

  const clearPanelEnd = (panelId: number) => {
    const next = nextPanelOf(panelId);
    if (next) {
      setManualPanelStarts(prev => { const c = { ...prev }; delete c[next.panelId]; return c; });
    } else {
      setManualPanelEnds(prev => { const c = { ...prev }; delete c[panelId]; return c; });
    }
    if (isSynthEnabled) synth.playBeep(420, 0.05);
  };

  // Smooth transitioning delay for B-Roll assets to prevent jarring content flashes
  const prevIsBrollActiveRef = useRef<boolean>(false);
  const prevSelectedPanelIdRef = useRef<number>(-1);
  const brollDisplayTimeoutRef = useRef<number | null>(null);
  const brollTransitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('manualPanelStarts', JSON.stringify(manualPanelStarts));
    } catch (e) {}
  }, [manualPanelStarts]);

  useEffect(() => {
    try {
      localStorage.setItem('manualPanelEnds', JSON.stringify(manualPanelEnds));
    } catch (e) {}
  }, [manualPanelEnds]);

  useEffect(() => {
    try {
      localStorage.setItem('isIntroEnabled', String(isIntroEnabled));
    } catch (e) {}
  }, [isIntroEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('isOutroEnabled', String(isOutroEnabled));
    } catch (e) {}
  }, [isOutroEnabled]);

  // Startup loader: Load all persisted media files (Audio track, B-rolls, Custom Intro/Outro) from IndexedDB
  useEffect(() => {
    let active = true;

    async function loadPersistedData() {
      try {
        // 1. Load Custom Voiceover Narration Track
        const audioData = await getAudioFile();
        if (audioData && active) {
          const fileObj = new File([audioData.file], audioData.name, { type: audioData.file.type });
          setUserAudioFile(fileObj);
          const url = URL.createObjectURL(fileObj);
          setUserAudioUrl(url);
          // Set to simulation mode to use the loaded track
          setPlayerMode('simulation');
        }

        // 2. Load Custom B-rolls for each scene slot
        const brollData = await getAllBrollFiles();
        if (brollData.length > 0 && active) {
          const brollUrls: Record<number, { url: string; isVideo: boolean }> = {};
          brollData.forEach(item => {
            const fileObj = new File([item.file], item.name, { type: item.file.type });
            const url = URL.createObjectURL(fileObj);
            brollUrls[item.panelId] = { url, isVideo: item.isVideo };
          });
          setCustomBrollUrls(prev => ({ ...prev, ...brollUrls }));
        }

        // 3. Load Custom Intro Media
        const introData = await getGenericFile('custom_intro_media');
        if (introData && active) {
          const fileObj = new File([introData.file], introData.name, { type: introData.file.type });
          const url = URL.createObjectURL(fileObj);
          setCustomIntroUrl({ url, isVideo: introData.metadata?.isVideo ?? false });
        }

        // 4. Load Custom Outro Media
        const outroData = await getGenericFile('custom_outro_media');
        if (outroData && active) {
          const fileObj = new File([outroData.file], outroData.name, { type: outroData.file.type });
          const url = URL.createObjectURL(fileObj);
          setCustomOutroUrl({ url, isVideo: outroData.metadata?.isVideo ?? false });
        }
      } catch (err) {
        console.warn("Failed to retrieve saved user media uploads from IndexedDB:", err);
      }
    }

    loadPersistedData();

    return () => {
      active = false;
    };
  }, []);

  // Synchronise play/pause state of custom intro/outro videos
  useEffect(() => {
    const introV = introVideoRef.current;
    const outroV = outroVideoRef.current;

    if (playerMode === 'simulation' && isPlaying) {
      if (currentSequence === 'intro' && introV) {
        introV.play().catch(err => console.warn("Intro play prevented:", err));
      } else if (introV) {
        introV.pause();
      }

      if (currentSequence === 'outro' && outroV) {
        outroV.play().catch(err => console.warn("Outro play prevented:", err));
      } else if (outroV) {
        outroV.pause();
      }
    } else {
      if (introV) introV.pause();
      if (outroV) outroV.pause();
    }
  }, [isPlaying, currentSequence, playerMode, customIntroUrl, customOutroUrl]);

  useEffect(() => {
    if (introVideoRef.current) {
      introVideoRef.current.load();
    }
  }, [customIntroUrl?.url]);

  useEffect(() => {
    if (outroVideoRef.current) {
      outroVideoRef.current.load();
    }
  }, [customOutroUrl?.url]);

  useEffect(() => {
    // 1. Calculate active B-Roll state for the CURRENT selectedPanel
    const timings = getPanelTimings(selectedPanel);
    const dur = timings.end - timings.start;
    const elapsed = currentTimeSec - timings.start;
    const isSelectedPanelBrollAutoActive = autoBrollPanels[selectedPanel.panelId] && lastPlayedBrollPanelId !== selectedPanel.panelId;
    const isAutoBrollFocused = cameraMode === 'auto' && isPlaying && dur > 0 && isSelectedPanelBrollAutoActive && (elapsed / dur > 0.55);
    const isBrollActive = isAutoBrollFocused || (cameraMode === 'free' && cameraTarget === 'broll');

    if (isBrollActive !== isBrollActiveState) {
      setIsBrollActiveState(isBrollActive);
    }
  }, [selectedPanel, currentTimeSec, isPlaying, cameraMode, cameraTarget, autoBrollPanels, isBrollActiveState, lastPlayedBrollPanelId]);

  // Reset lastPlayedBrollPanelId when playhead resets to 0
  useEffect(() => {
    if (currentTimeSec === 0) {
      setLastPlayedBrollPanelId(null);
    }
  }, [currentTimeSec]);

  // Define handleVideoEnded callback to gracefully zoom out only after video stops playing
  const handleVideoEnded = () => {
    setBrollPlaying(false);
    if (brollTransitionTimeoutRef.current) {
      window.clearTimeout(brollTransitionTimeoutRef.current);
      brollTransitionTimeoutRef.current = null;
    }

    if (brollZoomed) {
      setBrollZoomed(false);
      if (brollDisplayTimeoutRef.current) {
        window.clearTimeout(brollDisplayTimeoutRef.current);
      }
      brollDisplayTimeoutRef.current = window.setTimeout(() => {
        setBrollDisplayPanel(selectedPanel);
        brollDisplayTimeoutRef.current = null;
      }, 850);
    }
  };

  useEffect(() => {
    const isBrollActive = isBrollActiveState;
    const activePanelIdChanged = prevSelectedPanelIdRef.current !== selectedPanel.panelId;
    const brollActiveStatusShifted = prevIsBrollActiveRef.current !== isBrollActive;

    if (brollActiveStatusShifted || (isBrollActive && activePanelIdChanged)) {
      if (isBrollActive) {
        // --- TRANSITION TO FULLSCREEN B-ROLL ---
        // Zoom in immediately (viewport starts expanding)
        setBrollZoomed(true);
        // Play is initially false while zooming
        setBrollPlaying(false);
        setLastPlayedBrollPanelId(selectedPanel.panelId);

        // Cancel any pending hold timeouts; load content immediately for entry zoom
        if (brollDisplayTimeoutRef.current) {
          window.clearTimeout(brollDisplayTimeoutRef.current);
          brollDisplayTimeoutRef.current = null;
        }
        setBrollDisplayPanel(selectedPanel);

        // Delay start of video playback by 800ms to allow zoom-in animation to finish first!
        if (brollTransitionTimeoutRef.current) {
          window.clearTimeout(brollTransitionTimeoutRef.current);
        }
        brollTransitionTimeoutRef.current = window.setTimeout(() => {
          setBrollPlaying(true);
          brollTransitionTimeoutRef.current = null;
        }, 800);

      } else {
        // --- TRANSITION BACK TO SMALL B-ROLL ---
        // If cameraMode is auto AND we have a video that is still playing, we DO NOT zoom out yet!
        // The handleVideoEnded callback will automatically zoom out when the B-Roll video finishes its playback.
        const hasBrollVideo = !!customBrollUrls[selectedPanel.panelId]?.url && !!customBrollUrls[selectedPanel.panelId]?.isVideo;

        // Keep the camera zoomed while a B-roll video is mid zoom-in delay (a play
        // timer is still pending) OR actively playing — handleVideoEnded performs
        // the zoom-out when the clip really finishes. Without checking the pending
        // timer, a B-roll that deactivates during the 800ms zoom-in delay would
        // cancel the play timer and zoom straight back out without ever playing.
        if (cameraMode === 'auto' && hasBrollVideo && (brollPlaying || brollTransitionTimeoutRef.current !== null)) {
          // Do nothing! Wait for handleVideoEnded
        } else {
          setBrollPlaying(false);
          if (brollTransitionTimeoutRef.current) {
            window.clearTimeout(brollTransitionTimeoutRef.current);
            brollTransitionTimeoutRef.current = null;
          }

          if (brollZoomed) {
            // Zoom out immediately (viewport starts shrinking)
            setBrollZoomed(false);

            // Keep displaying previous panel's content during zoom-out transition (delay package load for 850ms)
            if (brollDisplayTimeoutRef.current) {
              window.clearTimeout(brollDisplayTimeoutRef.current);
            }
            brollDisplayTimeoutRef.current = window.setTimeout(() => {
              setBrollDisplayPanel(selectedPanel);
              brollDisplayTimeoutRef.current = null;
            }, 850);
          } else {
            // Fully zoomed out (small widget style) - update content immediately upon manual click around scenes
            if (brollDisplayTimeoutRef.current) {
              window.clearTimeout(brollDisplayTimeoutRef.current);
              brollDisplayTimeoutRef.current = null;
            }
            setBrollDisplayPanel(selectedPanel);
          }
        }
      }
    } else {
      // Keep feed element in sync when not in fullscreen B-Roll mode
      if (!isBrollActive && !brollZoomed && brollDisplayPanel?.panelId !== selectedPanel.panelId) {
        setBrollDisplayPanel(selectedPanel);
      }
    }

    prevIsBrollActiveRef.current = isBrollActive;
    prevSelectedPanelIdRef.current = selectedPanel.panelId;
  }, [isBrollActiveState, selectedPanel, brollZoomed, brollDisplayPanel, cameraMode, brollPlaying, customBrollUrls]);

  useEffect(() => {
    return () => {
      if (brollTransitionTimeoutRef.current) {
        window.clearTimeout(brollTransitionTimeoutRef.current);
      }
      if (brollDisplayTimeoutRef.current) {
        window.clearTimeout(brollDisplayTimeoutRef.current);
      }
    };
  }, []);

  // HIGH FIDELITY GRAPHIC SLIDES SHOWCASING EACH RESPECTIVE SCENE (36 CUSTOM SCREENS)
  const renderVisualScreen = () => {
    const id = selectedPanel.panelId;
    const phase = selectedPanel.phase;
    const pulseRingClass = "absolute inset-0 rounded-full border border-[#ff007f]/40 animate-ping opacity-60 pointer-events-none";

    switch(phase) {
      case 'Hook':
        if (id === 1) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 text-center relative border border-zinc-800/40 rounded col-span-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,127,0.08)_0%,transparent_70%)] pointer-events-none animate-pulse" />
              <span className="text-[8px] font-mono text-[#ff007f] uppercase tracking-widest font-bold mb-1 hidden">[🎬 Hook - Panel #1]</span>
              <h2 className="text-lg font-mono font-black text-white tracking-wide border-b border-white/5 pb-1 max-w-sm">
                GEO CITATION BENCHMARK SHIFT
              </h2>
              <div className="flex items-center gap-4 mt-3 relative z-10">
                <div className="bg-zinc-900/90 border border-zinc-800 p-2.5 rounded text-center w-24">
                  <span className="text-[6.5px] text-zinc-500 block uppercase font-mono">Control A</span>
                  <span className="text-xl font-serif font-extrabold text-zinc-400">25%</span>
                </div>
                <div className="text-xl text-zinc-705 font-black text-zinc-500">&rarr;</div>
                <div className="bg-[#ff007f]/10 border border-[#ff007f] p-2.5 rounded text-center w-24 relative shadow-[0_0_15px_rgba(255,0,127,0.2)]">
                  <div className={pulseRingClass} style={{ animationDuration: '2.5s' }} />
                  <span className="text-[7px] text-[#ff007f] block uppercase font-mono font-black">Treatment B</span>
                  <span className="text-2xl font-serif font-black text-white animate-pulse">100%</span>
                </div>
              </div>
              <p className="text-[8.5px] text-zinc-400 mt-3 leading-relaxed font-sans max-w-xs">
                Swapping simple descriptive phrases for precise numbers drives search model retrieval weight directly into your content.
              </p>
            </div>
          );
        } else if (id === 2) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-[#ff007f] uppercase tracking-widest font-black mb-1 hidden">[🎬 Hook - Panel #2]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 text-center mb-2 uppercase tracking-wide">The 4-Engine Comparative Matrix</h3>
              <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-1">
                {[
                  { name: 'Claude', desc: 'Anthropic', color: 'border-violet-500/30 text-violet-400 bg-violet-950/5' },
                  { name: 'Gemini', desc: 'Google', color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/5' },
                  { name: 'GPT-4o', desc: 'OpenAI', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/5' },
                  { name: 'Perplexity', desc: 'Search', color: 'border-amber-500/30 text-amber-400 bg-amber-950/5 animate-pulse' }
                ].map((item, idx) => (
                  <div key={idx} className={`border ${item.color} p-2 rounded text-center h-14 flex flex-col justify-between`}>
                    <span className="text-[9px] font-sans font-bold block">{item.name}</span>
                    <span className="text-[6.5px] text-zinc-500 font-mono block">{item.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-zinc-500 mt-2 font-mono">
                Observe baseline variations across standard generative platforms.
              </p>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center relative col-span-12">
              <span className="text-[8px] font-mono text-[#ff007f] uppercase tracking-widest font-black mb-1.5 hidden">[🎬 Hook - Panel #3]</span>
              <div className="w-16 h-16 rounded-full border border-zinc-800 p-1 relative bg-zinc-950 flex flex-col items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-[#ff007f]/5 rounded-full animate-pulse" />
                <div className="absolute top-1 right-2.5 flex items-center gap-1 font-mono text-[5.5px] text-red-500">
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                  <span>REC</span>
                </div>
                <div className="w-6 h-6 rounded-full border border-cyan-500 flex items-center justify-center text-cyan-400 animate-spin-slow">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-[10px] font-serif italic text-zinc-200 mt-2">"Let's put this to a rigorous statistical test..."</h3>
              <p className="text-[7.5px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">Camera Raw Input // Lead Researcher: Gwylym</p>
            </div>
          );
        }

      case 'Hypothesis':
        if (id === 4) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black mb-1 hidden">[🎯 Hypothesis - Panel #4]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 text-center mb-2">DESIGN TEMPLATE COMPARATIVES</h3>
              <div className="grid grid-cols-2 gap-3.5 w-full max-w-sm mt-1 text-left">
                <div className="bg-zinc-955 border border-zinc-900 p-2 rounded text-zinc-400">
                  <span className="text-[7.5px] text-zinc-500 uppercase font-mono block mb-1">Variant A (Control)</span>
                  <div className="text-[9.5px] font-serif leading-snug">
                    "NovaCRM improved deal-closing speed <span className="border-b border-red-500/60 pb-0.5 text-zinc-300">significantly</span>."
                  </div>
                </div>
                <div className="bg-cyan-950/10 border border-cyan-500/30 p-2 rounded relative text-zinc-300">
                  <span className="text-[7.5px] text-cyan-400 uppercase font-mono block mb-1 font-bold">Variant B (Treatment)</span>
                  <div className="text-[9.5px] font-serif leading-snug text-white">
                    "NovaCRM cut deal-closing time <span className="font-mono font-extrabold bg-[#ff007f] text-zinc-950 px-1 rounded">43%</span>."
                  </div>
                </div>
              </div>
            </div>
          );
        } else if (id === 5) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black mb-1 hidden">[🎯 Hypothesis - Panel #5]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 text-center mb-1">GEO NUMBER ANCHORING PROCESS</h3>
              <div className="flex items-center justify-between w-full max-w-sm mt-2 font-mono bg-zinc-950 p-2 rounded border border-white/5">
                <div className="text-center p-1.5 border border-zinc-800 rounded bg-black">
                  <span className="text-[6.5px] text-zinc-550 block">Doc Source</span>
                  <span className="text-[8px] text-emerald-400 mt-0.5 block font-bold">"43% Time"</span>
                </div>
                <div className="flex-1 px-3 relative flex items-center justify-center">
                  <div className="h-[1px] bg-zinc-800 w-full" />
                  <span className="absolute text-[7px] text-[#ff007f] bg-zinc-950 px-1 py-0.2 border border-[#ff007f]/30 rounded font-bold uppercase animate-pulse">Anchor Lift</span>
                </div>
                <div className="text-center p-1.5 border border-[#ff007f]/30 rounded bg-[#ff007f]/5">
                  <span className="text-[6.5px] text-zinc-330 block">LLM Citation</span>
                  <span className="text-[8px] text-[#ff007f] font-black uppercase mt-0.5 block">Anchored!</span>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest font-black mb-1 hidden">[🎯 Hypothesis - Panel #6]</span>
              <div className="inline-block p-1 bg-zinc-950 border border-white/5 rounded mt-2 select-none">
                <div className="flex items-center gap-3 px-3 py-1">
                  <div className="w-7 h-7 rounded-full border-2 border-cyan-400 flex items-center justify-center font-bold text-cyan-400 animate-ping">🎯</div>
                  <div className="text-left font-mono">
                    <span className="text-[6.5px] text-zinc-500 uppercase block">Benchmark Prediction Lift</span>
                    <span className="text-sm font-black text-white block">+10% to +20%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'Method':
        if (id === 7) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-teal-400 uppercase tracking-widest font-black mb-1 hidden">[⚙️ Method - Panel #7]</span>
              <div className="w-full max-w-sm bg-zinc-950 rounded border border-white/10 overflow-hidden font-mono text-[8px] text-left">
                <div className="bg-zinc-900 px-2 py-1 flex justify-between items-center border-b border-white/5">
                  <span className="text-zinc-400 font-bold">📄 DESIGN.md</span>
                  <span className="text-emerald-400 font-black animate-pulse">[✓] LOCKED ON GITHUB</span>
                </div>
                <div className="p-2.5 text-zinc-300 space-y-0.5 font-mono">
                  <div>- Swapping control vs treatment under static variables...</div>
                  <div>- Status: Registered and Committed (LOCKED)</div>
                  <div>- Date: <span className="text-cyan-400">June 11, 2026</span></div>
                  <div>- Hash: <span className="text-[#ff007f]">7f2b91c12e8ae8dbfba89345e5...</span></div>
                </div>
              </div>
            </div>
          );
        } else if (id === 8) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-teal-400 uppercase tracking-widest font-black mb-1 hidden">[⚙️ Method - Panel #8]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 mb-2 uppercase">Systems Configurations</h3>
              <div className="grid grid-cols-4 gap-2 w-full max-w-sm font-mono text-[7.5px] text-center">
                <div className="bg-zinc-900 p-1.5 border border-zinc-850 rounded">
                  <span className="text-zinc-550 block">BRAND</span>
                  <span className="text-white block font-bold">NovaCRM</span>
                </div>
                <div className="bg-zinc-900 p-1.5 border border-zinc-850 rounded">
                  <span className="text-zinc-550 block">TEMP</span>
                  <span className="text-red-400 block font-bold">0.0 (Fixed)</span>
                </div>
                <div className="bg-zinc-900 p-1.5 border border-zinc-850 rounded">
                  <span className="text-zinc-550 block">TOP-P</span>
                  <span className="text-cyan-400 block font-bold">1.0</span>
                </div>
                <div className="bg-zinc-900 p-1.5 border border-zinc-850 rounded">
                  <span className="text-zinc-550 block">INDEX</span>
                  <span className="text-amber-400 block font-bold">Pos 1</span>
                </div>
              </div>
            </div>
          );
        } else if (id === 9) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-3 rounded border border-zinc-800/40 col-span-12 relative overflow-hidden">
              <div className="absolute top-2 left-3 flex items-center gap-1.5 font-mono text-[7px] text-zinc-400 select-none">
                <span className="w-1 h-3 bg-[#ff007f] block" />
                <span>4-ENGINE METRIC QUERIES // NOVACRM TARGET</span>
              </div>
              <div className="w-full max-w-sm mt-4 space-y-1 font-mono text-[8px] text-left">
                <div className="bg-zinc-950 p-1.5 border border-white/5 rounded text-zinc-300">
                  <span className="text-[#ff007f] font-extrabold mr-1 shadow-[0_0_8px_rgba(255,0,127,0.3)]">Q1:</span> "How much faster can NovaCRM help sales teams close deals?"
                </div>
                <div className="bg-zinc-950 p-1.5 border border-[#ff007f]/30 rounded text-white shadow-[0_0_10px_rgba(255,0,127,0.05)]">
                  <span className="text-[#ff007f] font-extrabold mr-1">Q2:</span> "Does NovaCRM actually speed up the sales cycle?"
                </div>
                <div className="bg-zinc-950 p-1.5 border border-white/5 rounded text-zinc-300">
                  <span className="text-[#ff007f] font-extrabold mr-1">Q3:</span> "What is the speed benefit of NovaCRM for user workflows?"
                </div>
                <div className="bg-zinc-950 p-1.5 border border-white/5 rounded text-zinc-300">
                  <span className="text-[#ff007f] font-extrabold mr-1">Q4:</span> "NovaCRM real-world product performance feedback"
                </div>
              </div>
              {/* Target Engines visual list */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/5 w-full max-w-sm justify-between">
                <span className="text-[6.5px] font-mono text-zinc-500 uppercase font-black pl-0.5">TARGET ENGINES:</span>
                <div className="flex gap-1">
                  {['GEMINI', 'OPENAI', 'CLAUDE', 'PERPLEXITY'].map((engine) => (
                    <span key={engine} className="text-[6px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ff007f]/10 border border-[#ff007f]/30 text-[#ff007f] uppercase">
                      {engine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-teal-400 uppercase tracking-widest font-black mb-1 hidden">[⚙️ Method - Panel #10]</span>
              <div className="inline-block bg-amber-950/20 border border-amber-500/40 rounded p-2.5 max-w-xs">
                <span className="text-amber-400 text-[10px] font-mono font-black block mb-0.5">⚠️ EXPLORATORY RUN WARNING</span>
                <p className="text-[8px] font-mono text-zinc-400 leading-normal text-left">
                  This initial trial uses n=2 pilot samples. Primary clinical verification requires n=30, though the directional trend is highly visible.
                </p>
              </div>
            </div>
          );
        }

      case 'The Danger':
        if (id === 11) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-amber-500 uppercase tracking-widest font-black mb-1 hidden">[⚖️ Simpson's Paradox - Panel #11]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 mb-1">INDISCRIMINATE POOLING DISASTER</h3>
              <div className="w-full max-w-sm flex items-center justify-between font-mono text-[8px] bg-zinc-950 p-2 rounded border border-white/5 mt-1.5">
                <div className="text-zinc-500"><span className="text-red-400 font-extrabold block">❌ POOLED MODEL</span> Combines baselines indifferently.</div>
                <div className="text-xl text-red-500 animate-bounce">&harr;</div>
                <div className="text-zinc-450"><span className="text-emerald-400 font-extrabold block">✅ STRATIFIED MODEL</span> CMH controls for baselines.</div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-amber-500 uppercase tracking-widest font-black mb-1 hidden">[⚖️ Simpson's Paradox - Panel #12]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 mb-2">ENGINE BASELINE DISPARITY</h3>
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto font-mono text-[9px]">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900 text-center">
                  <span className="text-zinc-500 block text-[7.5px]">Perplexity Baseline</span>
                  <span className="text-amber-400 text-lg font-black block mt-1">50.0%</span>
                  <span className="text-[6.5px] text-zinc-650">Highly generous</span>
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900 text-center">
                  <span className="text-zinc-550 block text-[7.5px]">Gemini Baseline</span>
                  <span className="text-cyan-400 text-lg font-black block mt-1">0.0%</span>
                  <span className="text-[6.5px] text-zinc-650">Extremely strict</span>
                </div>
              </div>
            </div>
          );
        }

      case 'The Run':
        if (id === 13) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black mb-1 hidden">[⚡️ The Run - Panel #13]</span>
              <div className="w-full max-w-xs bg-black border border-zinc-850 p-2 rounded font-mono text-[8px] text-zinc-300 h-28 flex flex-col justify-between text-left">
                <div className="text-[#ff007f] border-b border-zinc-900 pb-1 flex justify-between uppercase font-bold">
                  <span>🚀 ACTIVE SHIFT SHELL</span>
                  <span className="animate-pulse text-emerald-400">[RUNNING]</span>
                </div>
                <div className="space-y-0.5 my-1">
                  <div className="text-zinc-500">$ node scripts/orchestrate.mjs</div>
                  <div className="text-violet-400">[LOAD] Injecting Variant B (Claude)... CITED ✅</div>
                  <div className="text-cyan-400">[LOAD] Injecting Variant B (Gemini)... CITED ✅</div>
                </div>
              </div>
            </div>
          );
        } else if (id === 14) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black mb-1 hidden">[⚡️ The Run - Panel #14]</span>
              <div className="w-full max-w-sm bg-zinc-950 p-2.5 rounded border border-zinc-900 text-left font-mono text-[8.5px] text-zinc-400">
                <span className="text-violet-400 font-bold block mb-1">CLAUDE API PAYLOAD RESULT:</span>
                <div className="border-l-2 border-[#ff007f] pl-1.5 italic text-zinc-300">
                  "...According to specifications on file, NovaCRM is shown to <span className="text-[#ff007f] bg-pink-950/20 font-bold px-1 rounded">cut deal-closing time by 43 percent</span> overall..."
                </div>
              </div>
            </div>
          );
        } else if (id === 15) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black mb-1 hidden">[⚡️ The Run - Panel #15]</span>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                <div className="bg-zinc-950 border border-zinc-900 p-2 rounded text-center text-[8px] text-zinc-500">
                  <span>Variant A (Vague)</span>
                  <div className="font-bold text-zinc-750 mt-1 uppercase">Ignored</div>
                </div>
                <div className="bg-[#ff007f]/5 border border-[#ff007f]/40 p-2 rounded text-center relative shadow-[0_0_10px_rgba(255,0,127,0.1)] flex flex-col justify-between">
                  <span className="text-[8px] font-bold text-[#ff007f]">Variant B (Statistic)</span>
                  <div className="font-black text-[#ff007f] uppercase animate-pulse text-[9px]">🏆 Cited!</div>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black mb-1 hidden">[⚡️ The Run - Panel #16]</span>
              <div className="inline-block p-3.5 bg-zinc-950 border border-white/5 rounded">
                <span className="text-[7.5px] uppercase text-zinc-550 font-mono block">Data Tracking Nodes</span>
                <span className="text-xl font-mono font-black text-white block mt-0.5 tracking-wider animate-pulse">016 / 016 Trials Complete</span>
                <span className="text-[7px] text-emerald-400 font-mono font-bold block mt-1">✓ ALL SYSTEM TASKS SOLVED</span>
              </div>
            </div>
          );
        }

      case 'Results':
        if (id === 17) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #17]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-350 text-center mb-1.5 uppercase">VERBATIM RESULTS SCORECARD</h3>
              <div className="grid grid-cols-4 gap-2 w-full max-w-sm text-center font-mono text-[7px] text-zinc-400">
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-850"><span className="text-violet-400">Claude</span><span className="block text-white font-extrabold mt-0.5">25% → 100%</span></div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-850"><span className="text-cyan-400">Gemini</span><span className="block text-white font-extrabold mt-0.5">0% → 31.3%</span></div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-850"><span className="text-emerald-400">GPT-4o</span><span className="block text-white font-extrabold mt-0.5">0% → 18.8%</span></div>
                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-850"><span className="text-amber-400">Perplexity</span><span className="block text-white font-extrabold mt-0.5">50% → 68.8%</span></div>
              </div>
            </div>
          );
        } else if (id === 18) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-850/40 col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #18]</span>
              <h4 className="text-[10px] font-mono font-bold text-zinc-350 uppercase">Claude Landmark Benchmark</h4>
              <div className="flex gap-4 items-center mt-2.5 font-mono text-[8px]">
                <div className="bg-zinc-950 p-2 rounded text-center w-20">
                  <span className="block text-zinc-500 text-[6.5px]">Control A</span>
                  <span className="text-base font-black text-zinc-400">25.0%</span>
                </div>
                <div className="text-base text-zinc-650">&rarr;</div>
                <div className="bg-violet-950/20 border border-violet-500 p-2 rounded text-center w-20 relative">
                  <div className={pulseRingClass} style={{ borderColor: 'rgba(139,92,246,0.3)' }} />
                  <span className="block text-violet-400 text-[6.5px] font-black">Treatment B</span>
                  <span className="text-lg font-black text-violet-400 animate-pulse">100.0%</span>
                </div>
              </div>
              <p className="text-[7.5px] text-emerald-400 font-mono mt-2 font-bold uppercase">SIGNIFICANT EFFECT (p &lt; 0.001)</p>
            </div>
          );
        } else if (id === 19) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-850/40 col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #19]</span>
              <h4 className="text-[10px] font-mono font-bold text-zinc-350 uppercase">Gemini Benchmark Scorecard</h4>
              <div className="flex gap-4 items-center mt-2.5 font-mono text-[8px]">
                <div className="bg-zinc-950 p-2 rounded text-center w-20">
                  <span className="block text-zinc-500 text-[6.5px]">Control A</span>
                  <span className="text-base font-black text-zinc-400">0.0%</span>
                </div>
                <div className="text-base text-zinc-650">&rarr;</div>
                <div className="bg-cyan-950/20 border border-cyan-500 p-2 rounded text-center w-20 relative">
                  <div className={pulseRingClass} style={{ borderColor: 'rgba(6,182,212,0.3)' }} />
                  <span className="block text-cyan-400 text-[6.5px] font-black">Treatment B</span>
                  <span className="text-lg font-black text-cyan-400 animate-pulse">31.3%</span>
                </div>
              </div>
              <p className="text-[7.5px] text-emerald-400 font-mono mt-2 font-bold uppercase">SIGNIFICANT EFFECT (p = 0.0149)</p>
            </div>
          );
        } else if (id === 20) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-850/40 col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #20]</span>
              <h4 className="text-[10px] font-mono font-bold text-zinc-350 uppercase">GPT-4o (OpenAI) Result</h4>
              <div className="flex gap-4 items-center mt-2.5 font-mono text-[8px]">
                <div className="bg-zinc-950 p-2 rounded text-center w-20">
                  <span className="block text-zinc-500 text-[6.5px]">Control A</span>
                  <span className="text-base font-black text-zinc-400">0.0%</span>
                </div>
                <div className="text-base text-zinc-650">&rarr;</div>
                <div className="bg-emerald-950/10 border border-emerald-500/40 p-2 rounded text-center w-20">
                  <span className="block text-emerald-500 text-[6.5px] font-black">Treatment B</span>
                  <span className="text-base font-black text-emerald-400">18.8%</span>
                </div>
              </div>
              <p className="text-[7.5px] text-red-400 font-mono mt-2 font-bold uppercase">LIFT BUT INSIGNIFICANT (p = 0.0688)</p>
            </div>
          );
        } else if (id === 21) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-850/40 col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #21]</span>
              <h4 className="text-[10px] font-mono font-bold text-zinc-350 uppercase">Perplexity Results</h4>
              <div className="flex gap-4 items-center mt-2.5 font-mono text-[8px]">
                <div className="bg-zinc-950 p-2 rounded text-center w-20">
                  <span className="block text-zinc-500 text-[6.5px]">Control A</span>
                  <span className="text-base font-black text-zinc-400">50.0%</span>
                </div>
                <div className="text-base text-zinc-650">&rarr;</div>
                <div className="bg-amber-950/10 border border-amber-500/40 p-2 rounded text-center w-20">
                  <span className="block text-amber-500 text-[6.5px] font-black">Treatment B</span>
                  <span className="text-base font-black text-amber-500">68.8%</span>
                </div>
              </div>
              <p className="text-[7.5px] text-zinc-500 font-mono mt-2 font-bold uppercase">NO DETECTABLE SIGNIFICANCE (p = 0.2802)</p>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest font-black mb-1 hidden">[📊 Results - Panel #22]</span>
              <div className="bg-red-950/10 border border-red-500 p-3 rounded max-w-xs mx-auto shadow-lg text-left">
                <span className="text-red-500 font-mono font-black text-[9px] uppercase block mb-0.5 animate-pulse">⚠️ STATISTICAL TRAP: NAIVE POOLED RATES</span>
                <p className="text-[7.5px] font-mono text-zinc-405 leading-normal">
                  Pooling rates cross platforms without stratification (Control 18.8% vs Treatment 54.7%) invites fallacious correlations due to baseline diversity.
                </p>
              </div>
            </div>
          );
        }

      case 'The Fix':
        if (id === 23) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12 relative z-10">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧬 The Fix - Panel #23]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">Cochran-Mantel-Haenszel (CMH) Method</h3>
              <div className="bg-black border border-zinc-800 p-2.5 rounded text-center inline-block">
                <span className="text-[8px] text-[#ff007f] font-mono uppercase block">Stratified Odds Ratio</span>
                <span className="text-xl font-serif text-white font-extrabold block">OR = 10.2</span>
                <span className="text-[7px] text-emerald-400 block font-mono font-bold mt-0.5">CMH METRIC VALUE P = 0.0004</span>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧬 The Fix - Panel #24]</span>
              <div className="inline-block p-3 bg-zinc-950 border border-[#ff007f]/40 rounded relative shadow-[0_0_15px_rgba(255,0,127,0.15)] max-w-xs text-center">
                <div className={pulseRingClass} />
                <h3 className="text-[9px] font-mono font-black text-[#ff007f] block uppercase">STRONG LIFT CONVERSION REGISTER</h3>
                <span className="text-sm font-serif italic text-white font-bold block mt-1">"Variant B is ~10.2x more likely citable."</span>
              </div>
            </div>
          );
        }

      case 'Rigor':
        if (id === 25) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800 col-span-12 text-center">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #25]</span>
              <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase">The Bonferroni Split Clamp</h4>
              <div className="inline-block bg-zinc-950 p-2 border border-zinc-850 rounded text-red-400 border-red-500/20 mt-1">
                <span className="font-bold block text-[8px] animate-pulse">🔒 CONSERVATIVE CLAMP: alpha = 0.0125</span>
                <span className="text-[7px] text-zinc-500 mt-0.5 block font-mono">Excessively erases valid minor signals.</span>
              </div>
            </div>
          );
        } else if (id === 26) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #26]</span>
              <div className="w-full max-w-xs bg-zinc-950/90 p-2.5 rounded border border-zinc-900 font-mono text-[8px] text-zinc-500 text-left space-y-1">
                <div className="font-bold text-zinc-350 border-b border-white/5 pb-0.5">CRITICAL PROBLEMS WITH BONFERRONI:</div>
                <div className="flex items-center gap-1.5"><span className="text-red-500 text-[8px]">●</span> <span>Aggressively erases real indicators</span></div>
                <div className="flex items-center gap-1.5"><span className="text-red-500 text-[8px]">●</span> <span>Dramatically spikes False Negative risk</span></div>
              </div>
            </div>
          );
        } else if (id === 27) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #27]</span>
              <h4 className="text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">Holm Step-down Protective Scale</h4>
              <div className="flex items-center justify-between w-full max-w-xs font-mono text-[7px] bg-zinc-950 p-1.5 border border-purple-500/25 rounded">
                <div className="text-left font-sans">
                  <div className="text-emerald-400 font-bold font-mono">Claude (0.0001)</div>
                  <span className="text-[6px] text-zinc-500">REJECT NULL YES!</span>
                </div>
                <div className="text-zinc-600">&rarr;</div>
                <div className="text-center font-sans">
                  <div className="text-pink-400 font-bold font-mono">Gemini (0.0149)</div>
                  <span className="text-[6px] text-zinc-550">REJECT NULL YES!</span>
                </div>
                <div className="text-zinc-600">&rarr;</div>
                <div className="text-right font-sans">
                  <div className="text-zinc-500 font-mono">GPT-4o (0.0688)</div>
                  <span className="text-[6px] text-zinc-700">NO CORRELATION</span>
                </div>
              </div>
            </div>
          );
        } else if (id === 28) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #28]</span>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-left">
                <div className="bg-zinc-950 border border-zinc-900 p-2 rounded">
                  <span className="text-[7.5px] text-zinc-500 uppercase font-mono block">Engine A</span>
                  <div className="text-[8.5px] font-bold text-zinc-400 mt-0.5">String Pattern Scorer</div>
                </div>
                <div className="bg-[#ff007f]/5 border border-[#ff007f]/30 p-2 rounded relative">
                  <span className="text-[7.5px] text-[#ff007f] uppercase font-mono block font-bold">Engine B</span>
                  <div className="text-[8.5px] font-extrabold text-white mt-0.5 uppercase">Semantic LLM-Judge</div>
                </div>
              </div>
            </div>
          );
        } else if (id === 29) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #29]</span>
              <h3 className="text-xs font-mono font-bold text-zinc-300 mb-2">SCORER TYPE RELEVANCE COMPARATIVE</h3>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-center font-mono text-[8px]">
                <div className="bg-zinc-950 p-2 border border-zinc-900 rounded">
                  <span className="text-zinc-500 block">Exact Verbatim Lift</span>
                  <span className="text-base font-black block text-zinc-400 mt-1">54.7%</span>
                </div>
                <div className="bg-pink-950/10 p-2 border border-[#ff007f]/30 rounded">
                  <span className="text-[#ff007f] block font-bold">Semantic Judge Lift</span>
                  <span className="text-base font-black block text-white mt-1 animate-pulse">94.6%</span>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-pink-400 uppercase tracking-widest font-black mb-1 hidden">[🧪 Rigor - Panel #30]</span>
              <div className="inline-block p-3 bg-zinc-950 border border-white/5 rounded">
                <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto mb-1 text-[11px]">✓</div>
                <span className="text-[7.5px] uppercase text-zinc-550 font-mono block">Scorers Agreement</span>
                <span className="text-sm font-mono font-black text-emerald-400 block tracking-wide">60.7% Concordance Rate</span>
              </div>
            </div>
          );
        }

      case 'Threats':
        if (id === 31) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800 col-span-12">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black mb-1 hidden">[⚠️ Threats - Panel #31]</span>
              <div className="w-full max-w-xs bg-zinc-950 p-2 rounded border border-zinc-900 font-mono text-[8px] text-zinc-500 text-left space-y-0.5">
                <div className="font-bold text-zinc-350 border-b border-zinc-900 pb-0.5 uppercase">Pre-identified constraints:</div>
                <div className="flex items-center gap-1.5"><span>●</span> <span>Exploratory batch restriction boundaries (n=2)</span></div>
                <div className="flex items-center gap-1.5"><span>●</span> <span>Moment-in-time snapshot limitation biases</span></div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-black mb-1 hidden">[⚠️ Threats - Panel #32]</span>
              <div className="inline-block bg-zinc-950 p-2.5 border border-white/10 rounded text-left max-w-xs">
                <span className="text-red-400 font-bold block font-mono text-[8.5px] uppercase">Fast-mode In-context memory summary only</span>
                <p className="text-[7.5px] font-mono text-zinc-400 mt-1 leading-normal">
                  Observes local memory context, completely bypassing index rankings or long-term production caching algorithms.
                </p>
              </div>
            </div>
          );
        }

      case 'Takeaway':
        if (id === 33) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-[#ff007f] uppercase tracking-widest font-black mb-1 hidden">[💡 Takeaway - Panel #33]</span>
              <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center mx-auto mb-1 bg-zinc-950">
                <span className="text-emerald-400 font-bold animate-pulse text-[13px]">✓</span>
              </div>
              <h3 className="text-[10px] font-serif italic text-zinc-200">"Replacing vague modifiers with direct data is entirely free..."</h3>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 col-span-12">
              <span className="text-[8px] font-mono text-[#ff007f] uppercase tracking-widest font-black mb-1.5 hidden">[💡 Takeaway - Panel #34]</span>
              <div className="w-full max-w-xs text-center font-mono text-[8.5px] bg-zinc-950 p-2.5 rounded border border-[#ff007f]/40 relative">
                <div className={pulseRingClass} />
                <span className="text-[#ff007f] font-black uppercase tracking-wider block">Variant B: 43% Beats "significantly"</span>
                <p className="text-[7.5px] text-zinc-500 mt-1 font-sans">Establish credibility coordinates across model decoders for absolute zero cost.</p>
              </div>
            </div>
          );
        }

      case 'Outro':
      default:
        if (id === 35) {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1 hidden">[🎬 Outro - Panel #35]</span>
              <span className="text-base font-serif text-white font-extrabold block">L8EntSpace Lab</span>
              <span className="text-[7px] text-[#ff007f] font-bold uppercase tracking-wider block font-mono">Generative Optimization Laboratory</span>
              <p className="text-[8px] text-zinc-400 mt-2 max-w-xs">Connecting brand performance indices on model search platforms at scale.</p>
            </div>
          );
        } else {
          return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-4 rounded border border-zinc-800/40 text-center col-span-12">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-1 hidden">[🎬 Outro - Panel #36]</span>
              <div className="bg-zinc-950 border border-zinc-900 p-2 rounded max-w-xs text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-[#ff007f]" />
                <span className="text-[8.5px] font-mono text-[#ff007f] font-black uppercase block">REPLICATIONS PINNED BELOW</span>
                <div className="flex justify-center items-center gap-2 mt-2 font-mono text-[7px]">
                  <span className="bg-red-950 text-red-400 px-1 rounded animate-pulse font-bold">🔔 SUBSCRIBE</span>
                  <span className="text-zinc-[10px] text-zinc-500">&bull;</span>
                  <span>👍 LIKE THIS TAKE</span>
                </div>
              </div>
            </div>
          );
        }
    }

    // Dynamic, stunning fallback slide representation for any panels without custom coded cases
    const visualDesc = selectedPanel.visual;
    const bRollDesc = selectedPanel.bRoll;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#07070a] p-8 text-center relative border border-zinc-800/40 rounded col-span-12 select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,0,127,0.06)_0%,transparent_70%)] pointer-events-none animate-pulse" />
        <span className="text-[9px] font-mono text-[#ff007f] uppercase tracking-widest font-black mb-2 px-3 py-1 bg-[#ff007f]/5 border border-[#ff007f]/15 rounded-full">
          🎬 {phase} • Panel #{id}
        </span>
        
        <div className="max-w-md w-full relative z-10 space-y-4">
          <h2 className="text-sm font-sans font-black text-rose-100 tracking-wider uppercase border-b border-white/5 pb-2">
            Cinematic Scene Segment
          </h2>

          <div className="bg-zinc-950/80 border border-zinc-900 p-4.5 rounded-sm relative shadow-xl backdrop-blur-xs text-left font-mono">
            <span className="text-[7.5px] text-zinc-550 block uppercase tracking-widest mb-1.5 font-bold">🖥️ STORYBOARD LAYOUT DIRECTION:</span>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans italic">
              "{visualDesc || "Camera sweeps across presentation visuals illustrating statistical findings."}"
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-zinc-450 bg-zinc-900/40 py-1.5 px-3 border border-white/5 rounded-xs shrink-0 inline-block">
            <span className="text-[#ff007f] font-bold">B-Roll Directive:</span>
            <span className="truncate max-w-[280px]">{bRollDesc || "Standard pan to show data context"}</span>
          </div>
        </div>
      </div>
    );
  };

  // 1. ADVANCED POLL FOR YOUTUBE IFRAME API READYNESS
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;

    const tryInit = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        rebuildPlayer();
        if (checkInterval) clearInterval(checkInterval);
        return true;
      }
      return false;
    };

    if (playerMode === 'youtube') {
      if (!tryInit()) {
        // Inject script tag if not present
        if (!(window as any).YT) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
        
        // Start proactive checking poller
        checkInterval = setInterval(() => {
          tryInit();
        }, 150);
      }
    }

    function rebuildPlayer() {
      const container = document.getElementById('youtube-container');
      if (!container) return;

      // Always reset inner container to prevent duplicate construction error onto absolute elements
      container.innerHTML = '<div id="youtube-player-element" class="w-full h-full"></div>';

      try {
        const videoId = getYouTubeId(youtubeUrlOrId);
        ytPlayerRef.current = new (window as any).YT.Player('youtube-player-element', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              setYtPlayerReady(true);
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: 1 = PLAYING, 2 = PAUSED
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              }
            },
            onError: (err: any) => {
              console.warn("YouTube API Player reported error status:", err);
            }
          }
        });
      } catch (err) {
        console.warn("YouTube Player initialization error:", err);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [playerMode]);

  // Update dynamic queued video when URL/ID changes in Youtube Mode
  useEffect(() => {
    if (ytPlayerReady && ytPlayerRef.current && playerMode === 'youtube') {
      const id = getYouTubeId(youtubeUrlOrId);
      try {
        ytPlayerRef.current.cueVideoById({ videoId: id });
        setCurrentTimeSec(0);
        setIsPlaying(false);
      } catch (err) {
        console.warn("Failed to cue new YouTube video ID:", err);
      }
    }
  }, [youtubeUrlOrId, ytPlayerReady, playerMode]);

  // Hook up audio volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  // 2. EXPLICIT NATIVE CRITICAL RE-LOAD FIX FOR DYNAMIC SOUND FILES
  useEffect(() => {
    if (audioRef.current && userAudioUrl) {
      try {
        audioRef.current.load();
        audioRef.current.volume = audioVolume;
      } catch (e) {
        console.warn("Failed loading uploaded sound track:", e);
      }
    }
  }, [userAudioUrl]);

  // Synchronise state of simulated or uploaded audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (playerMode === 'simulation' && isPlaying && userAudioUrl && currentSequence === 'storyboard') {
        audioRef.current.play().catch(e => {
          console.warn("Audio play blocked (needs gesture):", e);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, playerMode, userAudioUrl, currentSequence]);

  // Keep Web Audio Drone synth in sync with play state
  useEffect(() => {
    if (isPlaying && isSynthEnabled && playerMode === 'simulation') {
      synth.startDrone();
    } else {
      synth.stopDrone();
    }
    return () => synth.stopDrone();
  }, [isPlaying, isSynthEnabled, playerMode]);

  // Timer for Intro and Outro transitions and playback!
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && playerMode === 'simulation') {
      timer = setInterval(() => {
        if (currentSequence === 'intro') {
          // Play Intro sequence
          setIntroTimeElapsed((prev) => {
            const next = Number((prev + 0.1).toFixed(1));
            if (next >= introDuration) {
              // Finish Intro, transition to storyboard!
              setCurrentSequence('storyboard');
              setCurrentTimeSec(0);
              // Start/Play any uploaded audio track from 0s
              if (audioRef.current && userAudioUrl) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
              return 0;
            }
            return next;
          });
        } else if (currentSequence === 'outro') {
          // Play Outro sequence
          setOutroTimeElapsed((prev) => {
            const next = Number((prev + 0.1).toFixed(1));
            if (next >= outroDuration) {
              // Finish everything!
              setIsPlaying(false);
              setCurrentSequence('storyboard');
              setCurrentTimeSec(0);
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                  mediaRecorderRef.current.stop();
                } catch (err) {}
                try {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  }
                } catch (err) {}
              }
              return 0;
            }
            return next;
          });
        }
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playerMode, currentSequence, introDuration, outroDuration, userAudioUrl]);

  // Keep programmatic time tracker moving when playing simple simulation (no uploaded track)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && playerMode === 'simulation' && !userAudioUrl && currentSequence === 'storyboard') {
      timer = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalDuration) {
            if (isOutroEnabled) {
              setCurrentSequence('outro');
              setOutroTimeElapsed(0);
              return totalDuration;
            } else {
              setIsPlaying(false);
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                  mediaRecorderRef.current.stop();
                } catch (err) {}
                try {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  }
                } catch (err) {}
              }
              return 0;
            }
          }
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playerMode, userAudioUrl, totalDuration, currentSequence, isOutroEnabled]);

  // Poll Playback tracking for active YouTube playback sync
  useEffect(() => {
    let pollingTimer: NodeJS.Timeout | null = null;
    if (playerMode === 'youtube' && ytPlayerReady && ytPlayerRef.current) {
      pollingTimer = setInterval(() => {
        try {
          const state = ytPlayerRef.current.getPlayerState();
          if (state === 1) { // playing
            const time = ytPlayerRef.current.getCurrentTime();
            setCurrentTimeSec(Number(time.toFixed(1)));
            setIsPlaying(true);
          } else if (state === 2) { // paused
            setIsPlaying(false);
          }
        } catch (e) {
          // ignore transient api connection faults
        }
      }, 250);
    }
    return () => {
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [playerMode, ytPlayerReady]);

  // Automatically update active highlighted panel based on current playhead time
  useEffect(() => {
    const matchingPanel = STORYBOARD_DATA.find((panel) => {
      const { start, end } = getPanelTimings(panel);
      return currentTimeSec >= start && currentTimeSec < end;
    });
    if (matchingPanel && matchingPanel.panelId !== selectedPanelId) {
      setSelectedPanelId(matchingPanel.panelId);
      if (isSynthEnabled && playerMode === 'simulation') {
        synth.playBeep(440 + matchingPanel.panelId * 10, 0.08);
      }
    }
  }, [currentTimeSec, scaleTimingsToAudio, userAudioUrl, audioDuration, manualPanelStarts, syncCalibrating]);

  // ── Tap-to-sync calibration ──────────────────────────────────────────────
  // Play the voiceover once and tap (Space / the big button) the instant each
  // panel's narration begins. We record the audio timestamp as that panel's start,
  // giving frame-accurate panel↔voiceover sync in a single pass.
  const beginSyncCalibration = () => {
    if (!userAudioUrl) return;
    // Guard: a live tap pass overwrites every panel start, so don't silently wipe
    // any hand-edited times.
    if ((Object.keys(manualPanelStarts).length > 0 || Object.keys(manualPanelEnds).length > 0) &&
        !window.confirm('Start a fresh tap-sync pass? This replaces ALL current panel start/end times (including any you edited by hand).')) {
      return;
    }
    synth.init();
    if (synth.ctx && synth.ctx.state === 'suspended') {
      synth.ctx.resume().catch(() => {});
    }
    const first = STORYBOARD_DATA[0];
    // Panel 1 always starts at 0; the user taps the START of panels 2..N. A fresh
    // pass is purely start-driven, so drop any manual end overrides too.
    setManualPanelStarts({ [first.panelId]: 0 });
    setManualPanelEnds({});
    setSyncMarkIndex(1);
    setCurrentSequence('storyboard');
    setSelectedPanelId(first.panelId);
    setCurrentTimeSec(0);
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    }
    setSyncCalibrating(true);
    setIsPlaying(true);
  };

  const markSyncPanel = () => {
    if (!syncCalibrating) return;
    const idx = syncMarkIndex;
    if (idx >= STORYBOARD_DATA.length) return;
    const panel = STORYBOARD_DATA[idx];
    const t = audioRef.current ? audioRef.current.currentTime : currentTimeSec;
    setManualPanelStarts(prev => ({ ...prev, [panel.panelId]: Number(t.toFixed(2)) }));
    setSelectedPanelId(panel.panelId);
    if (isSynthEnabled) synth.playBeep(720, 0.05);
    const next = idx + 1;
    if (next >= STORYBOARD_DATA.length) {
      // Last panel marked — calibration complete.
      setSyncCalibrating(false);
      setIsPlaying(false);
      if (audioRef.current) { try { audioRef.current.pause(); } catch (e) {} }
    } else {
      setSyncMarkIndex(next);
    }
  };

  const undoLastSyncMark = () => {
    if (syncMarkIndex <= 1) return; // panel 1's 0s baseline stays
    const prevIdx = syncMarkIndex - 1;
    const panel = STORYBOARD_DATA[prevIdx];
    setManualPanelStarts(prev => {
      const copy = { ...prev };
      delete copy[panel.panelId];
      return copy;
    });
    setSyncMarkIndex(prevIdx);
    if (isSynthEnabled) synth.playBeep(360, 0.05);
  };

  const cancelSyncCalibration = () => {
    setSyncCalibrating(false);
    setIsPlaying(false);
    if (audioRef.current) { try { audioRef.current.pause(); } catch (e) {} }
  };

  const clearManualSync = () => {
    setManualPanelStarts({});
    setManualPanelEnds({});
    setSyncMarkIndex(0);
    if (isSynthEnabled) synth.playBeep(300, 0.1);
  };

  // Keyboard: Space/→/Enter = mark, Backspace = undo, Esc = cancel (during calibration)
  useEffect(() => {
    if (!syncCalibrating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        markSyncPanel();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        undoLastSyncMark();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        cancelSyncCalibration();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [syncCalibrating, syncMarkIndex, currentTimeSec]);

  // ── Project import / export ──────────────────────────────────────────────
  // Persist the active experiment so a reload restores the right storyboard.
  useEffect(() => {
    saveActiveProject(activeProject);
  }, [activeProject]);

  // Gather the live editing state into a single portable project file.
  const buildCurrentProject = (): StoryboardProject => ({
    ...activeProject,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    panels: storyboard,
    manualPanelStarts,
    manualPanelEnds,
    panelOffsets,
    autoBrollPanels,
    isIntroEnabled,
    isOutroEnabled,
    createdAt: activeProject.createdAt ?? new Date().toISOString().slice(0, 10),
  });

  const handleExportProject = () => {
    try {
      const project = buildCurrentProject();
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.experimentId || 'storyboard'}.project.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      synth.playBeep(880, 0.12);
    } catch (err) {
      console.warn('Project export failed:', err);
    }
  };

  // Wipe all runtime-uploaded media (b-roll/voiceover/intro/outro) from state +
  // IndexedDB so a new experiment starts with a clean slate.
  const clearAllRuntimeMedia = () => {
    Object.values(customBrollUrls).forEach(b => { try { URL.revokeObjectURL(b.url); } catch (e) {} });
    getAllBrollFiles()
      .then(all => all.forEach(b => deleteBrollFile(b.panelId).catch(() => {})))
      .catch(() => {});
    setCustomBrollUrls({});

    if (userAudioUrl) { try { URL.revokeObjectURL(userAudioUrl); } catch (e) {} }
    setUserAudioUrl(null);
    setUserAudioFile(null);
    deleteAudioFile().catch(() => {});

    setCustomIntroUrl(null);
    setCustomOutroUrl(null);
    deleteGenericFile('custom_intro_media').catch(() => {});
    deleteGenericFile('custom_outro_media').catch(() => {});
  };

  const applyProject = (project: StoryboardProject, clearMedia: boolean) => {
    setActiveProject(project);
    setAutoBrollPanels(project.autoBrollPanels ?? deriveAutoBroll(project.panels));
    setManualPanelStarts(project.manualPanelStarts ?? {});
    setManualPanelEnds(project.manualPanelEnds ?? {});
    setSyncMarkIndex(0);
    setPanelOffsets(project.panelOffsets ?? {});
    if (typeof project.isIntroEnabled === 'boolean') setIsIntroEnabled(project.isIntroEnabled);
    if (typeof project.isOutroEnabled === 'boolean') setIsOutroEnabled(project.isOutroEnabled);
    // Rewind to a clean starting state.
    setIsPlaying(false);
    setCurrentSequence('storyboard');
    setCurrentTimeSec(0);
    setSelectedPanelId(project.panels[0]?.panelId ?? 1);
    if (clearMedia) clearAllRuntimeMedia();
  };

  const handleImportProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = validateProject(parsed);
        if (!res.ok || !res.project) {
          window.alert(`Couldn't load project: ${res.error || 'invalid file.'}`);
          return;
        }
        const differentExperiment = res.project.experimentId !== activeProject.experimentId;
        const clearMedia = differentExperiment
          ? window.confirm(
              `Load "${res.project.title}" (experiment ${res.project.experimentId}).\n\n` +
              `This is a different experiment. Clear the b-roll, voiceover, intro and outro currently uploaded so you start fresh?\n\n` +
              `OK = clear media   ·   Cancel = keep current media`
            )
          : false;
        applyProject(res.project, clearMedia);
        synth.playBeep(660, 0.12);
      } catch (err) {
        window.alert('That file is not valid JSON.');
      } finally {
        if (projectFileInputRef.current) projectFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefaultProject = () => {
    if (window.confirm('Reset to the built-in experiment-001 storyboard? Current panel edits are replaced (uploaded media is kept).')) {
      applyProject(DEFAULT_PROJECT, false);
    }
  };

  const handleAudioLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserAudioFile(file);
      if (userAudioUrl) URL.revokeObjectURL(userAudioUrl);
      const url = URL.createObjectURL(file);
      setUserAudioUrl(url);
      setCurrentTimeSec(0);
      setIsPlaying(false);
      // A new track invalidates any previously captured panel timings.
      setManualPanelStarts({});
      setManualPanelEnds({});
      setSyncMarkIndex(0);
      // Automatically toggle simulation on to preview and run with user voice track
      setPlayerMode('simulation');
      synth.playBeep(880, 0.15);
      
      saveAudioFile(file, file.name).catch(err => {
        console.warn("Failed to persist uploaded audio voiceover to IndexedDB:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && playerMode === 'simulation' && currentSequence === 'storyboard') {
      setCurrentTimeSec(Number(audioRef.current.currentTime.toFixed(1)));
    }
  };

  const handleAudioEnded = () => {
    if (isOutroEnabled) {
      setCurrentSequence('outro');
      setOutroTimeElapsed(0);
    } else {
      setIsPlaying(false);
      setCurrentTimeSec(0);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (err) {}
        try {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        } catch (err) {}
      }
    }
  };

  const togglePlay = () => {
    // Synchronously initialize and resume Web Audio context inside user element click callstack
    synth.init();
    if (synth.ctx && synth.ctx.state === 'suspended') {
      synth.ctx.resume().catch(() => {});
    }

    if (playerMode === 'youtube' && ytPlayerRef.current && ytPlayerReady) {
      try {
        const state = ytPlayerRef.current.getPlayerState();
        if (state === 1) { // Currently playing
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      // Simulation mode
      if (isPlaying) {
        setIsPlaying(false);
        synth.stopDrone();
        if (audioRef.current && userAudioUrl) {
          audioRef.current.pause();
        }
      } else {
        if (currentSequence === 'intro') {
          // Resuming intro
        } else if (currentSequence === 'outro') {
          // Resuming outro
        } else if (currentTimeSec === 0) {
          if (isIntroEnabled) {
            setCurrentSequence('intro');
            setIntroTimeElapsed(0);
          } else {
            setCurrentSequence('storyboard');
            setCurrentTimeSec(0);
            if (audioRef.current && userAudioUrl) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
            }
          }
        } else {
          if (currentSequence === 'storyboard' && audioRef.current && userAudioUrl) {
            audioRef.current.play().catch(() => {});
          }
        }
        setIsPlaying(true);
        if (isSynthEnabled) {
          synth.startDrone();
        }
      }
    }
    if (isSynthEnabled) {
      synth.playBeep(600, 0.08);
    }
  };

  const seekToSec = (seconds: number) => {
    // Synchronously unlock AudioContext inside selection and navigation clicks
    synth.init();
    if (synth.ctx && synth.ctx.state === 'suspended') {
      synth.ctx.resume().catch(() => {});
    }

    setCurrentSequence('storyboard');
    setCurrentTimeSec(seconds);
    if (playerMode === 'youtube' && ytPlayerRef.current && ytPlayerReady) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch (e) {
        console.warn("YouTube Direct command seek hook failed:", e);
      }
    } else {
      if (audioRef.current && userAudioUrl) {
        audioRef.current.currentTime = seconds;
      }
      setIsPlaying(true);
      if (isSynthEnabled) {
        synth.startDrone();
      }
    }
    if (isSynthEnabled) {
      synth.playBeep(520, 0.08);
    }
  };

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    seekToSec(target);
  };

  const getCameraTransform = () => {
    // Determine playhead's progress within the current active panel duration
    const cp = STORYBOARD_DATA.find(p => p.panelId === selectedPanelId) || STORYBOARD_DATA[0];
    const timings = getPanelTimings(cp);
    const dur = timings.end - timings.start;
    const elapsed = currentTimeSec - timings.start;
    const p = dur > 0 ? Math.min(1, Math.max(0, elapsed / dur)) : 0;

    // Gentle organic Ken Burns motions based on panel index to keep the frame lively
    const moveType = cp.panelId % 5;
    
    if (moveType === 0) {
      // Slow zoom in with a gentle right-bottom shift
      const scale = 1.02 + p * 0.06;
      const tx = p * 8;
      const ty = p * 4;
      return `scale(${scale}) translate(${tx}px, ${ty}px)`;
    } else if (moveType === 1) {
      // Slow zoom out with a left shift
      const scale = 1.08 - p * 0.05;
      const tx = (1 - p) * -8;
      const ty = (1 - p) * 4;
      return `scale(${scale}) translate(${tx}px, ${ty}px)`;
    } else if (moveType === 2) {
      // Gentle left-down pan
      const scale = 1.05;
      const tx = 6 - p * 12;
      const ty = -2 + p * 4;
      return `scale(${scale}) translate(${tx}px, ${ty}px)`;
    } else if (moveType === 3) {
      // Gentle vertical tracking rise
      const scale = 1.04;
      const tx = -3 + p * 6;
      const ty = 5 - p * 10;
      return `scale(${scale}) translate(${tx}px, ${ty}px)`;
    } else {
      // Slow radial breathing focus
      const scale = 1.03 + Math.sin(p * Math.PI) * 0.03;
      return `scale(${scale}) translate(0px, 0px)`;
    }
  };

  const getPhaseTagColor = (phase: string) => {
    switch (phase) {
      case 'Hook': return 'text-violet-400 bg-violet-950/40 border border-violet-500/30';
      case 'Hypothesis': return 'text-blue-400 bg-blue-950/40 border border-blue-500/30';
      case 'Method': return 'text-teal-400 bg-teal-950/40 border border-teal-500/30';
      case 'The Danger': return 'text-amber-400 bg-amber-950/40 border border-amber-500/30';
      case 'The Run': return 'text-purple-400 bg-purple-950/40 border border-purple-500/30';
      case 'Results': return 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30';
      case 'The Fix':
      case 'Rigor': return 'text-pink-400 bg-pink-950/40 border border-pink-500/30';
      default: return 'text-zinc-400 bg-zinc-900 border border-white/5';
    }
  };

  // SCRIPT TXT FILE EXPORT GENERATOR
  const handleExportScript = () => {
    try {
      let documentContent = "========================================================\n";
      documentContent += "THE NUMBER ANCHOR THEORY - SCRIPT & PRODUCTION DOSSIER\n";
      documentContent += "Created with L8EntSpace Cinematic Studio\n";
      documentContent += `Generated: ${new Date().toLocaleDateString()}\n`;
      documentContent += "========================================================\n\n";

      STORYBOARD_DATA.forEach((panel) => {
        documentContent += `PANEL #${panel.panelId} [Time Offset: ${panel.startTime}]\n`;
        documentContent += `[Phase Category: ${panel.phase}]\n`;
        documentContent += `[Visual Screen Layout Direction]:\n  ${panel.visual}\n`;
        documentContent += `[Aesthetic Voiceover / Dialogue]:\n  "${panel.audio}"\n`;
        documentContent += "--------------------------------------------------------\n\n";
      });

      const blob = new Blob([documentContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = 'the-number-anchor-theory-production-voiceover-script.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      synth.playBeep(980, 0.15);
    } catch(err) {
      console.warn(err);
    }
  };

  // BROWSER BACKED SCREEN CAPTURE RECORDER UTILITY
  const toggleRecording = async () => {
    setRecordingError(null);
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {}
    } else {
      // 1. Resume the AudioContext synchronously inside the click gesture so the
      // recorded mix isn't silently suspended. Do NOT await here — awaiting would
      // burn the click's transient activation that getDisplayMedia still needs.
      try {
        synth.init();
        if (synth.ctx && synth.ctx.state === 'suspended') {
          synth.ctx.resume().catch(() => {});
        }
      } catch (audioActivationErr) {
        console.warn("AudioContext early click handler resume bypassed:", audioActivationErr);
      }

      // 2. Fire the fullscreen request AND the share picker in the SAME synchronous
      // tick, before any await. Both APIs require the click's transient activation.
      // The previous version awaited requestFullscreen() first, which dropped the
      // activation so the getDisplayMedia() picker could silently reject (capture
      // "did nothing"). Firing fullscreen without awaiting keeps the activation
      // alive for the picker, so the stage goes fullscreen AND the picker opens.
      let fullscreenPromise: Promise<void> | null = null;
      if (autoFullscreenOnRecord) {
        const stage = document.getElementById('recording-viewport-stage');
        if (stage) {
          try {
            if (stage.requestFullscreen) {
              fullscreenPromise = stage.requestFullscreen();
            } else if ((stage as any).webkitRequestFullscreen) {
              fullscreenPromise = (stage as any).webkitRequestFullscreen();
            }
          } catch (fsErr) {
            console.warn("Fullscreen request bypassed:", fsErr);
          }
        }
      }

      let displayStream: MediaStream | null = null;
      let finalStream: MediaStream | null = null;

      try {
        // Prompt the system screen-share picker (with audio), fired in the same
        // synchronous tick as the fullscreen request above.
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        });
      } catch (err: any) {
        console.warn("Display media stream capture rejected or aborted:", err);
        setRecordingError(err?.message || "Screen capture selection was dismissed.");
        // User dismissed the share picker — swallow the fullscreen promise and drop
        // back out of fullscreen so the app isn't left stuck or stranded.
        if (fullscreenPromise) { fullscreenPromise.catch(() => {}); }
        try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
        return;
      }

      // Picker resolved — settle the fullscreen transition before wiring the recorder.
      if (fullscreenPromise) { try { await fullscreenPromise; } catch (e) {} }

      try {
        const tracks: MediaStreamTrack[] = [];
        
        // Add the video track from display sharing
        displayStream.getVideoTracks().forEach(track => tracks.push(track));

        // Step 3: Mix the Web Audio track containing our synth drones + uploaded audio loader
        let highFidelityAudioTrack: MediaStreamTrack | null = null;
        synth.init();
        if (synth.ctx) {
          try {
            // Re-verify resume is fully registered
            if (synth.ctx.state === 'suspended') {
              await synth.ctx.resume();
            }

            // Bind narrator audio element if accessible
            const audioElement = document.getElementById('voiceover-audio-player') as HTMLAudioElement;
            if (audioElement) {
              synth.bindAudioElement(audioElement);
            }

            // Provision a clean destination streaming node
            synth.recDestination = synth.ctx.createMediaStreamDestination();
            synth.getMainMix().connect(synth.recDestination);

            const appAudioTracks = synth.recDestination.stream.getAudioTracks();
            if (appAudioTracks.length > 0) {
              highFidelityAudioTrack = appAudioTracks[0];
              tracks.push(highFidelityAudioTrack);
            }
          } catch (audioSetupErr) {
            console.warn("Web Audio system audio capture initialization failed, using browser hardware bypass:", audioSetupErr);
          }
        }

        // If Web Audio capture is unavailable on this device, fall back to native browser display inputs
        if (!highFidelityAudioTrack) {
          displayStream.getAudioTracks().forEach(track => tracks.push(track));
        }

        finalStream = new MediaStream(tracks);

        // Determine a supported mimeType sequentially to prevent browser error exceptions
        let mimeType = 'video/webm;codecs=vp9,opus';
        try {
          if (typeof MediaRecorder !== 'undefined') {
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/webm;codecs=vp8,opus';
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                  mimeType = 'video/mp4';
                  if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = ''; // Empty string lets the browser select its default format
                  }
                }
              }
            }
          }
        } catch (e) {
          mimeType = '';
        }

        recordedChunksRef.current = [];
        
        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(finalStream, options);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        const currentDisplayStream = displayStream;
        const currentFinalStream = finalStream;

        mediaRecorder.onstop = () => {
          const actualType = mimeType || 'video/webm';
          const blob = new Blob(recordedChunksRef.current, { type: actualType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ext = actualType.includes('mp4') ? 'mp4' : 'webm';
          a.href = url;
          a.download = `the-number-anchor-theory-scene-take.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // Disconnect recorder destination node to seal resource allocation
          if (synth.recDestination && synth.mainMix) {
            try {
              synth.mainMix.disconnect(synth.recDestination);
            } catch (discErr) {}
            synth.recDestination = null;
          }

          // Kill streams to clear web browsers capture hardware indicators
          if (currentDisplayStream) {
            currentDisplayStream.getTracks().forEach(t => t.stop());
          }
          if (currentFinalStream) {
            currentFinalStream.getTracks().forEach(t => t.stop());
          }

          try {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            }
          } catch (fsExitErr) {}

          setIsRecording(false);
        };

        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        
        // Rewind to the very start so the take records the full programme:
        // intro → storyboard (narration + b-roll) → outro. Without resetting the
        // sequence to 'intro', playback would resume mid-storyboard and skip the intro.
        setPlayerMode('simulation');
        setCameraMode('auto');
        setSelectedPanelId(1);
        setIntroTimeElapsed(0);
        setCurrentTimeSec(0);
        setOutroTimeElapsed(0);
        setCurrentSequence(isIntroEnabled ? 'intro' : 'storyboard');
        if (introVideoRef.current) { try { introVideoRef.current.currentTime = 0; } catch (e) {} }
        if (outroVideoRef.current) { try { outroVideoRef.current.currentTime = 0; } catch (e) {} }
        
        // Allow a 300ms window for state changes and Fullscreen zoom to settle comfortably 
        setTimeout(() => {
          try {
            if (synth.ctx && synth.ctx.state === 'suspended') {
              synth.ctx.resume().catch(() => {});
            }
          } catch (e) {}

          // Flush play signals, starting the high fidelity audio element 
          if (audioRef.current && userAudioUrl) {
            audioRef.current.currentTime = 0;
          }
          setIsPlaying(true);

          try {
            if (mediaRecorder.state !== 'recording') {
              mediaRecorder.start();
            }
          } catch (recStartErr) {
            console.warn("Async recorder trigger bypassed:", recStartErr);
          }
        }, 300);

      } catch (recordingSetupErr: any) {
        console.error("Critical recorder initialization failed:", recordingSetupErr);
        setRecordingError(recordingSetupErr?.message || "MediaRecorder construction was suspended.");
        if (displayStream) {
          displayStream.getTracks().forEach(t => t.stop());
        }
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          }
        } catch (fsExitErr) {}
      }
    }
  };

  const rows = [1, 2, 3, 4, 5, 6];

  return (
    <div className={`space-y-6 ${isTheaterMode ? 'max-w-full' : 'max-w-6xl'} mx-auto relative transition-all duration-300`}>
      
      {/* NATIVE RELIABLE AUDIO TAG FOR BINDING CHOSEN WAV/MP3 SOUNDS */}
      <audio 
        id="voiceover-audio-player"
        ref={audioRef}
        src={userAudioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
        className="hidden"
        preload="auto"
      />

      {/* TAP-TO-SYNC CALIBRATION OVERLAY */}
      {syncCalibrating && (() => {
        const nextPanel = STORYBOARD_DATA[syncMarkIndex] || STORYBOARD_DATA[STORYBOARD_DATA.length - 1];
        const nowAt = audioRef.current ? audioRef.current.currentTime : currentTimeSec;
        const pct = Math.min(100, Math.round((syncMarkIndex / STORYBOARD_DATA.length) * 100));
        return (
          <div
            className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center px-6 select-none cursor-pointer"
            onClick={markSyncPanel}
          >
            <div className="absolute top-6 left-0 right-0 px-8 flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-zinc-500">
              <span>🎯 Tap-Sync Calibration</span>
              <span>Panel {syncMarkIndex} of {STORYBOARD_DATA.length} · {pct}%</span>
            </div>

            <div className="w-full max-w-2xl mx-auto text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-mono uppercase tracking-widest text-[#ff007f] mb-3">
                Tap the instant you hear panel #{nextPanel.panelId} begin
              </p>
              <div className="bg-zinc-950 border border-[#ff007f]/30 rounded-lg px-6 py-5 mb-6 shadow-[0_0_40px_rgba(255,0,127,0.15)]">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                  {nextPanel.phase} · Panel {nextPanel.panelId}
                </div>
                <p className="text-xl/relaxed text-white font-medium">
                  “{nextPanel.audio}”
                </p>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); markSyncPanel(); }}
                className="w-full bg-[#ff007f] text-zinc-950 font-black text-lg uppercase tracking-widest px-8 py-5 rounded-lg hover:brightness-110 active:scale-[0.99] transition cursor-pointer shadow-[0_0_30px_rgba(255,0,127,0.4)]"
              >
                ⏺ Mark Panel {nextPanel.panelId}  ·  {nowAt.toFixed(1)}s
              </button>
              <p className="text-[11px] font-mono text-zinc-500 mt-3">
                Press <span className="text-white font-bold">Space</span> / <span className="text-white font-bold">→</span> to mark · <span className="text-white font-bold">Backspace</span> to undo · <span className="text-white font-bold">Esc</span> to cancel
              </p>

              <div className="flex items-center justify-center gap-3 mt-7" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); undoLastSyncMark(); }}
                  disabled={syncMarkIndex <= 1}
                  className={`text-[10px] uppercase tracking-wider px-4 py-2 rounded border transition ${
                    syncMarkIndex <= 1
                      ? 'bg-zinc-900 border-white/5 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white cursor-pointer'
                  }`}
                >
                  ↶ Undo last
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); cancelSyncCalibration(); }}
                  className="text-[10px] uppercase tracking-wider px-4 py-2 rounded bg-red-950/30 border border-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PROJECT BAR — active experiment + import/export */}
      <input
        ref={projectFileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImportProjectFile}
        className="sr-only"
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-zinc-950 border border-[#ff007f]/15 p-3 rounded-sm select-none">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] uppercase tracking-widest font-black font-mono px-1.5 py-0.5 rounded bg-[#ff007f]/10 text-[#ff007f] border border-[#ff007f]/20">
              Experiment {activeProject.experimentId}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-mono">
              {storyboard.length} panels
            </span>
          </div>
          <h3 className="text-sm font-bold text-white truncate mt-1 font-serif">{activeProject.title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => projectFileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-[#ff007f]/40 transition cursor-pointer"
            title="Load a different experiment's storyboard.project.json"
          >
            <Upload className="w-3 h-3" /> Load Project
          </button>
          <button
            onClick={handleExportProject}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white hover:border-[#ff007f]/40 transition cursor-pointer"
            title="Download this project (panels + timing + settings) as JSON"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={handleResetToDefaultProject}
            className="text-[10px] uppercase tracking-wider font-bold px-3 py-2 rounded bg-zinc-900 border border-white/10 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            title="Reset to the built-in experiment-001 storyboard"
          >
            Reset
          </button>
        </div>
      </div>

      {/* DUAL SELECTOR SWITCH HUB */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-950 border border-white/5 p-3.5 rounded-sm select-none">
        
        <div className="flex rounded-sm bg-zinc-900 p-1 border border-white/5 w-full md:w-auto">
          <button
            onClick={() => setPlayerMode('simulation')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xs font-mono text-xs font-bold uppercase transition cursor-pointer ${
              playerMode === 'simulation'
                ? 'bg-[#ff007f] text-zinc-950 font-black shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                : 'text-zinc-450 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Autopilot Simulator</span>
          </button>
          
          <button
            onClick={() => setPlayerMode('youtube')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xs font-mono text-xs font-bold uppercase transition cursor-pointer ${
              playerMode === 'youtube'
                ? 'bg-[#ff007f] text-zinc-950 font-black shadow-[0_0_12px_rgba(255,0,127,0.3)]'
                : 'text-zinc-450 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>📺 YouTube Player Hub</span>
          </button>
        </div>

        {/* Youtube Link Inputs */}
        {playerMode === 'youtube' && (
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 max-w-md animate-fade-in">
            <span className="text-[9.5px] font-mono text-zinc-500 uppercase whitespace-nowrap font-black tracking-wider">
              VIDEO ID / URL:
            </span>
            <input
              id="youtube-url-input"
              type="text"
              value={youtubeUrlOrId}
              onChange={(e) => setYoutubeUrlOrId(e.target.value)}
              placeholder="Paste YouTube Link (e.g. watch?v=lT6V6A-v0kU)..."
              className="w-full bg-black border border-white/10 hover:border-[#ff007f]/40 focus:border-[#ff007f] focus:outline-none rounded px-3 py-1.5 text-xs font-mono text-white tracking-wide transition"
            />
          </div>
        )}

        {/* Dynamic script and recording controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 w-full md:w-auto select-none">
          {/* Isolation Fullscreen Recording Settings Checkbox */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[9px] font-mono text-zinc-500 hover:text-[#ff007f] transition select-none">
            <input
              type="checkbox"
              checked={autoFullscreenOnRecord}
              onChange={(e) => setAutoFullscreenOnRecord(e.target.checked)}
              className="rounded border-white/10 text-[#ff007f] bg-black focus:ring-0 cursor-pointer w-3 h-3"
            />
            <span className={autoFullscreenOnRecord ? "text-emerald-400 font-bold" : "text-zinc-550"}>
              📺 Auto-Fullscreen (Ensures clean 16:9)
            </span>
          </label>

          <button
            onClick={toggleRecording}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 border rounded-sm font-mono text-[10.5px] font-bold uppercase transition cursor-pointer ${
              isRecording
                ? 'bg-red-950 text-red-400 border-red-500 animate-pulse font-black'
                : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-red-500/50 hover:text-red-400'
            }`}
            title="Records your screen tab as video output with audios synchronised for instant download"
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-400' : 'bg-zinc-500'} inline-block shrink-0`} />
            <span>{isRecording ? "STOP & SAVE TAKE" : "CAPTURE VIDEO TAKE"}</span>
          </button>

          <button
            onClick={handleExportScript}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-900 border border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 rounded-sm font-mono text-[10.5px] font-bold uppercase text-zinc-300 transition cursor-pointer"
            title="Download the full complete 36 text panels script with timings as TXT"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export Script (TXT)</span>
          </button>
        </div>
      </div>

      {/* THE INTEGRATED 16:9 VIEWPORT STAGE */}
      <div id="recording-viewport-stage" className="bg-black border border-white/10 rounded-sm overflow-hidden relative shadow-2xl aspect-video group select-none">
        <div className="storyboard-stage-viewport-internal-content absolute inset-0">
          
          {/* Dynamic Scanline Grid styling across visual output */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none z-30" />

        {/* 1. MOUNTED YOUTUBE REPAIR CONTROLLERS */}
        <div 
          id="youtube-player-mode-stage"
          className={`absolute inset-0 z-10 bg-black transition-all duration-300 ${playerMode === 'youtube' ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}
        >
          {playerMode === 'youtube' && (
            <div className="w-full h-full relative">
              <iframe
                id="youtube-player-element"
                src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrlOrId)}?autoplay=0&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
                title="YouTube Video Replication"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
              <div className="absolute top-2 left-2 bg-black/80 border border-white/10 px-2 py-1 rounded text-[8px] font-mono text-zinc-400 select-none pointer-events-none">
                🎬 Tip: Click panels below to scrub matching parts.
              </div>
            </div>
          )}
        </div>

        {/* 2. PROGRAMMATIC CINEMATIC VIDEO SIMULATION STAGE */}
        {playerMode === 'simulation' && (() => {
          if (currentSequence === 'intro') {
            return (
              <div className="absolute inset-0 bg-[#07070a] overflow-hidden rounded-sm flex flex-col items-center justify-center font-mono">
                {customIntroUrl ? (
                  customIntroUrl.isVideo ? (
                    <video 
                      ref={introVideoRef}
                      src={customIntroUrl.url} 
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur && dur > 0 && !isNaN(dur)) {
                          setIntroDuration(Number(dur.toFixed(1)));
                        }
                      }}
                      className="w-full h-full object-cover" 
                      playsInline
                    />
                  ) : (
                    <img 
                      src={customIntroUrl.url} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center select-none bg-[#050508]">
                    <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#ff007f_1px,transparent_1px),linear-gradient(to_bottom,#ff007f_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    <div 
                      className="absolute top-0 bottom-0 w-[4px] bg-gradient-to-r from-transparent via-[#ff007f] to-transparent shadow-[0_0_20px_#ff007f] opacity-80"
                      style={{
                        left: `${(introTimeElapsed / introDuration) * 110 - 5}%`,
                        transition: 'left 100ms linear'
                      }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#ff007f]/10 rounded-full blur-[80px]" />
                    <div className="relative z-10 scale-105 transition-transform duration-500">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="flex items-center font-black tracking-tighter text-3xl text-white">
                          <span className="text-[#ff007f] mr-0.5 animate-pulse text-4xl">.</span>
                          <span>L8</span>
                        </div>
                        <div className="bg-[#ff007f] text-black font-black text-xs px-2.5 py-1.5 rounded border border-[#ff007f] shadow-[0_0_15px_rgba(255,0,127,0.4)] uppercase flex items-center gap-1 leading-none">
                          <span>Ent</span>
                          <span className="text-[10px] font-bold">↵</span>
                        </div>
                        <div className="bg-white text-zinc-950 font-black text-[10px] tracking-[0.2em] px-3.5 py-1.5 rounded-full uppercase leading-none border border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                          SPACE
                        </div>
                      </div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.4em] text-[#ff007f] text-center pl-[0.4em] mt-3 drop-shadow-[0_0_8px_#ff007f]">
                        L8ENTSPACE.COM
                      </div>
                    </div>
                    <div className="absolute w-[360px] h-[360px] border border-white/5 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '4s' }}>
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
                    </div>
                    <div className="absolute top-1/3 text-zinc-500 text-[8px] tracking-[0.3em] font-bold select-none uppercase">
                      LATE ENTERTAINMENT
                    </div>
                    <div className="absolute top-3 left-4 text-[7px] text-zinc-500 font-mono tracking-widest uppercase">
                      L8 PRODUCTION INTRO // PRE-FLIGHT CAPTURE
                    </div>
                    <div className="absolute bottom-3 right-4 text-[7px] text-[#ff007f] font-mono tracking-widest uppercase animate-pulse">
                      0:{String(Math.floor(introTimeElapsed)).padStart(2, '0')} / 0:{String(Math.floor(introDuration)).padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (currentSequence === 'outro') {
            return (
              <div className="absolute inset-0 bg-[#07070a] overflow-hidden rounded-sm flex flex-col items-center justify-center font-mono">
                {customOutroUrl ? (
                  customOutroUrl.isVideo ? (
                    <video 
                      ref={outroVideoRef}
                      src={customOutroUrl.url} 
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur && dur > 0 && !isNaN(dur)) {
                          setOutroDuration(Number(dur.toFixed(1)));
                        }
                      }}
                      className="w-full h-full object-cover" 
                      playsInline
                    />
                  ) : (
                    <img 
                      src={customOutroUrl.url} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  )
                ) : (
                  <div className="w-full h-full relative flex flex-col items-center justify-center p-6 text-center select-none bg-[#050508]">
                    <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#ff007f_1px,transparent_1px),linear-gradient(to_bottom,#ff007f_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#ff007f]/10 rounded-full blur-[90px]" />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      {[15, 30, 45, 60, 75].map((pos, idx) => (
                        <div 
                          key={idx}
                          className="absolute w-1 h-3 bg-rose-500 opacity-40 animate-bounce"
                          style={{
                            left: `${pos}%`,
                            top: `${(outroTimeElapsed * 15 + idx * 25) % 110}%`,
                            transform: `rotate(${idx * 45}deg)`
                          }}
                        />
                      ))}
                    </div>
                    <div className="relative z-10 flex flex-col items-center scale-95 transition-all">
                      <div className="flex items-center justify-center gap-1.5 mb-1.5">
                        <div className="flex items-center font-black tracking-tighter text-2xl text-white">
                          <span className="text-[#ff007f] mr-0.5 animate-pulse text-3xl">.</span>
                          <span>L8</span>
                        </div>
                        <div className="bg-[#ff007f] text-black font-black text-[10px] px-2 py-1 rounded border border-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.3)] uppercase">
                          Ent ↵
                        </div>
                        <div className="bg-white text-zinc-950 font-black text-[8.5px] tracking-wide px-3 py-1 rounded-full uppercase border border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                          SPACE
                        </div>
                      </div>
                      <span className="text-[8px] font-black tracking-[0.3em] text-[#ff007f] uppercase block mb-5">
                        L8ENTSPACE.COM
                      </span>
                      <div className="bg-zinc-900/90 border border-[#ff007f]/30 p-3 rounded max-w-xs text-center space-y-2 relative shadow-[0_0_20px_rgba(255,0,127,0.1)]">
                        <div className="text-[10px] font-black text-white uppercase tracking-wider font-mono">
                          REPLICATE THIS RESEARCH ?
                        </div>
                        <p className="text-[7.5px] text-zinc-400 leading-normal max-w-[180px] mx-auto font-sans">
                          Subscribe to standard labs feed, inspect raw pipeline logs, and get next trials.
                        </p>
                        <div className="flex items-center justify-center gap-1.5 bg-[#ff007f] hover:bg-[#ff007f]/90 text-black font-black text-[9px] uppercase px-4 py-1.5 rounded shadow-[0_0_10px_rgba(255,0,127,0.35)] cursor-pointer tracking-wider">
                          <span>SUBSCRIBE NOW</span>
                          <span className="animate-bounce">🔔</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute w-[400px] h-[400px] border border-[#ff007f]/5 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />
                    <div className="absolute top-3 left-4 text-[7px] text-zinc-500 font-mono tracking-widest uppercase">
                      L8 PRODUCTION OUTRO // PLAYBACK SUCCESS
                    </div>
                    <div className="absolute bottom-3 right-4 text-[7px] text-[#ff007f] font-mono tracking-widest uppercase animate-pulse">
                      0:{String(Math.floor(outroTimeElapsed)).padStart(2, '0')} / 0:{String(Math.floor(outroDuration)).padStart(2, '0')}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const isSelectedPanelBrollAutoActive = autoBrollPanels[selectedPanel.panelId];
          const timings = getPanelTimings(selectedPanel);
          const dur = timings.end - timings.start;
          const elapsed = currentTimeSec - timings.start;
          const isAutoBrollFocused = cameraMode === 'auto' && isPlaying && dur > 0 && isSelectedPanelBrollAutoActive && (elapsed / dur > 0.55);
          const isBrollActive = isAutoBrollFocused || (cameraMode === 'free' && cameraTarget === 'broll');

          return (
            <div className="absolute inset-0 bg-[#07070a] overflow-hidden rounded-sm">
              {/* Main Content Container with Ken Burns Camera zoom/pan */}
              <div 
                className="absolute inset-0 transition-transform duration-700 ease-out origin-center"
                style={{ transform: getCameraTransform() }}
              >
                <div className="w-full h-full bg-[#101014] p-0 text-white relative overflow-hidden select-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff007f]/10 rounded-full blur-[120px] pointer-events-none" />
                  
                  <style>{`
                    @keyframes scansweep {
                      0% { top: 0%; opacity: 0.2; }
                      50% { opacity: 0.9; }
                      100% { top: 100%; opacity: 0.2; }
                    }
                  `}</style>

                  {/* Main Contents */}
                  <div className="w-full h-full">
                    {renderVisualScreen()}
                  </div>
                </div>
              </div>

              {/* B-ROLL LIVE FEED PICTURE-IN-PICTURE (Absolutely placed, morphs beautifully to fullscreen when active) */}
              {isBRollFeedEnabled && (
                <div 
                  id="cinematic-broll-viewport"
                  className={`absolute transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden bg-zinc-950 flex flex-col justify-between border ${
                    brollZoomed
                      ? 'rounded-none border-[#ff007f]/40 shadow-none z-35'
                      : 'border-[#ff007f]/30 hover:border-[#ff007f]/80 rounded-sm shadow-2xl z-20 group/feed cursor-pointer hover:scale-[1.03]'
                  }`}
                  style={{
                    right: brollZoomed ? '0px' : '12px',
                    bottom: brollZoomed ? '0px' : '12px',
                    width: brollZoomed ? '100%' : '160px',
                    height: brollZoomed ? '100%' : '90px',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCameraTarget(cameraTarget === 'broll' ? 'main' : 'broll');
                    setCameraMode('free');
                    synth.playBeep(640, 0.08);
                  }}
                  title={brollZoomed ? "Click to lock focus back on slide content" : "Click to maximize B-Roll camera"}
                >
                  <div className="relative w-full h-full">
                    {/* B-Roll Image or Video Reference - Slow Zoom/Pan Ken Burns Effect when active to make it feel alive */}
                    {customBrollUrls[brollDisplayPanel.panelId] ? (
                      customBrollUrls[brollDisplayPanel.panelId].isVideo ? (
                        <BRollVideoPlayer 
                          key={customBrollUrls[brollDisplayPanel.panelId].url}
                          src={customBrollUrls[brollDisplayPanel.panelId].url} 
                          className="w-full h-full object-cover opacity-90 transition-transform duration-[15000ms] ease-out origin-center"
                          style={{
                            transform: brollZoomed ? 'scale(1.15) translate(8px, 4px)' : 'scale(1.0) translate(0px, 0px)'
                          }}
                          isActive={isPlaying && brollZoomed && brollPlaying}
                          onVideoEnded={handleVideoEnded}
                        />
                      ) : (
                        <img 
                          src={customBrollUrls[brollDisplayPanel.panelId].url} 
                          alt="Custom B-roll reference feed"
                          className="w-full h-full object-cover opacity-90 transition-transform duration-[15000ms] ease-out origin-center"
                          style={{
                            transform: brollZoomed ? 'scale(1.15) translate(8px, 4px)' : 'scale(1.0) translate(0px, 0px)'
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full relative flex flex-col items-center justify-center p-3 text-center bg-[#050508] border border-[#ff007f]/20 font-mono select-none overflow-hidden text-zinc-450">
                        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ff007f_1px,transparent_1px),linear-gradient(to_bottom,#ff007f_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                        <div className="absolute inset-2 border border-dashed border-white/5 pointer-events-none rounded" />
                        
                        {/* Camera corner brackets */}
                        <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-[#ff007f]/50" />
                        <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-[#ff007f]/50" />
                        <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-[#ff007f]/50" />
                        <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-[#ff007f]/50" />

                        <Video className="w-5 h-5 text-[#ff007f]/40 mb-1.5 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">CAMERA RAW REFERENCE FEED</span>
                        <span className="text-[7.5px] font-bold text-[#ff007f] mt-0.5 uppercase tracking-wider">
                          {getBRollTitle(brollDisplayPanel.phase)}
                        </span>
                        <p className="text-[6.5px] text-zinc-500 max-w-[150px] leading-snug mt-1.5 whitespace-normal">
                          {getBRollDesc(brollDisplayPanel.phase)}
                        </p>
                      </div>
                    )}
 
                    {/* Flashing REC indicator */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 px-1.5 py-0.5 rounded border border-white/11 text-[6.5px] font-mono leading-none z-10 transition-all duration-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-450 font-black uppercase tracking-wider text-[6px]">
                        {brollZoomed ? "LIVE B-ROLL RAW FEED // HD-02" : "CAM RAW-02"}
                      </span>
                    </div>
 
                    {/* Timecode counter */}
                    <div className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded border border-white/11 text-[6px] font-mono leading-none text-zinc-400 z-10">
                      TC {formatTimecode(currentTimeSec)}
                    </div>
 
                    {/* Active audio waveform bars inside B-roll monitor */}
                    <div className="absolute bottom-2 right-3 flex items-end gap-0.5 h-4 z-10">
                      {[1, 2, 3, 4, 5].map((bar) => {
                        const h = isPlaying ? Math.floor(Math.random() * 8) + 2 : 1;
                        return (
                          <div 
                            key={bar} 
                            className="w-0.5 bg-[#ff007f] rounded-t-xs transition-all duration-150" 
                            style={{ height: `${h * 1.5}px` }} 
                          />
                        );
                      })}
                    </div>
 
                    {/* Laser scanning sweep overlay */}
                    <div className="absolute inset-x-0 h-0.5 bg-[#ff007f]/30 pointer-events-none animate-[scansweep_3s_linear_infinite]" />
 
                    {/* Bottom overlay text details describing active B-roll directior scene */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-2 pt-6 transition-all duration-300">
                      <span className="text-[6px] text-zinc-400 block uppercase tracking-wider leading-none select-none font-bold">
                        🎥 {brollZoomed ? "DIRECTOR ACTIVE CINEMATIC B-ROLL CUT" : "Active B-Roll Preview"}
                      </span>
                      <span className={`leading-tight text-[#ff007f] font-black uppercase tracking-wider truncate block transition-all ${
                        brollZoomed ? 'text-[11px] mt-1' : 'text-[7.5px]'
                      }`}>
                        {getBRollTitle(brollDisplayPanel.phase)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}



        {/* REPLICABLE PLAY INSTRUCTION FOR AUTOPILOT PREVIEW BAR */}
        {playerMode === 'simulation' && !isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none z-40 animate-fade-in hover:bg-black/75 transition-colors duration-300">
            <button 
              id="simulation-play-btn"
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-[#ff007f] text-zinc-950 hover:scale-110 active:scale-95 transition-transform duration-200 flex items-center justify-center shadow-[0_0_30px_rgba(255,0,127,0.8)] cursor-pointer"
              title="Click to Play Film Simulation"
            >
              <Play className="w-8 h-8 fill-current translate-x-0.5 text-zinc-950" />
            </button>
            <span className="mt-3 text-[9px] font-mono uppercase text-[#ff007f] tracking-widest opacity-80 animate-pulse">
              Click to Play Simulation
            </span>
          </div>
        )}

        {/* CONTROLLER TIMELINE CONTROLS */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/95 to-transparent p-3 pt-8 pb-3 flex flex-col justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 z-45">
          
          <div className="flex items-center gap-3">
            <input 
              id="scrub-slider"
              type="range"
              min="0"
              max={totalDuration}
              step="0.5"
              value={currentTimeSec}
              onChange={handleScrubChange}
              className="w-full h-1 bg-zinc-805 rounded appearance-none cursor-pointer accent-[#ff007f] outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-white mt-1.5 select-none font-mono text-[10px] sm:text-xs">
            
            <div className="flex items-center gap-4">
              <button 
                id="hud-play-btn"
                onClick={togglePlay}
                className="text-white hover:text-[#ff007f] cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff007f]" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <span className="text-[10px] text-zinc-400 font-bold">
                <span className="text-[#ff007f] font-mono">{secondsToTime(currentTimeSec)}</span> / {secondsToTime(totalDuration)}
              </span>

              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider ${getPhaseTagColor(selectedPanel.phase)}`}>
                Phase: {selectedPanel.phase}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {playerMode === 'simulation' && (
                <button
                  onClick={() => setCameraMode(prev => prev === 'auto' ? 'free' : 'auto')}
                  className={`px-2 py-0.5 font-bold uppercase tracking-widest text-[8px] border rounded transition cursor-pointer ${
                    cameraMode === 'auto' 
                      ? 'border-[#ff007f] text-[#ff007f] bg-[#ff007f]/5' 
                      : 'border-zinc-700 text-zinc-450'
                  }`}
                  title="Command-Autopilot camera centering zooms vs custom mouse pans"
                >
                  Auto-Cam: {cameraMode === 'auto' ? 'ON' : 'OFF'}
                </button>
              )}

              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="hover:text-[#ff007f] cursor-pointer text-zinc-400"
                title="Theater/Widescreen Canvas Mode toggling"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        </div>
      </div>

      {/* AUDIO BINDERS AND RECORDING HELP HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Audio File Setup Card */}
        <div className="lg:col-span-2 bg-[#0c0c0f] border border-white/5 rounded-sm p-4 flex flex-col gap-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#ff007f]" />
                <h4 className="font-serif text-sm font-bold text-zinc-100 italic flex items-center gap-1.5">
                  <span>Voiceover Track Loader</span>
                  {userAudioFile && <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono tracking-widest animate-pulse">Armed</span>}
                </h4>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                Load local audio file (WAV, MP3, M4A) to drive autopilot camera pan alignments.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <label 
                htmlFor="voiceover-file-input"
                className="flex items-center justify-center gap-2 px-3.5 py-1.5 border rounded bg-zinc-900 border-white/10 hover:border-[#ff007f]/50 hover:bg-zinc-850 cursor-pointer transition select-none"
              >
                <Upload className="w-3.5 h-3.5 text-[#ff007f]" />
                <span className="text-[9.5px] uppercase font-bold tracking-wider truncate max-w-[120px] text-zinc-200 font-mono">
                  {userAudioFile ? userAudioFile.name : "Choose File"}
                </span>
                <input 
                  id="voiceover-file-input"
                  type="file" 
                  accept="audio/*"
                  onChange={handleAudioLoad}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4 bg-black/40 border border-white/5 p-3 rounded">
            {/* Editable panel start + end times */}
            <div className="space-y-2 pb-3 border-b border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-200 font-bold flex items-center gap-1">
                  ⏱ Panel #{selectedPanel.panelId} timing
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  duration {(getPanelTimings(selectedPanel).end - getPanelTimings(selectedPanel).start).toFixed(1)}s
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* START */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 flex items-center justify-between">
                    <span>Start (sec)</span>
                    {manualPanelStarts[selectedPanel.panelId] !== undefined && (
                      <button onClick={() => clearPanelStart(selectedPanel.panelId)} className="text-[8px] text-emerald-400 hover:text-white" title="Revert to auto">↺ auto</button>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      key={`pstart-${selectedPanel.panelId}-${manualPanelStarts[selectedPanel.panelId] ?? 'auto'}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={resolvePanelStart(selectedPanel).toFixed(1)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseTimeInput((e.target as HTMLInputElement).value); if (v !== null) setPanelStart(selectedPanel.panelId, v); (e.target as HTMLInputElement).blur(); } }}
                      onBlur={(e) => { const v = parseTimeInput(e.target.value); if (v !== null) setPanelStart(selectedPanel.panelId, v); }}
                      className={`w-full text-center bg-zinc-950 border rounded py-1.5 text-[13px] font-mono text-white outline-none focus:border-[#ff007f]/60 ${manualPanelStarts[selectedPanel.panelId] !== undefined ? 'border-emerald-500/40' : 'border-white/10'}`}
                      title="Type seconds (e.g. 12.4) or m:ss (e.g. 0:12), then Enter"
                    />
                    <button
                      onClick={() => setPanelStartToPlayhead(selectedPanel)}
                      className="shrink-0 text-[9px] font-black uppercase px-1.5 py-2 rounded bg-[#ff007f]/15 border border-[#ff007f]/30 text-[#ff007f] hover:bg-[#ff007f] hover:text-zinc-950 transition"
                      title="Set start to the current playhead"
                    >⏺</button>
                  </div>
                </div>
                {/* END */}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 flex items-center justify-between">
                    <span>End (sec){nextPanelOf(selectedPanel.panelId) && <span className="text-zinc-600 normal-case"> = next start</span>}</span>
                    {isPanelEndEdited(selectedPanel.panelId) && (
                      <button onClick={() => clearPanelEnd(selectedPanel.panelId)} className="text-[8px] text-emerald-400 hover:text-white" title="Revert to auto">↺ auto</button>
                    )}
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      key={`pend-${selectedPanel.panelId}-${panelEndKey(selectedPanel.panelId)}`}
                      type="text"
                      inputMode="decimal"
                      defaultValue={resolvePanelEnd(selectedPanel).toFixed(1)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseTimeInput((e.target as HTMLInputElement).value); if (v !== null) setPanelEnd(selectedPanel.panelId, v); (e.target as HTMLInputElement).blur(); } }}
                      onBlur={(e) => { const v = parseTimeInput(e.target.value); if (v !== null) setPanelEnd(selectedPanel.panelId, v); }}
                      className={`w-full text-center bg-zinc-950 border rounded py-1.5 text-[13px] font-mono text-white outline-none focus:border-[#ff007f]/60 ${isPanelEndEdited(selectedPanel.panelId) ? 'border-emerald-500/40' : 'border-white/10'}`}
                      title="Type seconds (e.g. 19.0) or m:ss (e.g. 0:19), then Enter"
                    />
                    <button
                      onClick={() => setPanelEndToPlayhead(selectedPanel)}
                      className="shrink-0 text-[9px] font-black uppercase px-1.5 py-2 rounded bg-[#ff007f]/15 border border-[#ff007f]/30 text-[#ff007f] hover:bg-[#ff007f] hover:text-zinc-950 transition"
                      title="Set end to the current playhead"
                    >⏺</button>
                  </div>
                </div>
              </div>
              <p className="text-[10px]/1.35 text-zinc-500 font-sans">
                Type the start and end (seconds, or <span className="font-mono text-zinc-400">m:ss</span>) and press Enter — or hit <span className="text-[#ff007f] font-bold">⏺</span> to grab the current playhead ({secondsToTime(currentTimeSec)}). By default a panel ends where the next one starts; only edit what drifts.
              </p>
            </div>

            {/* Vocal Sync Timing Offset control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-300 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#ff007f]" />
                  ⏱ Panel #{selectedPanel.panelId} Offset:
                </span>
                <span className={`font-black uppercase tracking-wide px-1.5 py-0.5 rounded text-[10px] ${
                  (panelOffsets[selectedPanel.panelId] ?? 0) !== 0 
                    ? 'bg-rose-950/30 text-[#ff007f] border border-[#ff007f]/20' 
                    : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {(panelOffsets[selectedPanel.panelId] ?? 0) > 0 ? `+${panelOffsets[selectedPanel.panelId] ?? 0}` : (panelOffsets[selectedPanel.panelId] ?? 0)}s Delay
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={panelOffsets[selectedPanel.panelId] ?? 0}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setPanelOffsets(prev => ({
                      ...prev,
                      [selectedPanel.panelId]: val
                    }));
                  }}
                  className="flex-1 h-1.5 bg-zinc-850 accent-[#ff007f] outline-none rounded cursor-pointer"
                />
                <button
                  onClick={() => {
                    setPanelOffsets(prev => ({
                      ...prev,
                      [selectedPanel.panelId]: 0
                    }));
                    synth.playBeep(440, 0.05);
                  }}
                  className="text-[9px] uppercase px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition"
                >
                  Reset Panel
                </button>
              </div>
              <p className="text-[10px]/1.35 text-zinc-500 font-sans">
                Aligns Panel #{selectedPanel.panelId} with your audio timeline. Negative values pull the transition earlier; positive values delay it.
              </p>
              
              {/* Reset/Global buttons inside panel settings */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/5 justify-end">
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to revert offsets on ALL 36 panels back to 0?")) {
                      setPanelOffsets({});
                      synth.playBeep(330, 0.1);
                    }
                  }}
                  className="text-[8px] uppercase tracking-wider px-2 py-1 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 hover:text-red-300 transition"
                  title="Zero out all timing offsets back to original defaults"
                >
                  Reset All 36 Panels
                </button>
                <button
                  onClick={() => {
                    const activeVal = panelOffsets[selectedPanel.panelId] ?? 0;
                    if (window.confirm(`Copy current offset (${activeVal}s) as a global shift to all panels?`)) {
                      const newOffsets: Record<number, number> = {};
                      STORYBOARD_DATA.forEach(p => {
                        newOffsets[p.panelId] = activeVal;
                      });
                      setPanelOffsets(newOffsets);
                      synth.playBeep(660, 0.1);
                    }
                  }}
                  className="text-[8px] uppercase tracking-wider px-2 py-1 rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition"
                  title="Apply current offset value as a universal delay shift across all story elements"
                >
                  Apply to All
                </button>
              </div>
            </div>

            {/* Slider for uploaded audio track volume */}
            {userAudioUrl && (
              <div className="flex items-center justify-between gap-3 text-[10px] pt-1.5 border-t border-white/5 font-mono">
                <span className="text-zinc-350 font-bold whitespace-nowrap">🎤 AUDIO TRACK VOLUME:</span>
                <div className="flex items-center gap-2 flex-1 max-w-xs justify-end">
                  <input
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-zinc-800 accent-[#ff007f] outline-none rounded"
                  />
                  <span className="text-white font-bold w-10 text-right">{Math.round(audioVolume * 100)}%</span>
                </div>
              </div>
            )}

            {/* Auto-Sync Timing Scaling Checkbox */}
            <div className="pt-2 border-t border-white/5 font-mono">
              <label className="inline-flex items-start gap-2.5 cursor-pointer text-[10px] text-zinc-450 hover:text-white transition select-none">
                <input
                  type="checkbox"
                  checked={scaleTimingsToAudio}
                  onChange={(e) => setScaleTimingsToAudio(e.target.checked)}
                  className="rounded border-white/10 text-[#ff007f] bg-black focus:ring-0 cursor-pointer w-3.5 h-3.5 mt-0.5"
                />
                <span className={scaleTimingsToAudio ? "text-emerald-400 font-semibold leading-tight" : "text-zinc-500 leading-tight block"}>
                  Auto-scale slide timings to perfectly fill loaded audio track length ({Math.round(audioDuration)} seconds)
                </span>
              </label>
            </div>

            {/* Tap-to-sync calibration */}
            <div className="pt-2 border-t border-white/5 font-mono space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-300 font-bold flex items-center gap-1">
                  🎯 Tap-Sync (optional quick pass)
                </span>
                {Object.keys(manualPanelStarts).length > 0 && (
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                    {Object.keys(manualPanelStarts).length}/{STORYBOARD_DATA.length} edited
                  </span>
                )}
              </div>
              <p className="text-[10px]/1.35 text-zinc-500 font-sans">
                Most of the time you won't need this — use the per-panel <span className="text-[#ff007f] font-bold">Set to playhead</span> / time editor above, which has no time pressure. This is just a one-shot pass: it plays the voiceover and you tap <span className="text-zinc-300 font-bold">Space</span> at each panel's start. Whatever it captures, you can still fine-tune by editing any panel afterwards.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={beginSyncCalibration}
                  disabled={!userAudioUrl}
                  className={`flex-1 text-[10px] uppercase tracking-wider font-black px-3 py-2 rounded transition ${
                    userAudioUrl
                      ? 'bg-[#ff007f] text-zinc-950 hover:brightness-110 cursor-pointer'
                      : 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed'
                  }`}
                  title={userAudioUrl ? "Start the live tap-sync pass" : "Load a voiceover track first"}
                >
                  {Object.keys(manualPanelStarts).length > 0 ? 'Re-run Tap-Sync' : 'Start Tap-Sync'}
                </button>
                {(Object.keys(manualPanelStarts).length > 0 || Object.keys(manualPanelEnds).length > 0) && (
                  <button
                    onClick={clearManualSync}
                    className="text-[9px] uppercase tracking-wider px-2 py-2 rounded bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition whitespace-nowrap"
                    title="Discard all edited start/end times and snap every panel back to the original auto-scaled timing"
                  >
                    ↺ Reset all to Original
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cinematic Director's Camera & Sound Desk */}
        <div className="lg:col-span-2 bg-[#0c0c0f] border border-white/5 rounded-sm p-4 flex flex-col gap-4 select-none font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span className="text-[11px] uppercase tracking-wider">Cinematic Director's Deck</span>
            </div>
            {/* Blinking camera position status */}
            <span className={`text-[8.5px] px-2 py-0.5 rounded font-black border uppercase tracking-wider ${
              cameraMode === 'auto' 
                ? 'bg-rose-950/20 text-[#ff007f] border-[#ff007f]/30 font-bold shadow-[0_0_8px_rgba(255,0,127,0.15)]' 
                : 'bg-indigo-950/20 text-indigo-400 border-indigo-500/30 font-bold'
            }`}>
              Camera Mode: {cameraMode === 'auto' ? 'AUTOPILOT TRACKING' : 'MANUAL CONTROL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-black/35 border border-white/5 p-2.5 rounded">
              <span className="text-[8.5px] text-zinc-450 font-bold uppercase tracking-wider">Focus Mode / Directing:</span>
              <div className="flex flex-col gap-1.5 pt-1.5">
                <button
                  onClick={() => {
                    setCameraMode('auto');
                    synth.playBeep(440, 0.08);
                  }}
                  className={`w-full py-1 text-[9.5px] font-black uppercase text-center border cursor-pointer rounded-xs transition ${
                    cameraMode === 'auto'
                      ? 'bg-[#ff007f]/10 text-[#ff007f] border-[#ff007f]/40 font-bold'
                      : 'bg-zinc-900 border-white/5 text-zinc-450 hover:text-white'
                  }`}
                  title="Enable autopilot director camera shifts centered on active slides and transitioning to B-roll"
                >
                  🟢 Autopilot Tracking
                </button>
                <button
                  onClick={() => {
                    setCameraMode('free');
                    synth.playBeep(440, 0.08);
                  }}
                  className={`w-full py-1 text-[9.5px] font-black uppercase text-center border cursor-pointer rounded-xs transition ${
                    cameraMode === 'free'
                      ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/40 font-bold'
                      : 'bg-zinc-900 border-white/5 text-zinc-405 hover:text-white'
                  }`}
                  title="Free camera mode allowing you to lock focal points manually"
                >
                  🔵 Lock/Manual Camera
                </button>
              </div>
            </div>

            <div className="space-y-1 bg-black/35 border border-white/5 p-2.5 rounded">
              <span className="text-[8.5px] text-zinc-450 font-bold uppercase tracking-wider">Focal Point Lock:</span>
              <div className="flex flex-col gap-1.5 pt-1.5">
                <button
                  onClick={() => {
                    setCameraTarget('main');
                    setCameraMode('free');
                    synth.playBeep(520, 0.08);
                  }}
                  disabled={cameraMode === 'auto'}
                  className={`w-full py-1 text-[9.5px] font-black uppercase text-center border rounded-xs transition ${
                    cameraMode === 'auto' ? 'opacity-40 cursor-not-allowed text-zinc-650 border-white/3' : 'cursor-pointer'
                  } ${
                    cameraMode === 'free' && cameraTarget === 'main'
                      ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-zinc-900 border-white/5 text-zinc-450 hover:text-white'
                  }`}
                >
                  🖥 Main Content View
                </button>
                <button
                  onClick={() => {
                    setCameraTarget('broll');
                    setCameraMode('free');
                    synth.playBeep(520, 0.08);
                  }}
                  disabled={cameraMode === 'auto'}
                  className={`w-full py-1 text-[9.5px] font-black uppercase text-center border rounded-xs transition ${
                    cameraMode === 'auto' ? 'opacity-40 cursor-not-allowed text-zinc-650 border-white/3' : 'cursor-pointer'
                  } ${
                    cameraMode === 'free' && cameraTarget === 'broll'
                      ? 'bg-[#ff007f]/10 text-[#ff007f] border-[#ff007f]/40 font-bold shadow-[0_0_8px_rgba(255,0,127,0.15)]'
                      : 'bg-zinc-900 border-white/5 text-zinc-450 hover:text-white'
                  }`}
                >
                  🎥 Zoom B-Roll Overlay
                </button>
              </div>
            </div>
          </div>

          {/* L8 BRAND INTRO & OUTRO CONFIGURATION SECTION */}
          <div className="space-y-2 bg-[#ff007f]/5 border border-[#ff007f]/15 rounded p-2.5">
            <div className="flex items-center gap-1.5 border-b border-[#ff007f]/10 pb-1.5 select-none">
              <Film className="w-3.5 h-3.5 text-[#ff007f]" />
              <span className="text-white font-black uppercase text-[9px] tracking-wider">L8 Brand Intro / Outro Controller</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9.5px]">
              {/* Intro Toggle & File Zone */}
              <div className="space-y-1.5 p-1.5 bg-black/40 border border-white/5 rounded">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-350 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={isIntroEnabled}
                      onChange={(e) => {
                        setIsIntroEnabled(e.target.checked);
                        synth.playBeep(440, 0.05);
                      }}
                      className="rounded border-white/10 text-[#ff007f] bg-black focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className={isIntroEnabled ? "text-emerald-400 font-bold" : "text-zinc-500"}>Intro Scene (10s)</span>
                  </label>
                </div>
                
                {isIntroEnabled && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <label 
                      htmlFor="custom-intro-video-input"
                      className="block text-center text-[8px] font-black uppercase py-1 rounded bg-zinc-900 border border-white/10 hover:border-[#ff007f]/50 cursor-pointer transition select-none"
                    >
                      {customIntroUrl ? "CUSTOM INTRO LOADED ✓" : "LOAD INTRO MP4"}
                    </label>
                    <input
                      id="custom-intro-video-input"
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          const isVideo = file.type.startsWith('video/');
                          setCustomIntroUrl({ url, isVideo });
                          synth.playBeep(880, 0.1);
                          saveGenericFile('custom_intro_media', file, { isVideo }).catch(err => {
                            console.warn("Failed to persist custom intro to IndexedDB:", err);
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    {customIntroUrl && (
                      <button
                        onClick={() => {
                          if (customIntroUrl) URL.revokeObjectURL(customIntroUrl.url);
                          setCustomIntroUrl(null);
                          synth.playBeep(330, 0.1);
                          deleteGenericFile('custom_intro_media').catch(() => {});
                        }}
                        className="w-full text-center text-[7.5px] uppercase font-bold text-red-400 hover:text-red-300 transition block mt-0.5 cursor-pointer"
                      >
                        [ Revert to Native Logo ]
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Outro Toggle & File Zone */}
              <div className="space-y-1.5 p-1.5 bg-black/40 border border-white/5 rounded">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-350 hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={isOutroEnabled}
                      onChange={(e) => {
                        setIsOutroEnabled(e.target.checked);
                        synth.playBeep(440, 0.05);
                      }}
                      className="rounded border-white/10 text-[#ff007f] bg-black focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className={isOutroEnabled ? "text-emerald-400 font-bold" : "text-zinc-500"}>Outro Scene (10s)</span>
                  </label>
                </div>

                {isOutroEnabled && (
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <label 
                      htmlFor="custom-outro-video-input"
                      className="block text-center text-[8px] font-black uppercase py-1 rounded bg-zinc-900 border border-white/10 hover:border-[#ff007f]/50 cursor-pointer transition select-none"
                    >
                      {customOutroUrl ? "CUSTOM OUTRO LOADED ✓" : "LOAD OUTRO MP4"}
                    </label>
                    <input
                      id="custom-outro-video-input"
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          const isVideo = file.type.startsWith('video/');
                          setCustomOutroUrl({ url, isVideo });
                          synth.playBeep(880, 0.1);
                          saveGenericFile('custom_outro_media', file, { isVideo }).catch(err => {
                            console.warn("Failed to persist custom outro to IndexedDB:", err);
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    {customOutroUrl && (
                      <button
                        onClick={() => {
                          if (customOutroUrl) URL.revokeObjectURL(customOutroUrl.url);
                          setCustomOutroUrl(null);
                          synth.playBeep(330, 0.1);
                          deleteGenericFile('custom_outro_media').catch(() => {});
                        }}
                        className="w-full text-center text-[7.5px] uppercase font-bold text-red-400 hover:text-red-300 transition block mt-0.5 cursor-pointer"
                      >
                        [ Revert to Native Logo ]
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-[8px] leading-snug text-zinc-500">
              When playing/recording, the sequencer inserts full-screen brand intros and subscription outro cards dynamically. Load your custom videos, or use our high-fidelity native L8 Ent SPACE animation models!
            </p>
          </div>

          <div className="space-y-1 bg-zinc-950/50 border border-white/5 p-2 rounded text-[10px]">
            <div className="flex items-center justify-between pb-1 select-none">
              <span className="text-[#ff007f] font-black uppercase text-[8.5px] tracking-wider">Active B-Roll Scene Directions:</span>
              <button
                onClick={() => setIsBRollFeedEnabled(!isBRollFeedEnabled)}
                className="text-[8px] uppercase tracking-widest text-[#ff007f] hover:underline transition cursor-pointer"
              >
                {isBRollFeedEnabled ? 'Hide HUD PIP overlay' : 'Show HUD PIP overlay'}
              </button>
            </div>
            <p className="text-zinc-300 italic font-sans pl-2 border-l border-[#ff007f]/30 leading-snug">
              "{getBRollDesc(selectedPanel.phase)}"
            </p>
          </div>

          {/* GOOGLE FLOW COMEDIC PROMPT COOKBOOK */}
          <div className="bg-zinc-950/85 border border-[#ff007f]/20 rounded p-2.5 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-pulse" />
                <span className="text-white font-black uppercase text-[9px] tracking-wider">Google Flow Comedy B-Roll Cookbook</span>
              </div>
              <button 
                onClick={() => {
                  setIsCookbookOpen(!isCookbookOpen);
                  synth.playBeep(600, 0.05);
                }}
                className="text-[8px] uppercase font-bold text-zinc-400 hover:text-[#ff007f] cursor-pointer"
              >
                {isCookbookOpen ? '[ COLLAPSE ]' : '[ EXPAND ]'}
              </button>
            </div>

            {isCookbookOpen && (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                <p className="text-zinc-450 leading-relaxed text-[8.5px] border-b border-white/3 pb-1.5">
                  Here are curated, comedy-rich visual prompts designed for <strong>Google Flow / Vids</strong>. Generate these 3-5 second loops, then upload them directly into their respective scene slots below!
                </p>

                {[
                  {
                    panelId: 3,
                    title: "Panel 3: The 4-Engine Obstacle Course",
                    phase: "Hook",
                    prompt: "Four different retro beige computer monitors on actual running human legs (Gemini, Claude, ChatGPT, Perplexity) sprinting frantically through a muddy competitive hurdle race under direct sport spotlights. One computer slips cartoonishly on a single banana peel, sending loose shiny green RAM chips and paper reports flying into the air. High-contrast slow-motion physics, 3D claymation style, comedic timing."
                  },
                  {
                    panelId: 11,
                    title: "Panel 11: Simpson's Paradox Scale Tilt",
                    phase: "The Danger",
                    prompt: "An elegant, old-fashioned golden balancing scale inside a stellar, sterile sci-fi physics laboratory. On the left tray sits a tiny, scholastic white hamster wearing round reading glasses, reading a micro clipboard. Suddenly, a gigantic, highly glossed glazed donut drops out of nowhere onto the right tray. The scale slams down so violently that the poor reading hamster is launched with high-speed physics directly into low earth orbit, leaving tiny starry sparkles behind. High-detail 3D animated comedy, photorealistic cinematic lighting."
                  },
                  {
                    panelId: 19,
                    title: "Panel 19: Canine 31% Champagne Leap",
                    phase: "Results",
                    prompt: "A beautiful golden retriever data scientist wearing white lab-coat protection and pink neon safety goggles, staring with deep scientific intensity at a green flatlining hospital monitor on a sleek stainless steel desk. Suddenly, the green heartbeat line jumps up over 31% to form a massive glowing neon dog-bone shape. The dog throws its front paws up in absolute victory, barking happily as a burst of multi-colored confetti rains from the ceiling, Pixar movie style."
                  },
                  {
                    panelId: 24,
                    title: "Panel 24: Ant's Confident 10x Heavy Lift",
                    phase: "The Fix",
                    prompt: "An incredibly muscular, tiny worker ant wearing a miniature glossy pink hard hat. The ant is walking confidently across a polished wooden lab desk holding a solid golden champion trophy that is exactly 10 times its physical size. In the soft-focus background, a giant, incredibly confused fat orange tabby cat wearing a white lab collar tries to swipe at the trophy but misses completely with a funny face. High-fidelity cinematic 3D render."
                  },
                  {
                    panelId: 28,
                    title: "Panel 28: Judge Robot Noodle Trial",
                    phase: "Rigor",
                    prompt: "A polished golden futuristic robot judge wearing a classic, comical white curled barrister wig, sitting behind a high mahogany court bench. The robot judge is holding an enormous, funny magnifying glass up to examine a single long squiggly ramen noodle resting on a tiny, expensive silver platter, maintaining an expression of absolute, supreme scientific gravitas. Heavy dramatic side lighting, hilarious forensic examination scene."
                  },
                  {
                    panelId: 32,
                    title: "Panel 32: Hamster Mach-3 Rocket Shoe",
                    phase: "Threats",
                    prompt: "A hyper-realistic fluffy hamster wearing a tiny red motorcycle helmet, sitting proudly inside a single retro red leather sneaker that has a glowing sci-fi exhaust booster rocket duct-taped to the sole. The shoe-rocket is speeding down a miniature racetrack at extreme speeds, leaving behind a comedic dust trail of spinning paper clipcharts and popcorn kernels. Cinematic wide-angle drone tracking shot."
                  },
                  {
                    panelId: 36,
                    title: "Panel 36: subscription Confetti Anvil Desk",
                    phase: "Outro",
                    prompt: "A modern home desk workspace with glowing custom monitors showing data code. Suddenly, a massive, bright red 'SUBSCRIBE' physical play button drops straight down from the ceiling like a heavy steel anvil, smashing into the desk and causing a gigantic, spectacular explosion of rainbow confetti and flying sheets of spreadsheets. A surprised cat peeks out with a single piece of confetti resting on its forehead. Ultra-high-detail photorealistic comedy style."
                  }
                ].map((item) => (
                  <div key={item.panelId} className="bg-zinc-900 border border-white/5 rounded p-2 space-y-1.5 transition hover:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[8.5px] text-zinc-200 tracking-wide">{item.title}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.prompt);
                          setCopiedBrollId(String(item.panelId));
                          synth.playBeep(880, 0.08);
                          setTimeout(() => setCopiedBrollId(null), 2000);
                        }}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase transition-all border ${
                          copiedBrollId === String(item.panelId)
                            ? 'bg-green-950 border-green-500/55 text-green-400'
                            : 'bg-zinc-950 border-zinc-800 text-[#ff007f] hover:text-white hover:border-[#ff007f]/50'
                        }`}
                      >
                        {copiedBrollId === String(item.panelId) ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Clipboard className="w-2.5 h-2.5" />
                            Copy Prompt
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-black/50 border border-white/3 rounded p-1 text-zinc-400 font-mono text-[7.5px] leading-relaxed select-all">
                      {item.prompt}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[6.5px] uppercase text-[#ff007f] font-mono">Cue Timing:</span>
                      <span className="text-[6.5px] text-zinc-500">
                        Scene phase: <strong className="text-zinc-400 font-normal">{item.phase}</strong> (Panel {item.panelId})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-2">
            <button
              onClick={() => setIsSynthEnabled(!isSynthEnabled)}
              className="text-[9px] uppercase px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 hover:text-[#ff007f] border border-white/5 text-zinc-400 rounded transition cursor-pointer font-bold"
            >
              Drone: {isSynthEnabled ? "ACTIVE" : "MUTED"}
            </button>
            <span className="text-[9.5px] uppercase tracking-tight text-right text-zinc-550 mr-1 select-none font-bold">
              ⚡ STUDIO DESK PANEL v2.1
            </span>
          </div>
        </div>

      </div>

      {/* RECORDING ERROR HELPER ALERTS */}
      {recordingError && (
        <div className="bg-red-950/60 border border-red-500/40 rounded-sm p-4 text-xs font-mono text-red-200 space-y-1.5 select-none animate-pulse">
          <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider">
            <span>⚠️ Capture Session Diagnostic:</span>
          </div>
          <p className="leading-relaxed text-zinc-300">
            "{recordingError}"
          </p>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Troubleshooting tip: Make sure you give screen or window capture permissions when prompted by your browser, and confirm your browser supports the GetDisplayMedia screen sharing standard. Sequential codec configurations have been selected for safe compatibility.
          </p>
        </div>
      )}

      {/* STORYBOARD SEQUENCE LIST GRID */}
      <div className="border border-white/5 rounded p-4 bg-zinc-950/40 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 select-none">
          <div className="space-y-0.5">
            <h3 className="text-xs font-mono font-bold text-[#ff007f] uppercase tracking-wider flex items-center gap-2">
              <span>EXPLORATIVE TIMELINE TIMINGS DECK (36 PANELS)</span>
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Adjust timing offsets. Click any matrix panel to position and command-scrub active playhead values directly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff007f] animate-ping" />
            <span className="text-[9.5px] font-mono text-zinc-400 font-bold bg-zinc-900 border border-white/5 px-2.5 py-0.5 uppercase rounded-sm">
              Timeline: {secondsToTime(totalDuration)} Mins
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {rows.map((rowNum) => {
            const rowPanels = STORYBOARD_DATA.filter(panel => panel.row === rowNum);
            let rowLabel = "Project Stage Sequence Module";
            if (rowNum === 1) rowLabel = "Row 1: The Hook, Visual Opener & Conceptual Brief";
            else if (rowNum === 2) rowLabel = "Row 2: Simpson's Paradox statistical curve & Rigorous Foundations";
            else if (rowNum === 3) rowLabel = "Row 3: Practical Benchmark executions and Cross-Engine Comparisons";
            else if (rowNum === 4) rowLabel = "Row 4: Descriptive subgroup analysis & pooled citation weights";
            else if (rowNum === 5) rowLabel = "Row 5: Error Correction adjustments (Holm Scale & Alpha protections)";
            else if (rowNum === 6) rowLabel = "Row 6: Thread analysis warnings, takeaways, outro subscribe credits";

            return (
              <div key={rowNum} className="space-y-2">
                <h4 className="text-[10.5px] font-mono text-zinc-400 font-extrabold tracking-wider uppercase border-l-2 border-[#ff007f] pl-2 select-none">
                  {rowLabel}
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {rowPanels.map((panel) => {
                    const isSelected = selectedPanelId === panel.panelId;
                    const timings = getPanelTimings(panel);
                    
                    return (
                      <div
                        key={panel.panelId}
                        id={`storyboard-panel-${panel.panelId}`}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('.interactive-card-control')) {
                            return;
                          }
                          seekToSec(timings.start);
                        }}
                        className={`text-left rounded p-3 transition flex flex-col justify-between min-h-[175px] font-mono text-[10px] cursor-pointer outline-none relative overflow-hidden group/item ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#ff007f]/10 to-transparent border border-[#ff007f] shadow-[0_0_12px_rgba(255,0,127,0.25)] scale-[1.01]'
                            : 'bg-zinc-950/70 border border-white/5 hover:border-[#ff007f]/50 hover:bg-[#111]'
                        }`}
                      >
                        {/* Hover visual panel border glow */}
                        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-[#ff007f] opacity-0 group-hover/item:opacity-40 transition-opacity" />

                        {/* Top: panel id + editable start/end times */}
                        <div className="w-full border-b border-white/5 pb-1.5 select-none font-mono">
                          <div className="flex items-center justify-between">
                            <span className={`text-[8.5px] font-black ${isSelected ? 'text-[#ff007f]' : 'text-zinc-500'}`}>
                              PANEL ID #{panel.panelId}
                            </span>
                            <span className="text-[7.5px] text-zinc-600">{(timings.end - timings.start).toFixed(1)}s</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 interactive-card-control">
                            <div className="flex items-center gap-0.5 flex-1">
                              <span className="text-[7px] uppercase text-zinc-500 font-bold">S</span>
                              <input
                                key={`cstart-${panel.panelId}-${manualPanelStarts[panel.panelId] ?? 'a'}`}
                                type="text"
                                inputMode="decimal"
                                defaultValue={timings.start.toFixed(1)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseTimeInput((e.target as HTMLInputElement).value); if (v !== null) setPanelStart(panel.panelId, v); (e.target as HTMLInputElement).blur(); } }}
                                onBlur={(e) => { const v = parseTimeInput(e.target.value); if (v !== null) setPanelStart(panel.panelId, v); }}
                                className={`w-full min-w-0 text-center bg-zinc-950 border rounded py-1 text-[10px] font-mono outline-none focus:border-[#ff007f]/60 ${manualPanelStarts[panel.panelId] !== undefined ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-zinc-200'}`}
                                title="Start (seconds or m:ss) — Enter to set"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setPanelStartToPlayhead(panel); }}
                                className="shrink-0 text-[8px] px-1 py-1 rounded bg-[#ff007f]/15 border border-[#ff007f]/30 text-[#ff007f] hover:bg-[#ff007f] hover:text-zinc-950 transition leading-none"
                                title="Set start to current playhead"
                              >⏺</button>
                            </div>
                            <div className="flex items-center gap-0.5 flex-1">
                              <span className="text-[7px] uppercase text-zinc-500 font-bold">E</span>
                              <input
                                key={`cend-${panel.panelId}-${panelEndKey(panel.panelId)}`}
                                type="text"
                                inputMode="decimal"
                                defaultValue={timings.end.toFixed(1)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseTimeInput((e.target as HTMLInputElement).value); if (v !== null) setPanelEnd(panel.panelId, v); (e.target as HTMLInputElement).blur(); } }}
                                onBlur={(e) => { const v = parseTimeInput(e.target.value); if (v !== null) setPanelEnd(panel.panelId, v); }}
                                className={`w-full min-w-0 text-center bg-zinc-950 border rounded py-1 text-[10px] font-mono outline-none focus:border-[#ff007f]/60 ${isPanelEndEdited(panel.panelId) ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-zinc-200'}`}
                                title="End (seconds or m:ss) — Enter to set"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); setPanelEndToPlayhead(panel); }}
                                className="shrink-0 text-[8px] px-1 py-1 rounded bg-[#ff007f]/15 border border-[#ff007f]/30 text-[#ff007f] hover:bg-[#ff007f] hover:text-zinc-950 transition leading-none"
                                title="Set end to current playhead"
                              >⏺</button>
                            </div>
                          </div>
                        </div>

                        {/* Details Block */}
                        <div className="my-2.5 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[7px] font-sans uppercase tracking-widest text-[#ff007f] block font-black mb-0.5 select-none opacity-80">
                              VISUAL DIRECTION
                            </span>
                            <p className="text-[8.5px] leading-relaxed text-zinc-300 font-sans line-clamp-3 select-all">
                              {panel.visual}
                            </p>
                          </div>

                          <div>
                            <span className="text-[7.5px] font-sans uppercase tracking-widest text-emerald-400 block font-black mb-0.5 select-none opacity-85">
                              VOICE SCRIPT TEXT
                            </span>
                            <p className="text-[8.5px] leading-relaxed text-zinc-400 font-sans italic line-clamp-3 select-all">
                              "{panel.audio}"
                            </p>
                          </div>
                        </div>

                        {/* Dynamic Interactive Slide Offset Slider */}
                        <div className="mt-1 pt-2 border-t border-white/5 interactive-card-control space-y-2 text-zinc-400 font-mono">
                          <div className="flex items-center justify-between text-[7.5px] uppercase tracking-wider font-extrabold select-none">
                            <span>⏱ Transition shift:</span>
                            <span className={(panelOffsets[panel.panelId] ?? 0) !== 0 ? "text-[#ff007f] font-bold" : "text-zinc-500"}>
                              {(panelOffsets[panel.panelId] ?? 0) > 0 ? `+${panelOffsets[panel.panelId]}` : (panelOffsets[panel.panelId] ?? 0)}s
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="range"
                              min="-15"
                              max="15"
                              step="0.5"
                              value={panelOffsets[panel.panelId] ?? 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setPanelOffsets(prev => ({
                                  ...prev,
                                  [panel.panelId]: val
                                }));
                              }}
                              className="flex-1 h-1 bg-zinc-850 accent-[#ff007f] cursor-ew-resize rounded outline-none"
                            />
                            {(panelOffsets[panel.panelId] ?? 0) !== 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPanelOffsets(prev => {
                                    const next = { ...prev };
                                    delete next[panel.panelId];
                                    return next;
                                  });
                                  synth.playBeep(330, 0.05);
                                }}
                                className="text-[7px] text-[#ff007f] hover:text-white px-1 leading-none rounded bg-zinc-900 border border-[#ff007f]/20 hover:border-[#ff007f]"
                                title="Reset this slide back to default alignment"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Auto B-Roll Cut toggle */}
                          <div className="pt-1.5 border-t border-white/3 flex items-center justify-between">
                            <span className="text-[7.5px] uppercase tracking-wider font-extrabold select-none">🎥 Auto B-Roll Cut:</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAutoBrollPanels(prev => {
                                  const updated = { ...prev };
                                  if (updated[panel.panelId]) {
                                    delete updated[panel.panelId];
                                  } else {
                                    updated[panel.panelId] = true;
                                  }
                                  return updated;
                                });
                                synth.playBeep(480, 0.06);
                              }}
                              className={`text-[7.5px] px-1.5 py-0.5 rounded leading-none border transition-all font-black select-none ${
                                autoBrollPanels[panel.panelId]
                                  ? 'bg-[#ff007f]/10 border-[#ff007f]/40 text-[#ff007f] shadow-[0_0_6px_rgba(255,0,127,0.1)] font-bold font-mono'
                                  : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                              }`}
                              title={autoBrollPanels[panel.panelId] ? "Autopilot will cut to B-roll for this panel" : "Autopilot will stay focused on slide content for this panel"}
                            >
                              {autoBrollPanels[panel.panelId] ? 'ACTIVE 🎥' : 'DISABLED'}
                            </button>
                          </div>

                          {/* Custom local B-Roll uploader */}
                          <div className="pt-1.5 border-t border-white/3 flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[7.5px] uppercase tracking-wider font-extrabold select-none">📁 Custom B-Roll:</span>
                              {customBrollUrls[panel.panelId] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomBrollUrls(prev => {
                                      const updated = { ...prev };
                                      delete updated[panel.panelId];
                                      return updated;
                                    });
                                    synth.playBeep(330, 0.05);
                                    deleteBrollFile(panel.panelId).catch(() => {});
                                  }}
                                  className="text-[6.5px] text-[#ff007f] hover:text-white px-1 leading-none rounded bg-zinc-950 border border-[#ff007f]/20 font-bold"
                                  title="Clear custom B-Roll media"
                                >
                                  RESET
                                </button>
                              )}
                            </div>
                            <label
                              htmlFor={`broll-file-input-${panel.panelId}`}
                              className={`flex items-center justify-center gap-1 py-1 px-1.5 border rounded cursor-pointer transition select-none text-[7px] font-black leading-none ${
                                customBrollUrls[panel.panelId]
                                  ? 'bg-[#ff007f]/10 border-[#ff007f]/50 text-[#ff007f]'
                                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-200'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[120px]">
                                {customBrollUrls[panel.panelId] 
                                  ? (customBrollUrls[panel.panelId].isVideo ? "VIDEO LOADED ✓" : "IMAGE LOADED ✓")
                                  : "UP VIDEO / IMAGE"
                                }
                              </span>
                              <input
                                id={`broll-file-input-${panel.panelId}`}
                                type="file"
                                accept="video/*,image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const isVideo = file.type.startsWith('video/');
                                    const url = URL.createObjectURL(file);
                                    setCustomBrollUrls(prev => ({
                                      ...prev,
                                      [panel.panelId]: { url, isVideo }
                                    }));
                                    synth.playBeep(520, 0.08);
                                    saveBrollFile(panel.panelId, file, isVideo, file.name).catch(err => {
                                      console.warn("Failed to persist B-roll to IndexedDB:", err);
                                    });
                                  }
                                }}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Panel Category tag */}
                        <div className="mt-2.5 flex items-center justify-between w-full pt-1.5 border-t border-zinc-900 select-none font-mono">
                          <span className="text-[7.5px] bg-black/50 border border-white/5 px-1 rounded text-zinc-400 capitalize">
                            {panel.phase}
                          </span>
                          {isSelected && <span className="text-[#ff007f] text-[8.5px] font-black tracking-widest animate-pulse">PLAY &bull;</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
