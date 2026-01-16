import React, { useRef, useEffect, useCallback } from 'react';
import { SimulationConfig, Particle } from '../types';

interface SimulationCanvasProps {
  config: SimulationConfig;
  onStatsUpdate: (stats: { alpha: number; beta: number; gamma: number; fps: number; windStrength: number }) => void;
  shuffleTrigger: number;
  stepTrigger: number;
  isRecording: boolean;
  onRecordingComplete: (blob: Blob) => void;
}

// --- Audio System ---
class SoundSystem {
  ctx: AudioContext;
  masterGain: GainNode;
  reverb: ConvolverNode;
  isInitialized: boolean = false;

  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;

    // Create algorithmic reverb
    this.reverb = this.ctx.createConvolver();
    this.generateReverbImpulse();

    // Routing
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.connect(this.reverb);
    this.reverb.connect(this.ctx.destination);
  }

  generateReverbImpulse() {
    const rate = this.ctx.sampleRate;
    const length = rate * 3;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = length - i;
      const decay = Math.pow(n / length, 3);
      left[i] = (Math.random() * 2 - 1) * decay * 0.5;
      right[i] = (Math.random() * 2 - 1) * decay * 0.5;
    }
    this.reverb.buffer = impulse;
  }

  setVolume(vol: number, enabled: boolean) {
    const target = enabled ? (vol / 100) * 0.8 : 0;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.2);
  }

  resume() {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        console.log("Audio Context Resumed");
      }).catch(e => console.error(e));
    }
  }

  playTone(note: number, type: 'sine' | 'triangle' = 'sine', velocity: number = 1) {
    if (this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner();

    osc.type = type;
    osc.frequency.setValueAtTime(note, this.ctx.currentTime);
    pan.pan.value = Math.random() * 2 - 1;

    const now = this.ctx.currentTime;
    const duration = 0.5 + Math.random() * 0.5;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2 * velocity, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(pan);
    pan.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Each particle type has its own note - collisions create chords!
  // Alpha = C5 (523Hz), Beta = E5 (659Hz), Gamma = G4 (392Hz)
  // Together they form a C major chord
  private typeFrequencies: Record<string, number> = {
    alpha: 523.25,  // C5 - bright, high
    beta: 659.25,   // E5 - mid, warm
    gamma: 392.00,  // G4 - low, grounding
  };

  // Type-specific cooldowns to prevent same note spam
  private typeCooldowns: Record<string, number> = {
    alpha: 0,
    beta: 0,
    gamma: 0,
  };
  private readonly TYPE_COOLDOWN_MS = 150; // Minimum ms between same type sounds

  // LFO for slowly shifting base pitch (prevents monotony over time)
  private lfoPhase = 0;
  private readonly LFO_PERIOD = 15000; // 15 seconds full cycle
  private readonly LFO_DEPTH = 0.05;   // ±5% pitch variation

  // Get current LFO multiplier for pitch
  private getLfoMultiplier(): number {
    const now = performance.now();
    this.lfoPhase = (now % this.LFO_PERIOD) / this.LFO_PERIOD;
    // Smooth sine wave: 0.95 to 1.05 range
    return 1 + Math.sin(this.lfoPhase * Math.PI * 2) * this.LFO_DEPTH;
  }

  // Check if this type can play (cooldown check)
  private canPlayType(type: string): boolean {
    const now = performance.now();
    if (now - this.typeCooldowns[type] < this.TYPE_COOLDOWN_MS) {
      return false;
    }
    this.typeCooldowns[type] = now;
    return true;
  }

  // Global sound rate limiting - max N sounds per time window
  private soundTimestamps: number[] = [];
  private readonly MAX_SOUNDS_PER_WINDOW = 5;  // Max 5 sounds
  private readonly SOUND_WINDOW_MS = 100;       // per 100ms

  private canPlayGlobal(): boolean {
    const now = performance.now();
    // Remove old timestamps outside the window
    this.soundTimestamps = this.soundTimestamps.filter(t => now - t < this.SOUND_WINDOW_MS);

    if (this.soundTimestamps.length >= this.MAX_SOUNDS_PER_WINDOW) {
      return false; // Rate limit exceeded
    }
    this.soundTimestamps.push(now);
    return true;
  }

  // Play a single note for one particle type
  private playNote(type: 'alpha' | 'beta' | 'gamma') {
    // Check type-specific cooldown AND global rate limit
    if (!this.canPlayType(type)) return;
    if (!this.canPlayGlobal()) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = this.typeFrequencies[type] || 440;
    // Apply LFO for slow pitch drift + random micro-variation
    const lfoMult = this.getLfoMultiplier();
    const randomVariation = 1 + (Math.random() - 0.5) * 0.02; // ±1% random
    const freq = baseFreq * lfoMult * randomVariation;

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.type = 'sine';

    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // When two particles collide, both play their notes → chord!
  playCollisionSound(type1?: 'alpha' | 'beta' | 'gamma', type2?: 'alpha' | 'beta' | 'gamma') {
    if (this.ctx.state === 'suspended') return;

    // Each particle plays its own note (with cooldown check inside playNote)
    if (type1) this.playNote(type1);
    if (type2 && type2 !== type1) this.playNote(type2);
    // If same type collision, playNote already handles it
  }
}

// Pentatonic Scale (C Minor)
const SCALE = [
  261.63, 311.13, 349.23, 392.00,
  466.16, 523.25, 622.25, 783.99
];

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ config, onStatsUpdate, shuffleTrigger, stepTrigger, isRecording, onRecordingComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const fpsRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });
  const fpsValueRef = useRef<number>(60);
  const statsUpdateTimeRef = useRef<number>(0);

  // Audio Refs
  const soundSystemRef = useRef<SoundSystem | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const lastCollisionSoundTimeRef = useRef<number>(0);

  // Wind Gust System - keeps things dynamic!
  const nextGustTimeRef = useRef<number>(0);
  const currentWindRef = useRef({ vx: 0, vy: 0, strength: 0, decay: 0.95 });

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Store config ref for animation loop
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Recording effect - start/stop based on isRecording prop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isRecording && !mediaRecorderRef.current) {
      // Start recording
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000, // 5 Mbps for good quality
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        onRecordingComplete(blob);
        mediaRecorderRef.current = null;
      };

      recorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = recorder;
    } else if (!isRecording && mediaRecorderRef.current) {
      // Stop recording
      mediaRecorderRef.current.stop();
    }
  }, [isRecording, onRecordingComplete]);



  // Initialize Audio Logic
  useEffect(() => {
    soundSystemRef.current = new SoundSystem();

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
      let color = '#f472b6';
      if (type === 'beta') color = '#22d3ee';
      if (type === 'gamma') color = '#facc15';

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

  // Calculate sound probability based on density (more particles = less sound per collision)
  // New range: 0-1000 particles for better audio clarity
  const getSoundProbability = useCallback(() => {
    const density = configRef.current.density;
    // At 0-100 particles: 80% chance - very clear individual sounds
    // At 100-300 particles: 50% chance - balanced audio
    // At 300-600 particles: 30% chance - moderate density
    // At 600-1000 particles: 15% chance - still audible but controlled
    if (density < 100) return 0.8;
    if (density < 300) return 0.5;
    if (density < 600) return 0.3;
    return 0.15;
  }, []);

  // Run single physics step
  const runPhysicsStep = useCallback((time: number, width: number, height: number) => {
    const cfg = configRef.current;
    const center = { x: width / 2, y: height / 2 };
    const soundProb = getSoundProbability();

    const cellSize = 30;
    const grid: Record<string, number[]> = {};

    // 0. Wind Gust System - Random gusts every 3-8 seconds
    const wind = currentWindRef.current;
    if (time > nextGustTimeRef.current) {
      // Trigger a new gust!
      const angle = Math.random() * Math.PI * 2;
      wind.vx = Math.cos(angle);
      wind.vy = Math.sin(angle);
      wind.strength = 2 + Math.random() * 3; // Random strength 2-5
      wind.decay = 0.92 + Math.random() * 0.05; // Decay rate 0.92-0.97

      // Schedule next gust in 3-8 seconds
      nextGustTimeRef.current = time + 3000 + Math.random() * 5000;
    }

    // Apply wind and decay
    if (wind.strength > 0.1) {
      wind.strength *= wind.decay;
    } else {
      wind.strength = 0;
    }

    // 1. Update Positions & Build Grid
    particlesRef.current.forEach((p, i) => {
      // Apply wind force to this particle
      if (wind.strength > 0.1) {
        p.vx += wind.vx * wind.strength * 0.1;
        p.vy += wind.vy * wind.strength * 0.1;
      }

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

          // Sound with density-based probability
          if (Math.random() < soundProb * 0.3 && time - lastSoundTimeRef.current > 150) {
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

      // Type Interaction (flow patterns based on position)
      if (p.type === 'alpha') {
        p.vx += Math.sin(p.y * 0.01) * (cfg.alphaAttraction * 0.3);
        p.vy += Math.cos(p.x * 0.01) * (cfg.alphaAttraction * 0.2);
      } else if (p.type === 'beta') {
        p.vx -= Math.cos(p.x * 0.01) * (cfg.betaAttraction * 0.3);
        p.vy += Math.sin(p.y * 0.01) * (cfg.betaAttraction * 0.2);
      } else if (p.type === 'gamma') {
        p.vx += Math.cos(p.y * 0.015) * (cfg.gammaAttraction * 0.3);
        p.vy -= Math.sin(p.x * 0.015) * (cfg.gammaAttraction * 0.2);
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

    // 2. Collision Detection with density-based sound throttling
    // Plus: Same-type repulsion & Cross-type attraction
    const minCollisionSoundInterval = cfg.density > 3000 ? 100 : cfg.density > 1000 ? 60 : 40;
    const interactionRadius = 60; // Radius for type-based forces
    const sameTypeRepulsion = 0.15; // Strength of same-type repulsion
    const crossTypeAttraction = 0.08; // Strength of cross-type attraction

    particlesRef.current.forEach((p, i) => {
      const col = Math.floor(p.x / cellSize);
      const row = Math.floor(p.y / cellSize);

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

              // Physical collision
              if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq) || 0.1;
                const overlap = (minDist - dist) / 2;
                const nx = distX / dist;
                const ny = distY / dist;

                p.x += nx * overlap;
                p.y += ny * overlap;
                p2.x -= nx * overlap;
                p2.y -= ny * overlap;

                // Sound with density-based throttling + LOCAL density probability reduction
                // More neighbors in this cell = lower probability of playing sound
                const localDensity = neighbors.length;
                const localDensityPenalty = Math.max(0.1, 1 - (localDensity / 20)); // At 20+ neighbors, only 10% chance
                const adjustedProb = soundProb * localDensityPenalty;

                if (time - lastCollisionSoundTimeRef.current > minCollisionSoundInterval && Math.random() < adjustedProb) {
                  soundSystemRef.current?.playCollisionSound(p.type, p2.type);
                  lastCollisionSoundTimeRef.current = time;
                }
              }

              // Type-based forces (within interaction radius, beyond collision)
              if (distSq < interactionRadius * interactionRadius && distSq > minDist * minDist) {
                const dist = Math.sqrt(distSq);
                const nx = distX / dist;
                const ny = distY / dist;
                const forceFalloff = 1 - (dist / interactionRadius); // Stronger when closer

                if (p.type === p2.type) {
                  // SAME TYPE: Repulsion - push apart
                  const repelForce = sameTypeRepulsion * forceFalloff;
                  p.vx += nx * repelForce;
                  p.vy += ny * repelForce;
                  p2.vx -= nx * repelForce;
                  p2.vy -= ny * repelForce;
                } else {
                  // DIFFERENT TYPE: Attraction - pull together (weaker)
                  const attractForce = crossTypeAttraction * forceFalloff;
                  p.vx -= nx * attractForce;
                  p.vy -= ny * attractForce;
                  p2.vx += nx * attractForce;
                  p2.vy += ny * attractForce;
                }
              }
            }
          }
        }
      }
    });
  }, [getSoundProbability]);

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
      const fpsDelta = time - fpsRef.current.lastTime;
      if (fpsDelta >= 1000) {
        fpsValueRef.current = Math.round((fpsRef.current.frames * 1000) / fpsDelta);
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = time;
      }

      // More frequent stats update for chart (every 500ms) - only when playing
      if (cfg.isPlaying && time - statsUpdateTimeRef.current >= 500) {
        onStatsUpdate({
          fps: fpsValueRef.current,
          alpha: particlesRef.current.filter(p => p.type === 'alpha').length,
          beta: particlesRef.current.filter(p => p.type === 'beta').length,
          gamma: particlesRef.current.filter(p => p.type === 'gamma').length,
          windStrength: currentWindRef.current.strength
        });
        statsUpdateTimeRef.current = time;
      }

      // Clear Canvas - ALWAYS clear shadow first to prevent color bleed
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

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

      // Draw particles - batch by shadow state to minimize context switches
      // First draw small particles (no shadow)
      particlesRef.current.forEach((p) => {
        if (p.radius <= 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      });

      // Then draw large particles with glow
      ctx.shadowBlur = 10;
      particlesRef.current.forEach((p) => {
        if (p.radius > 1.5) {
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      });

      // Reset shadow after drawing
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Random Ambient Sparkles - also density based
      const sparkleProb = cfg.density > 3000 ? 0.995 : cfg.density > 1000 ? 0.99 : 0.98;
      if (cfg.isPlaying && Math.random() > sparkleProb && time - lastSoundTimeRef.current > 300) {
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


      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full mix-blend-screen"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
    </div>
  );
};

export default SimulationCanvas;
