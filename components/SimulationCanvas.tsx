import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationConfig, Particle } from '../types';

interface SimulationCanvasProps {
  config: SimulationConfig;
  onStatsUpdate: (stats: { alpha: number; beta: number; gamma: number; fps: number }) => void;
  shuffleTrigger: number;
  stepTrigger: number;
}

// --- Audio System ---
class SoundSystem {
  ctx: AudioContext;
  masterGain: GainNode;
  reverb: ConvolverNode;
  isInitialized: boolean = false;
  droneOsc: OscillatorNode | null = null;
  droneGain: GainNode | null = null;

  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    // Create algorithmic reverb
    this.reverb = this.ctx.createConvolver();
    this.generateReverbImpulse();

    // Routing: Source -> Master -> Reverb -> Destination
    //                   |-> Destination (Dry)
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.reverb);
    this.reverb.connect(this.ctx.destination);
  }

  generateReverbImpulse() {
    const rate = this.ctx.sampleRate;
    const length = rate * 3; // 3 seconds tail
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      // Exponential decay
      const n = length - i;
      const decay = Math.pow(n / length, 3);
      left[i] = (Math.random() * 2 - 1) * decay * 0.5;
      right[i] = (Math.random() * 2 - 1) * decay * 0.5;
    }
    this.reverb.buffer = impulse;
  }

  setVolume(vol: number, enabled: boolean) {
    // Boosted volume scalar (0.3 -> 0.8) to make it more audible
    const target = enabled ? (vol / 100) * 0.8 : 0;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log("Audio Context Resumed");
      }).catch(e => console.error(e));
    }
    if (!this.droneOsc) {
      this.startDrone();
    }
  }

  startDrone() {
    // Deep background drone
    this.droneOsc = this.ctx.createOscillator();
    this.droneGain = this.ctx.createGain();

    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.value = 55; // Low A

    // Boosted drone gain
    this.droneGain.gain.value = 0.15;

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();
  }

  playTone(note: number, type: 'sine' | 'triangle' = 'sine', velocity: number = 1) {
    if (this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();

    osc.type = type;
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);

    // Random pan for spatial width
    pan.pan.value = Math.random() * 2 - 1;

    // Envelope
    const now = this.ctx.currentTime;
    const duration = 0.5 + Math.random() * 0.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2 * velocity, now + 0.05); // Boosted attack level
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playCollisionSound() {
    if (this.ctx.state === 'suspended') return;

    // Short, percussive "glass" sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch range
    const baseFreq = 600 + Math.random() * 600;
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.type = 'sine';

    const now = this.ctx.currentTime;

    // Envelope - slightly longer and louder
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02); // Louder click
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // Slightly longer tail

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// Pentatonic Scale (C Minor)
const SCALE = [
  261.63, // C4
  311.13, // Eb4
  349.23, // F4
  392.00, // G4
  466.16, // Bb4
  523.25, // C5
  622.25, // Eb5
  783.99  // G5
];

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ config, onStatsUpdate, shuffleTrigger, stepTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const fpsRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });

  // Audio Refs
  const soundSystemRef = useRef<SoundSystem | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const lastCollisionSoundTimeRef = useRef<number>(0);

  // Store config ref for animation loop
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Initialize Audio Logic
  useEffect(() => {
    soundSystemRef.current = new SoundSystem();

    // Global resume handler - ensures audio starts on ANY interaction, not just canvas
    const handleInteraction = () => {
      soundSystemRef.current?.resume();
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      soundSystemRef.current?.ctx.close();
    };
  }, []);

  // Sync Volume
  useEffect(() => {
    soundSystemRef.current?.setVolume(config.volume, config.soundEnabled);
  }, [config.volume, config.soundEnabled]);

  // Initialize or Shuffle Particles
  const initParticles = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    const newParticles: Particle[] = [];
    const count = Math.floor(configRef.current.density);

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      const type = rand > 0.66 ? 'alpha' : rand > 0.33 ? 'beta' : 'gamma';
      let color = '#f472b6'; // Alpha Pink
      if (type === 'beta') color = '#22d3ee'; // Beta Cyan
      if (type === 'gamma') color = '#facc15'; // Gamma Yellow

      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 0.5,
        color,
        type,
        life: Math.random(),
      });
    }
    particlesRef.current = newParticles;
  }, []);

  // Initial particle setup
  useEffect(() => {
    initParticles();
  }, [config.density, initParticles]);

  // Shuffle trigger
  useEffect(() => {
    if (shuffleTrigger > 0) {
      initParticles();
    }
  }, [shuffleTrigger, initParticles]);

  // Run single physics step
  const runPhysicsStep = useCallback((time: number, width: number, height: number) => {
    const cfg = configRef.current;
    const center = { x: width / 2, y: height / 2 };

    // --- Spatial Partitioning for Collision Detection ---
    const cellSize = 30;
    const grid: Record<string, number[]> = {};

    // 1. Update Positions & Build Grid
    particlesRef.current.forEach((p, i) => {
      // Movement
      p.x += p.vx;
      p.y += p.vy;

      // Mouse Interaction
      if (isMouseDownRef.current) {
        const dx = p.x - mousePosRef.current.x;
        const dy = p.y - mousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0 && dist < 200) {
          const force = (200 - dist) / 200;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;

          // Audio Trigger on rapid movement near mouse
          if (Math.random() > 0.98 && time - lastSoundTimeRef.current > 100) {
            const note = SCALE[Math.floor(Math.random() * SCALE.length)];
            soundSystemRef.current?.playTone(note, 'sine', 0.8);
            lastSoundTimeRef.current = time;
          }
        }
      }

      // Global Flow / Gravity
      const dxC = center.x - p.x;
      const dyC = center.y - p.y;
      const distC = Math.sqrt(dxC * dxC + dyC * dyC);
      if (distC > 0) {
        p.vx += (dxC / distC) * 0.01;
        p.vy += (dyC / distC) * 0.01;
      }

      // Type Interaction with all three particle types
      if (p.type === 'alpha') {
        p.vx += Math.sin(p.y * 0.01) * (cfg.alphaAttraction * 0.05);
        p.vy += Math.cos(p.x * 0.01) * (cfg.alphaAttraction * 0.03);
      } else if (p.type === 'beta') {
        p.vx -= Math.cos(p.x * 0.01) * (cfg.betaAttraction * 0.05);
        p.vy += Math.sin(p.y * 0.01) * (cfg.betaAttraction * 0.03);
      } else if (p.type === 'gamma') {
        p.vx += Math.cos(p.y * 0.015) * (cfg.gammaAttraction * 0.05);
        p.vy -= Math.sin(p.x * 0.015) * (cfg.gammaAttraction * 0.03);
      }

      // Damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Boundary Wrap
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Add to Grid
      const col = Math.floor(p.x / cellSize);
      const row = Math.floor(p.y / cellSize);
      const key = `${col},${row}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(i);
    });

    // 2. Collision Detection
    particlesRef.current.forEach((p, i) => {
      const col = Math.floor(p.x / cellSize);
      const row = Math.floor(p.y / cellSize);

      // Check 3x3 grid neighborhood
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${col + dx},${row + dy}`;
          const neighbors = grid[key];
          if (neighbors) {
            for (const ni of neighbors) {
              if (i >= ni) continue;

              const p2 = particlesRef.current[ni];
              const distX = p.x - p2.x;
              const distY = p.y - p2.y;
              const distSq = distX * distX + distY * distY;
              const minDist = p.radius + p2.radius;

              if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq) || 0.1;
                const overlap = (minDist - dist) / 2;
                const nx = distX / dist;
                const ny = distY / dist;

                p.x += nx * overlap;
                p.y += ny * overlap;
                p2.x -= nx * overlap;
                p2.y -= ny * overlap;

                if (time - lastCollisionSoundTimeRef.current > 40 && Math.random() < 0.3) {
                  soundSystemRef.current?.playCollisionSound();
                  lastCollisionSoundTimeRef.current = time;
                }
              }
            }
          }
        }
      }
    });
  }, []);

  // Step forward trigger (when paused)
  useEffect(() => {
    if (stepTrigger > 0 && !configRef.current.isPlaying && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      runPhysicsStep(performance.now(), width, height);
    }
  }, [stepTrigger, runPhysicsStep]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (time: number) => {
      if (!containerRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const cfg = configRef.current;

      // Handle Resizing
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // FPS Calculation
      fpsRef.current.frames++;
      if (time - fpsRef.current.lastTime >= 1000) {
        const alphaCount = particlesRef.current.filter(p => p.type === 'alpha').length;
        const betaCount = particlesRef.current.filter(p => p.type === 'beta').length;
        const gammaCount = particlesRef.current.filter(p => p.type === 'gamma').length;

        onStatsUpdate({
          fps: fpsRef.current.frames,
          alpha: alphaCount,
          beta: betaCount,
          gamma: gammaCount
        });
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = time;
      }

      // Clear Canvas with trail effect
      if (cfg.showTrails) {
        ctx.fillStyle = `rgba(2, 2, 4, ${cfg.trailLength})`;
      } else {
        ctx.fillStyle = 'rgba(2, 2, 4, 1)';
      }
      ctx.fillRect(0, 0, width, height);

      // Physics step (only if playing)
      if (cfg.isPlaying) {
        runPhysicsStep(time, width, height);
      }

      // Draw particles
      ctx.shadowBlur = 0; // Reset shadow
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        if (p.radius > 1.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.closePath();
      });

      // Random Ambient Sparkles
      if (cfg.isPlaying && Math.random() > 0.99 && time - lastSoundTimeRef.current > 200) {
        const note = SCALE[Math.floor(Math.random() * (SCALE.length / 2))];
        soundSystemRef.current?.playTone(note * 0.5, 'triangle', 0.3);
        lastSoundTimeRef.current = time;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [onStatsUpdate, runPhysicsStep]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = () => {
    isMouseDownRef.current = true;
    soundSystemRef.current?.resume();
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={() => { isMouseDownRef.current = false; }}
      onMouseLeave={() => { isMouseDownRef.current = false; }}
    >
      {/* Background Image Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen scale-110 animate-pulse-slow">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDL29YI2dcvoODThrvs4DSJDz6fTsnan_W2lM0fsdW2PSydTZg_8iXxduawD7UMJLsL5yFSrGeU8tfO-oOgsAq7ll3TMG1hvj_75wSlIazEgqXo3ZDAWbOcfnetgqLLPNelK4XrSCbd647mmDYkPjPRZeLpyYFiWrlQ6AjSMDX_NdsBV2qK_smkkVm_ukegZM5Ugmke7dlDt0NdTsWPvQOdpnn85ASTn__VgWNxU2ZuJdQVX1AV63NlLlPJZM_17lSMDDMg0PgBzik"
          alt="Nebula"
          className="w-full h-full object-cover"
        />
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full mix-blend-screen"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default SimulationCanvas;
