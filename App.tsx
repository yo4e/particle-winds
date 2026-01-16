import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SimulationConfig, WindSnapshot } from './types';
import Sidebar from './components/Sidebar';
import SimulationCanvas from './components/SimulationCanvas';

const STORAGE_KEY = 'luminous-life-config';

// Load config from localStorage
const loadSavedConfig = (): SimulationConfig | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load config:', e);
  }
  return null;
};

const defaultConfig: SimulationConfig = {
  density: 1000,
  alphaAttraction: 0.75,
  betaAttraction: -0.42,
  gammaAttraction: 0.3,
  volume: 10,
  soundEnabled: true,
  isPlaying: true,
  showTrails: true,
  trailLength: 0.15,
};

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(() => {
    const saved = loadSavedConfig();
    return saved ? { ...defaultConfig, ...saved } : defaultConfig;
  });

  const [stats, setStats] = useState({ alpha: 0, beta: 0, gamma: 0, fps: 60, windStrength: 0 });
  const [windHistory, setWindHistory] = useState<WindSnapshot[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update wind history for real-time chart
  const handleStatsUpdate = useCallback((newStats: { alpha: number; beta: number; gamma: number; fps: number; windStrength: number }) => {
    setStats(newStats);
    setWindHistory(prev => {
      const newSnapshot: WindSnapshot = {
        time: Date.now(),
        strength: newStats.windStrength,
      };
      // Keep last 60 data points for smooth chart
      const updated = [...prev, newSnapshot].slice(-60);
      return updated;
    });
  }, []);


  // Reset to defaults
  const handleResetConfig = useCallback(() => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Shuffle particles (randomize)
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const handleShuffle = useCallback(() => {
    setShuffleTrigger(prev => prev + 1);
  }, []);

  // Step forward one frame (for future use)
  const [stepTrigger] = useState(0);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error('Failed to enter fullscreen:', e);
      });
    } else {
      document.exitFullscreen().catch((e) => {
        console.error('Failed to exit fullscreen:', e);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Toggle sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Hide hint after first interaction
  const [hasInteracted, setHasInteracted] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);

  const RECORDING_DURATION = 8; // 8 seconds

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTimeLeft(RECORDING_DURATION);

    // Countdown timer
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTimeLeft(prev => {
        if (prev <= 1) {
          // Stop recording when timer reaches 0
          setIsRecording(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTimeLeft(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particle-winds-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);


  return (
    <div className="relative h-screen w-full bg-background-dark text-gray-100 font-sans antialiased overflow-hidden selection:bg-primary selection:text-white flex">

      {/* Background Ambience (Deep Glows) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-accent-cyan rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[600px] h-[600px] bg-accent-yellow rounded-full mix-blend-screen filter blur-[200px] opacity-5 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>


      <div className="flex-1 relative flex flex-col p-6 z-10 h-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-primary flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] border border-white/10 hover:scale-110 transition-transform cursor-pointer" onClick={handleShuffle}>
              <span className="material-icons-round text-white text-2xl">air</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                PARTICLE WINDS
              </h1>
              <p className="text-xs text-accent-cyan uppercase tracking-[0.2em] font-medium drop-shadow-md">
                Harmonic Particle Flow
              </p>
            </div>
          </div>

          <div className="flex gap-2 glass-panel rounded-full p-2 pr-6 pl-6 items-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <span className="text-xs text-gray-400 mr-4 border-r border-white/10 pr-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stats.fps >= 50 ? 'bg-accent-green' : stats.fps >= 30 ? 'bg-accent-yellow' : 'bg-red-400'} animate-pulse`}></span>
              FPS: <span className="text-white font-mono">{stats.fps}</span>
            </span>
            <span className="text-xs text-gray-400 mr-4 border-r border-white/10 pr-4">
              Entities: <span className="text-accent-pink font-mono drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">{config.density.toLocaleString()}</span>
            </span>
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all mr-2 ${isRecording
                ? 'bg-red-500/90 text-white animate-pulse'
                : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
                }`}
              title={isRecording ? 'Stop Recording' : 'Record 8s Video'}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></span>
              <span className="text-xs font-medium">
                {isRecording ? `${recordingTimeLeft}s` : 'REC'}
              </span>
            </button>
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-500"
              title="Toggle Settings Panel"
            >
              <span className="material-icons-round text-lg">settings</span>
            </button>
            <button
              onClick={handleToggleFullscreen}
              className="text-gray-400 hover:text-white transition-colors ml-3"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <span className="material-icons-round text-lg">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
            </button>
          </div>
        </header>

        {/* Main Canvas Container */}
        <div
          className="flex-1 rounded-3xl border border-white/10 relative group cursor-crosshair overflow-hidden backdrop-blur-[2px] bg-black/20 shadow-inner min-h-0"
          onClick={() => setHasInteracted(true)}
        >

          <SimulationCanvas
            config={config}
            onStatsUpdate={handleStatsUpdate}
            shuffleTrigger={shuffleTrigger}
            stepTrigger={stepTrigger}
            isRecording={isRecording}
            onRecordingComplete={handleRecordingComplete}
          />

          {/* Overlay Stats */}
          <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <div className="flex flex-col gap-3">
              <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 w-fit shadow-lg animate-float">
                <div className="w-2 h-2 rounded-full bg-accent-pink shadow-[0_0_12px_#ec4899]"></div>
                <span className="text-xs font-mono text-gray-200">Alpha Swarm: {stats.alpha.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 w-fit shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-2 h-2 rounded-full bg-accent-cyan shadow-[0_0_12px_#06b6d4]"></div>
                <span className="text-xs font-mono text-gray-200">Beta Cluster: {stats.beta.toLocaleString()}</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 w-fit shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-2 h-2 rounded-full bg-accent-yellow shadow-[0_0_12px_#eab308]"></div>
                <span className="text-xs font-mono text-gray-200">Gamma Nebula: {stats.gamma.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Floating Hint - hidden after first interaction */}
          {!hasInteracted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
              <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 text-xs text-white/90 shadow-2xl flex items-center gap-2">
                <span className="material-icons-round text-sm text-primary">touch_app</span>
                Click & Drag to attract particles
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar with slide animation */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarVisible ? 'w-[420px]' : 'w-0'} overflow-hidden shrink-0`}>
        <Sidebar
          config={config}
          setConfig={setConfig}
          windHistory={windHistory}
          onReset={handleResetConfig}
          onShuffle={handleShuffle}
        />
      </div>
    </div>
  );
};

export default App;
