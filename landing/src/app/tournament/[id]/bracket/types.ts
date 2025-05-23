export interface Player {
  id: number;
  name: string;
  profile_picture?: string;
  score?: number;
}

export interface Match {
  id: number;
  round: number;
  match_number: number;
  player1_id: number | null;  player2_id: number | null;
  player1_name: string | null;
  player2_name: string | null;
  player1_picture: string | null;
  player2_picture: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: number | null;
  winner_name: string | null;
  next_match_id: number | null;
  bye_match: boolean;
  bracket: 'winners' | 'losers' | 'finals';
}

export interface Tournament {
  id: number;
  format: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';
  status: string;
}

export interface BracketData {
  tournament: Tournament;
  matches: Match[];
}