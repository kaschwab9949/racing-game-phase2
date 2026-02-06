# Procedural Audio System

This folder contains the procedural audio system for the racing sim. All sounds are generated in real-time using WebAudio, with no external audio files.

## Components
- **AudioEngine.ts**: Core WebAudio context, mixer buses, global settings
- **AudioBus.ts**: Mixer bus for each sound type
- **EngineSound.ts**: Synth engine sound, rpm/throttle driven
- **TireSquealSound.ts**: Noise-based tire squeal, slip-driven
- **WindRoadNoise.ts**: Filtered noise, speed-driven
- **CollisionSound.ts**: Event-driven thump/impact
- **UiBeepSound.ts**: Simple beep for menu actions
- **AudioManager.ts**: Pools and maps car audio generators, handles updates
- **AudioSettingsPanel.tsx**: React UI for audio settings
- **types.ts**: Shared types/interfaces

## Usage
- Integrate `AudioManager` into the game engine loop
- Call `addCar(carId)` for each car
- On each frame, call `updateCar(carId, { rpm, throttle, slip, speed })`
- Call `playCollision(strength)` on collision events
- Call `playUi(type)` for menu actions
- Render `<AudioSettingsPanel />` in your UI

## Performance
- All nodes are pooled/reused; no unbounded node creation
- Settings are controllable via UI and code

## No external audio files required
All sound is generated procedurally for maximum flexibility and performance.
