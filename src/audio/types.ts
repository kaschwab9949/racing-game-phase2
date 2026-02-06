// Audio types and interfaces
export type CarAudioChannels = {
  engine: import('./EngineSound').EngineSound;
  tires: import('./TireSquealSound').TireSquealSound;
  wind: import('./WindRoadNoise').WindRoadNoise;
};

export type AudioSettings = {
  master: number;
  engine: number;
  tires: number;
  sfx: number;
  ui: number;
  muted: boolean;
};
