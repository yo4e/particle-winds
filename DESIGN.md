# Particle Winds — Product Design Direction

## Product axis

**Particle Winds is a generative art instrument: touch the field, shape a scene, then switch into a UI-free viewing state and capture or share the resulting world.**

The product should optimize for the feeling of performing and discovering a visual/audio state, not for exposing the maximum number of simulation controls.

## Primary use case

The primary use case is a short creative session:

1. Open Particle Winds and immediately encounter a living audiovisual field.
2. Play it directly with pointer/touch and a small set of meaningful presets.
3. Adjust only the parameters that materially change the character of the piece.
4. Enter Viewing Mode to remove the interface and experience the result as an artwork.
5. Preserve the result as a reproducible world state, image, or short video.

This keeps simulation controls in service of performance and output rather than making the control panel itself the product.

## Current feature map

### Viewing

- Canvas particle field
- Particle trails
- Fullscreen
- Alpha/Beta/Gamma overlays
- Collapsible settings sidebar
- Ambient background glows

### Performing

- Click/drag attraction
- Shuffle/reseed gesture on the Particle Winds mark
- Harmony / Chaos / Vortex / Calm presets
- Wind gusts
- Collision-driven generative audio

### Adjusting

- Particle density
- Alpha, Beta, Gamma attraction parameters
- Trail enable/length
- Sound enable/volume
- Reset to defaults
- Wind strength graph and runtime FPS/entity diagnostics

### Recording

- Fixed 8-second WebM recording
- Canvas `captureStream(30)` capture
- VP9 → VP8 → WebM capability fallback
- 5 Mbps video target

The current recording path captures the canvas only; the surrounding UI is not part of the video.

## Viewing Mode

Before this change, hiding the sidebar still left the header, runtime indicators, recording controls, and particle-count overlays visible. That is useful for adjustment but not a true presentation state.

Viewing Mode should mean **zero application chrome over or around the artwork**. The implementation in this branch therefore:

- hides the header, runtime overlays, interaction hint, and sidebar;
- removes the padded/rounded dashboard framing so the canvas becomes the presentation surface;
- keeps the simulation interactive;
- uses `Escape` as the explicit exit gesture.

Fullscreen and Viewing Mode remain separate concepts: fullscreen changes the browser presentation; Viewing Mode changes the application presentation.

## Reproducible world state

### Scope of a v1 seed

The first seed implementation should reproduce the **initial particle state**, not promise a deterministic recording replay.

A v1 seed should drive particle type, position, velocity, radius, and life during initialization. Wind gust timing/direction, audio micro-variation, elapsed time, frame scheduling, and user input may remain non-deterministic initially.

That distinction matters: a shared seed can reliably recreate the starting composition without implying that two browsers will render the same movie frame-for-frame.

### World state schema

Use one versioned object as the interchange format for both URL sharing and JSON export:

```ts
interface SharedWorldV1 {
  version: 1;
  seed: string;
  config: {
    density: number;
    alphaAttraction: number;
    betaAttraction: number;
    gammaAttraction: number;
    volume: number;
    soundEnabled: boolean;
    showTrails: boolean;
    trailLength: number;
  };
  preset?: 'harmony' | 'chaos' | 'vortex' | 'calm';
}
```

`isPlaying` is runtime state and should not be part of the share contract unless a later playback model requires it.

### URL and JSON strategy

- Canonical in-memory representation: `SharedWorldV1`.
- JSON export/import: serialize that object directly.
- URL sharing: encode the same object as URL-safe Base64 in a single `world` query parameter.
- On load: validate `version`, clamp numeric ranges, reject malformed payloads, and ignore unknown fields.
- Keep the decoder backward-compatible when a future `version: 2` is introduced.

A single schema prevents URL sharing and downloaded JSON from drifting into two competing save formats.

### Persistence gap

`App.tsx` currently contains a localStorage loader and reset path for `luminous-life-config`, but there is no corresponding write path. A later world-state implementation should either make local persistence complete or remove the misleading partial mechanism.

## Recording formats

Recording should be treated as artwork output, not a mirror of the responsive UI viewport.

Recommended first formats:

| Format | Logical frame | Main use |
| --- | --- | --- |
| 16:9 | 1920×1080 | desktop/video |
| 9:16 | 1080×1920 | stories/reels/shorts |
| 1:1 | 1080×1080 | square social post |

Implementation direction:

- separate the simulation's logical recording frame from the visible CSS layout;
- preserve particle geometry without stretching when aspect ratio changes;
- render into a dedicated capture canvas (or deterministic offscreen target) rather than resizing the live UI during recording;
- add still-image export from the same output frame;
- keep browser codec capability checks and make recording cleanup/error paths testable.

## Performance baseline

The application already reports runtime FPS and allows up to 5000 particles, but a source review cannot produce trustworthy performance numbers. Actual values must be measured in a real browser on identified hardware.

Use the following baseline matrix for the dedicated performance issue:

| Density | Audio | Recording | Sample duration |
| --- | --- | --- | --- |
| 1000 | off | off | 30 s |
| 1000 | on | off | 30 s |
| 5000 | off | off | 30 s |
| 5000 | on | off | 30 s |
| 5000 | off | on | 30 s |
| 5000 | on | on | 30 s |

Record browser/version, OS, hardware, viewport, average FPS, lowest observed FPS, long-frame symptoms, audio glitches, and recording success/failure. Do not decide on WebGL migration until this baseline exists.

## Preset intent

The current presets are useful performance starting points. Their next iteration should be authored as coherent audiovisual pieces rather than parameter bundles.

| Preset | Current density | Intended character | Visual reading | Audio reading |
| --- | ---: | --- | --- | --- |
| Harmony | 800 | balanced, meditative orbit | sustained trails and mutual attraction | spacious collision chord, moderate event rate |
| Chaos | 1500 | turbulent, unstable energy | dense motion, no trails, sharp local changes | busiest collision texture; rate limiting is important |
| Vortex | 1000 | rotational tension and flow | short luminous trails, strong opposing forces | active but legible harmonic pulses |
| Calm | 400 | sparse, slow contemplation | low density, long clean negative space | isolated tones with the clearest individual events |

All four currently share the same underlying Alpha/Beta/Gamma pitch system. A later preset pass can decide whether each work deserves its own scale, timbre, color behavior, recommended duration, and output format.

## Deliberate non-goals

- Do not add more sliders before the primary performance flow benefits from them.
- Do not treat WebGL migration as a goal before measurement shows Canvas 2D is the limiting factor.
- Do not promise deterministic movie replay from an initial-state seed.
- Do not add generative-AI features merely because the work is generative.

## Follow-up work

The first independent implementation tasks from Issue #1 are:

1. Seeded initial state + versioned URL/JSON world sharing.
2. Fixed-aspect recording and still-image export.
3. Browser performance baseline at 5000 particles with audio/recording combinations.
4. Preset curation as authored audiovisual works.

Issue #1 should remain open until the performance baseline is recorded and the parent completion conditions have all been verified.
