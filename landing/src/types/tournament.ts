export interface GameInfo {
  gameName: string;
  platform: string;
  platformUrl?: string;
  challengeDescription: string;
}

export interface GameData {
  differsPerRound: boolean;
  game?: GameInfo;
  rounds?: Record<string, GameInfo>;
}

export interface Tournament {
  id: number;
  name: string;
  description: string;
  date: string | null;
  status: 'registration_open' | 'registration_closed' | 'check_in' | 'brackets_generated' | 'in_progress' | 'completed' | 'cancelled';
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  seedType: 'RANDOM' | 'MANUAL';
  participant_count: number;
  is_signed_up: boolean;
  image: string | null;
  game_data: GameData | null;
  participants: Array<{
    id: number;
    display_name: string;
    profile_picture: string | null;
    points: number;
    site_rank: number;
  }>;
}

export interface TournamentUpdate extends Partial<Tournament> {
  id: number;
}
