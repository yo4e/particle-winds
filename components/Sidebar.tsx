import React from 'react';
import { SimulationConfig, WindSnapshot, Preset } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis } from 'recharts';

interface SidebarProps {
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  windHistory: WindSnapshot[];
  onReset: () => void;
  onShuffle: () => void;
}

// Preset configurations
const PRESETS: Preset[] = [
  {
    name: 'Harmony',
    icon: 'self_improvement',
    config: { alphaAttraction: 0.3, betaAttraction: 0.3, gammaAttraction: 0.3, density: 800, showTrails: true, trailLength: 0.15 }
  },
  {
    name: 'Chaos',
    icon: 'whatshot',
    config: { alphaAttraction: -0.9, betaAttraction: 0.9, gammaAttraction: -0.6, density: 1500, showTrails: false, trailLength: 0.2 }
  },
  {
    name: 'Vortex',
    icon: 'cyclone',
    config: { alphaAttraction: 0.8, betaAttraction: -0.8, gammaAttraction: 1.0, density: 1000, showTrails: true, trailLength: 0.08 }
  },
  {
    name: 'Calm',
    icon: 'spa',
    config: { alphaAttraction: 0.1, betaAttraction: 0.1, gammaAttraction: 0.1, density: 400, showTrails: true, trailLength: 0.03 }
  },
];

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, windHistory, onReset, onShuffle }) => {
  const handleChange = (key: keyof SimulationConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: Preset) => {
    setConfig((prev) => ({ ...prev, ...preset.config }));
  };

  // Transform wind history for chart
  const chartData = windHistory.map((snap, i) => ({
    name: i,
    wind: snap.strength,
  }));

  return (
    <aside className="w-[420px] glass-panel border-l border-white/10 flex flex-col h-full overflow-hidden shadow-2xl z-20 shrink-0">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-xl">
        <h2 className="font-display font-semibold text-xl text-white tracking-wide">Control Matrix</h2>
        <p className="text-sm text-gray-400 mt-1">Configure universe parameters</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {/* Presets */}
        <section>
          <h3 className="text-sm font-medium text-accent-blue uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">palette</span> Presets
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-primary/10 transition-all group"
                title={preset.name}
              >
                <span className="material-icons-round text-gray-400 group-hover:text-primary transition-colors">{preset.icon}</span>
                <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">{preset.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Entity Density */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-accent-cyan uppercase tracking-wider flex items-center gap-2">
              <span className="material-icons-round text-sm">groups</span> Entity Density
            </h3>
            <span className="text-xs font-mono text-white bg-white/10 px-2 py-1 rounded">
              {config.density.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wide">
              <span>Sparse</span>
              <span>High Density</span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="10"
              value={config.density}
              onChange={(e) => handleChange('density', Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer group-hover:bg-gray-600 transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
              Adjusting density impacts simulation complexity and visual bloom intensity.
            </p>
          </div>
        </section>

        {/* Flow Dynamics */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">Flow Dynamics</h3>
            <button
              onClick={onReset}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Reset All
            </button>
          </div>
          <div className="space-y-4">
            {/* Alpha -> Beta */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent-pink shadow-[0_0_10px_#ec4899]"></div>
                  <span className="text-[10px] text-gray-400 uppercase">Alpha</span>
                </div>
                <span className={`text-xs font-mono ${config.alphaAttraction > 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {config.alphaAttraction > 0 ? '+' : ''}{config.alphaAttraction.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={config.alphaAttraction}
                onChange={(e) => handleChange('alphaAttraction', Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Beta */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent-cyan shadow-[0_0_10px_#06b6d4]"></div>
                  <span className="text-[10px] text-gray-400 uppercase">Beta</span>
                </div>
                <span className={`text-xs font-mono ${config.betaAttraction > 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {config.betaAttraction > 0 ? '+' : ''}{config.betaAttraction.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={config.betaAttraction}
                onChange={(e) => handleChange('betaAttraction', Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Gamma (NEW) */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent-yellow shadow-[0_0_10px_#eab308]"></div>
                  <span className="text-[10px] text-gray-400 uppercase">Gamma</span>
                </div>
                <span className={`text-xs font-mono ${config.gammaAttraction > 0 ? 'text-accent-green' : 'text-red-400'}`}>
                  {config.gammaAttraction > 0 ? '+' : ''}{config.gammaAttraction.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={config.gammaAttraction}
                onChange={(e) => handleChange('gammaAttraction', Number(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Trail Settings */}
        <section>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">blur_on</span> Trail Effect
          </h3>
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-white font-medium">Particle Trails</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Leave glowing trails behind particles</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.showTrails}
                  onChange={(e) => handleChange('showTrails', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
            </div>
            {config.showTrails && (
              <div>
                <div className="flex justify-between text-[10px] text-gray-500 mb-2 font-mono uppercase tracking-wide">
                  <span>Long</span>
                  <span>Short</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.4"
                  step="0.01"
                  value={config.trailLength}
                  onChange={(e) => handleChange('trailLength', Number(e.target.value))}
                  className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </section>

        {/* Wind Strength Chart */}
        <section>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">air</span> Wind Strength
          </h3>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative h-28 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="w-full h-full relative z-10">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={[0, 5]} />
                    <Area type="monotone" dataKey="wind" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorWind)" name="Wind" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  <span className="material-icons-round text-lg mr-2 animate-pulse">hourglass_empty</span>
                  Waiting for wind...
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">Gusts occur every 3-8 seconds</p>
        </section>

        {/* Celestial Harmonics */}
        <section>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">music_note</span> Celestial Harmonics
          </h3>
          <div className="bg-gradient-to-br from-white/10 to-white/5 p-5 rounded-xl border border-white/10 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

            <div className="flex justify-between items-center mb-5 relative z-10">
              <div>
                <div className="text-sm text-white font-medium">Interaction Tones</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Sound triggers on collision</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
            </div>

            <div className="flex items-center gap-4 relative z-10">
              <span className="material-icons-round text-gray-400 text-sm">volume_mute</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.volume}
                  onChange={(e) => handleChange('volume', Number(e.target.value))}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <span className="material-icons-round text-white text-sm">volume_up</span>
            </div>
          </div>
        </section>

        {/* How to Use */}
        <section className="mt-4 pt-6 border-t border-white/5">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">help_outline</span> How to Use
          </h3>
          <div className="text-[11px] text-gray-500 space-y-2 leading-relaxed">
            <p><span className="text-gray-400">Click & Drag</span> on canvas to attract particles</p>
            <p><span className="text-gray-400">Presets</span> quickly change simulation behavior</p>
            <p><span className="text-gray-400">Entity Density</span> controls particle count</p>
            <p><span className="text-gray-400">Flow Dynamics</span> controls particle movement patterns</p>
            <p><span className="text-gray-400">Trail Effect</span> leaves glowing paths behind particles</p>
            <p><span className="text-gray-400">REC button</span> records 8-second video (WebM)</p>
            <p className="pt-2 text-gray-600 italic">Wind gusts occur randomly every 3-8 seconds</p>
          </div>
        </section>
      </div>

      {/* Playback Controls */}
      <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onReset}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all"
            title="Reset All"
          >
            <span className="material-icons-round">restart_alt</span>
          </button>
          <button
            onClick={onShuffle}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white flex items-center justify-center transition-all"
            title="Shuffle"
          >
            <span className="material-icons-round">shuffle</span>
          </button>
          <button
            onClick={() => setConfig(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-accent-cyan text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(59,130,246,0.5)]"
            title={config.isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-icons-round text-3xl">
              {config.isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
