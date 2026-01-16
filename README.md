# Particle Winds

A mesmerizing interactive particle simulation with generative audio. Watch thousands of particles flow, collide, and respond to your touch.

## Features

### Visual Simulation
- **Three Particle Types**: Alpha (pink), Beta (cyan), and Gamma (yellow) particles with unique behaviors
- **Physics Interactions**: Adjustable attraction/repulsion forces between particle types
- **Mouse Interaction**: Click & drag to attract particles toward cursor
- **Wind System**: Random wind gusts every 3-8 seconds add organic movement
- **Trail Effect**: Optional glowing trails behind particles
- **Preset System**: Quick configurations (Harmony, Chaos, Vortex, Calm)

### Generative Audio
- **Collision Sounds**: Particles play musical tones when colliding (C major chord: C5, E5, G4)
- **LFO Pitch Drift**: Slow pitch variations prevent monotony
- **Smart Throttling**: Sound rate limiting prevents audio overload at high densities
- **Reverb**: Algorithmic reverb using ConvolverNode for atmospheric depth

### Additional Features
- **Video Recording**: 8-second WebM video capture with one click
- **Real-time Wind Graph**: Visualize wind strength over time
- **Fullscreen Mode**: Immersive viewing experience
- **Collapsible Sidebar**: Hide controls for distraction-free viewing

## Tech Stack
- React 19 + TypeScript
- HTML5 Canvas (2D Context)
- Web Audio API
- Tailwind CSS
- Recharts (for graphs)
- Vite

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## How to Use
- **Click & Drag** on canvas to attract particles
- **Presets** quickly change simulation behavior
- **Entity Density** controls particle count (0-5000)
- **Flow Dynamics** controls particle movement patterns
- **Trail Effect** leaves glowing paths behind particles
- **REC button** records 8-second video (WebM)

## File Structure

| File | Description |
|------|-------------|
| `App.tsx` | Root component, state management, recording logic |
| `components/SimulationCanvas.tsx` | Canvas rendering, physics, audio system |
| `components/Sidebar.tsx` | Control panel UI, presets, sliders |
| `types.ts` | TypeScript type definitions |

## License
MIT
