export interface SimulationConfig {
  density: number;
  alphaAttraction: number; // Force of Alpha -> Beta
  betaAttraction: number;  // Force of Beta -> Yellow/Gamma
  gammaAttraction: number; // Force of Gamma -> Alpha (NEW)
  volume: number;
  soundEnabled: boolean;
  isPlaying: boolean;
  showTrails: boolean;     // NEW: particle trail effect
  trailLength: number;     // NEW: how long trails persist
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  type: 'alpha' | 'beta' | 'gamma';
  life: number;
}

// NEW: Preset configurations
export interface Preset {
  name: string;
  icon: string;
  config: Partial<SimulationConfig>;
}

// Wind strength history for real-time chart
export interface WindSnapshot {
  time: number;
  strength: number;
}