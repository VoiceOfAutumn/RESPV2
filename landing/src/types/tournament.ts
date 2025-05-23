export interface Tournament {
  id: number;
  name: string;
  description: string;
  date: string;
  status: 'registration_open' | 'registration_closed' | 'check_in' | 'in_progress' | 'completed' | 'cancelled';
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  seedType: 'RANDOM' | 'MANUAL';
  participant_count: number;
  is_signed_up: boolean;
  image: string | null;
  participants: Array<{
    id: number;
    display_name: string;
    profile_picture: string | null;
  }>;
}

export interface TournamentUpdate extends Partial<Tournament> {
  id: number;
}
