import React from 'react';
import { SimulationConfig, PopulationSnapshot, Preset } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from 'recharts';

interface SidebarProps {
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  populationHistory: PopulationSnapshot[];
  onSave: () => void;
  onReset: () => void;
}

// Preset configurations
const PRESETS: Preset[] = [
  {
    name: 'Harmony',
    icon: 'self_improvement',
    config: { alphaAttraction: 0.5, betaAttraction: 0.5, gammaAttraction: 0.5, density: 500 }
  },
  {
    name: 'Chaos',
    icon: 'whatshot',
    config: { alphaAttraction: -0.8, betaAttraction: 0.9, gammaAttraction: -0.7, density: 800 }
  },
  {
    name: 'Vortex',
    icon: 'cyclone',
    config: { alphaAttraction: 1.0, betaAttraction: -1.0, gammaAttraction: 0.8, density: 600 }
  },
  {
    name: 'Calm',
    icon: 'spa',
    config: { alphaAttraction: 0.2, betaAttraction: 0.2, gammaAttraction: 0.2, density: 300, showTrails: true, trailLength: 0.05 }
  },
];

const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, populationHistory, onSave, onReset }) => {
  const handleChange = (key: keyof SimulationConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: Preset) => {
    setConfig((prev) => ({ ...prev, ...preset.config }));
  };

  // Transform population history for chart
  const chartData = populationHistory.map((snap, i) => ({
    name: i,
    alpha: snap.alpha,
    beta: snap.beta,
    gamma: snap.gamma,
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
          <h3 className="text-sm font-medium text-accent-purple uppercase tracking-wider mb-4 flex items-center gap-2">
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

        {/* Attraction Force */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">Attraction Force</h3>
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
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-purple shadow-inner"></div>
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

        {/* Population Trends Chart (REAL DATA) */}
        <section>
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-icons-round text-sm">trending_up</span> Population Trends
          </h3>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative h-36 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMUMxeiIgZmlsbD0iIzQ0NCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] mix-blend-overlay"></div>
            <div className="w-full h-full relative z-10">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAlpha" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f472b6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBeta" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorGamma" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="alpha" stroke="#f472b6" strokeWidth={2} fillOpacity={1} fill="url(#colorAlpha)" name="Alpha" />
                    <Area type="monotone" dataKey="beta" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorBeta)" name="Beta" />
                    <Area type="monotone" dataKey="gamma" stroke="#facc15" strokeWidth={2} fillOpacity={1} fill="url(#colorGamma)" name="Gamma" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  <span className="material-icons-round text-lg mr-2 animate-pulse">hourglass_empty</span>
                  Collecting data...
                </div>
              )}
            </div>
          </div>
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
      </div>

      {/* Save Button */}
      <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-md">
        <button
          onClick={onSave}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-accent-pink text-white font-bold tracking-wide shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-3 group"
        >
          <span className="material-icons-round text-lg group-hover:rotate-12 transition-transform">save</span>
          SAVE CONFIGURATION
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
