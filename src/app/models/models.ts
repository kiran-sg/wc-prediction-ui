export interface WcUser {
  userId: string;
  name: string;
  location: string;
  isAdmin: boolean;
}

export interface WcMatch {
  id: number;
  matchNo: string;
  dateTime: string;
  teamA: string;
  teamB: string;
  teamALogo: string;
  teamBLogo: string;
  groupName: string;
  venue: string;
}

export interface WcPlayer {
  id: number;
  playerName: string;
  team: string;
  position: string;
}

export interface Prediction {
  predictionId?: number;
  matchId: string;
  match?: string;
  matchDateTime?: string;
  matchDate?: string;
  userId: string;
  user?: WcUser;
  matchResultPredicted: string;
  scoreTeamAPredicted: number;
  scoreTeamBPredicted: number;
  firstGoalscorerPredicted: string;
  winningGoalscorerPredicted: string;
  playerOfMatchPredicted: string;
  predictionTime?: string;
  points?: number;
}

export interface MatchResult {
  matchId: string;
  match?: string;
  matchResult: string;
  scoreTeamA: number;
  scoreTeamB: number;
  firstGoalscorer: string;
  winningGoalscorer: string;
  playerOfMatch: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  location: string;
  totalPoints: number;
  position: number;
}
