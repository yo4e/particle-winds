export interface SimulationConfig {
  density: number;
  alphaAttraction: number; // Force of Alpha -> Beta
  betaAttraction: number;  // Force of Beta -> Yellow/Gamma
  volume: number;
  soundEnabled: boolean;
  isPlaying: boolean;
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