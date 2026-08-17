# Particle Winds

🎮 **[Live Demo](https://particle-winds.vercel.app/)**

**Particle Winds is a generative art instrument:** touch the field, shape a scene, then switch into a UI-free viewing state and capture or share the resulting world.

It combines an interactive particle simulation with generative audio. Thousands of particles flow, collide, react to touch, and produce a shifting harmonic texture.

See [`DESIGN.md`](./DESIGN.md) for the product direction, world-state/share design, recording format plan, performance baseline plan, and preset intent.

## Features

### Perform
- **Three Particle Types**: Alpha (pink), Beta (cyan), and Gamma (yellow) particles with unique behaviors
- **Physics Interactions**: Adjustable attraction/repulsion forces between particle types
- **Mouse Interaction**: Click & drag to attract particles toward cursor
- **Wind System**: Random wind gusts every 3-8 seconds add organic movement
- **Preset System**: Harmony, Chaos, Vortex, and Calm as quick performance starting points

### View
- **Trail Effect**: Optional glowing trails behind particles
- **Viewing Mode**: Remove application chrome and let the canvas become the presentation surface; press `Escape` to return
- **Fullscreen Mode**: Browser-level immersive presentation
- **Collapsible Sidebar**: Hide adjustment controls without entering Viewing Mode

### Listen
- **Collision Sounds**: Particles play musical tones when colliding (C major chord: C5, E5, G4)
- **LFO Pitch Drift**: Slow pitch variations prevent monotony
- **Smart Throttling**: Sound rate limiting prevents audio overload at high densities
- **Reverb**: Algorithmic reverb using ConvolverNode for atmospheric depth

### Record
- **Video Recording**: 8-second WebM canvas capture with one click
- **Real-time Diagnostics**: FPS, entity count, and wind graph remain available while adjusting

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
- **Viewing Mode** hides all application UI; press `Escape` to exit
- **REC button** records an 8-second WebM video of the canvas

## File Structure

| File | Description |
|------|-------------|
| `App.tsx` | Root component, state management, viewing/recording UI |
| `components/SimulationCanvas.tsx` | Canvas rendering, physics, audio system |
| `components/Sidebar.tsx` | Control panel UI, presets, sliders |
| `types.ts` | TypeScript type definitions |
| `DESIGN.md` | Product axis and implementation direction |

## Acknowledgments
Built with the help of AI ✨

## License
MIT
