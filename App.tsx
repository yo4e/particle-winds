import React, { useState } from 'react';
import { SimulationConfig } from './types';
import Sidebar from './components/Sidebar';
import SimulationCanvas from './components/SimulationCanvas';

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>({
    density: 4096,
    alphaAttraction: 0.75,
    betaAttraction: -0.42,
    volume: 70,
    soundEnabled: true,
    isPlaying: true,
  });

  const [stats, setStats] = useState({ alpha: 0, beta: 0, fps: 60 });

  return (
    <div className="relative h-screen w-full bg-background-dark text-gray-100 font-sans antialiased overflow-hidden selection:bg-primary selection:text-white flex">
        
      {/* Background Ambience (Deep Glows) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-primary rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-slow"></div>
         <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-accent-cyan rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="flex-1 relative flex flex-col p-6 z-10 h-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-accent-pink flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/10">
              <span className="material-icons-round text-white text-2xl">all_inclusive</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                LUMINOUS LIFE
              </h1>
              <p className="text-xs text-accent-cyan uppercase tracking-[0.2em] font-medium drop-shadow-md">
                Particle Symphony
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 glass-panel rounded-full p-2 pr-6 pl-6 items-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <span className="text-xs text-gray-400 mr-4 border-r border-white/10 pr-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
              FPS: <span className="text-white font-mono">{stats.fps}</span>
            </span>
            <span className="text-xs text-gray-400 mr-4">
              Entities: <span className="text-accent-pink font-mono drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">{config.density.toLocaleString()}</span>
            </span>
            <button className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-500">
                <span className="material-icons-round text-lg">settings</span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors ml-3">
                <span className="material-icons-round text-lg">fullscreen</span>
            </button>
          </div>
        </header>

        {/* Main Canvas Container */}
        <div className="flex-1 rounded-3xl border border-white/10 relative group cursor-crosshair overflow-hidden backdrop-blur-[2px] bg-black/20 shadow-inner min-h-0">
          
          <SimulationCanvas config={config} onStatsUpdate={setStats} />
          
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
            </div>
          </div>
          
           {/* Floating Hint */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
              <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 text-xs text-white/90 shadow-2xl flex items-center gap-2">
                <span className="material-icons-round text-sm text-accent-purple">touch_app</span>
                Click & Drag to attract particles
              </div>
          </div>

        </div>

        {/* Bottom Playback Controls */}
        <div className="mt-6 flex justify-center shrink-0">
          <div className="glass-panel px-8 py-4 rounded-full flex items-center gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 z-50">
            <button 
                onClick={() => setConfig(prev => ({ ...prev, density: 4096 }))}
                className="text-gray-400 hover:text-white hover:scale-110 transition-all active:scale-95" 
                title="Reset Universe"
            >
              <span className="material-icons-round text-xl">restart_alt</span>
            </button>
            <button className="text-gray-400 hover:text-white hover:scale-110 transition-all active:scale-95" title="Randomize Chaos">
              <span className="material-icons-round text-xl">shuffle</span>
            </button>
            <button 
                onClick={() => setConfig(prev => ({...prev, isPlaying: !prev.isPlaying}))}
                className="w-14 h-14 bg-gradient-to-tr from-white to-gray-200 text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.4)] group"
            >
              <span className="material-icons-round text-4xl group-hover:text-primary transition-colors">
                  {config.isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button className="text-gray-400 hover:text-white hover:scale-110 transition-all active:scale-95" title="Step Time">
              <span className="material-icons-round text-xl">skip_next</span>
            </button>
            <button className="text-gray-400 hover:text-red-400 hover:scale-110 transition-all active:scale-95" title="Record Simulation">
              <span className="material-icons-round text-xl">fiber_manual_record</span>
            </button>
          </div>
        </div>
      </div>

      <Sidebar config={config} setConfig={setConfig} />
    </div>
  );
};

export default App;