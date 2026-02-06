export type StorageVersion = 1;

export type TrackId = 'podium_club_ccw';

export type PersonalBest = {
  carId: string;
  trackId: TrackId;
  bestLapTime: number;
  sectors?: { id: string; time: number | null }[];
  timestamp: number;
};

export type LeaderboardEntry = {
  playerName: string;
  carId: string;
  trackId: TrackId;
  lapTime: number;
  valid: boolean;
  timestamp: number;
};

export type AppSettings = {
  lastCarId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type StorageSchemaV1 = {
  version: StorageVersion;
  personalBests: PersonalBest[];
  leaderboards: LeaderboardEntry[];
  settings: AppSettings;
};
