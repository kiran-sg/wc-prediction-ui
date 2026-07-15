import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WcMatch, WcPlayer, WcUser, Prediction, MatchResult, LeaderboardEntry, TournamentPrediction, TournamentResult } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Matches
  getMatches(): Observable<WcMatch[]> {
    return this.http.get<WcMatch[]>(`${this.api}/matches`);
  }

  // Teams
  getAllTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/teams`);
  }

  // Players
  getAllPlayers(): Observable<WcPlayer[]> {
    return this.http.get<WcPlayer[]>(`${this.api}/players`);
  }

  getPlayersByTeams(teams: string[]): Observable<WcPlayer[]> {
    return this.http.get<WcPlayer[]>(`${this.api}/players/teams`, { params: { teams } });
  }

  // Predictions
  getPrediction(userId: string, matchId: string): Observable<{ prediction: Prediction | null }> {
    return this.http.post<{ prediction: Prediction | null }>(`${this.api}/predictions/match`, { userId, matchId });
  }

  savePrediction(prediction: Prediction): Observable<{ status: boolean; message: string; prediction: Prediction }> {
    return this.http.post<{ status: boolean; message: string; prediction: Prediction }>(`${this.api}/predictions`, prediction);
  }

  getMyPredictions(userId: string): Observable<{ predictions: Prediction[] }> {
    return this.http.get<{ predictions: Prediction[] }>(`${this.api}/predictions`, { params: { user: userId } });
  }

  // Leaderboard
  getLeaderboard(location: string): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.api}/predictions/leaderboard`, { params: { location } });
  }

  // Sync
  syncTeams(): Observable<any> {
    return this.http.get<any>(`${this.api}/matches/sync-teams`);
  }

  syncKnockoutMatches(): Observable<any> {
    return this.http.get<any>(`${this.api}/matches/sync-knockout`);
  }

  syncPlayers(): Observable<any> {
    return this.http.get<any>(`${this.api}/matches/sync-players`);
  }

  syncAll(): Observable<any> {
    return this.http.get<any>(`${this.api}/matches/sync-all`);
  }

  // Admin
  getMatchResult(matchId: string): Observable<{ matchResult: MatchResult | null }> {
    return this.http.get<{ matchResult: MatchResult | null }>(`${this.api}/matches/result`, { params: { matchId } });
  }

  scrapeMatchResult(matchId: string): Observable<{ status: boolean; message: string; matchResult: MatchResult | null }> {
    return this.http.get<{ status: boolean; message: string; matchResult: MatchResult | null }>(`${this.api}/admin/match/scrape`, { params: { matchId } });
  }

  updateMatchResult(result: MatchResult): Observable<{ status: boolean; message: string }> {
    return this.http.post<{ status: boolean; message: string }>(`${this.api}/admin/match/result`, result);
  }

  getPredictionsByMatch(matchId: string): Observable<{ predictions: Prediction[] }> {
    return this.http.get<{ predictions: Prediction[] }>(`${this.api}/admin/predictions/match`, { params: { matchId } });
  }

  // Users
  getUsers(): Observable<WcUser[]> {
    return this.http.get<WcUser[]>(`${this.api}/users`);
  }

  createUser(user: { userId: string; name: string; location: string; isAdmin: boolean }): Observable<WcUser> {
    return this.http.post<WcUser>(`${this.api}/users`, user);
  }

  uploadUsers(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(`${this.api}/admin/users/upload`, form);
  }

  updateMissedPoints(userId: string, missedPoints: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/admin/users/${userId}/missed-points`, { missedPoints });
  }

  // Tournament predictions
  getTournamentPrediction(userId: string): Observable<{ prediction: TournamentPrediction | null }> {
    return this.http.get<{ prediction: TournamentPrediction | null }>(`${this.api}/tournament/prediction`, { params: { userId } });
  }

  saveTournamentPrediction(pred: TournamentPrediction): Observable<{ status: boolean; message: string; prediction: TournamentPrediction }> {
    return this.http.post<{ status: boolean; message: string; prediction: TournamentPrediction }>(`${this.api}/tournament/prediction`, pred);
  }

  getTournamentResult(): Observable<TournamentResult> {
    return this.http.get<TournamentResult>(`${this.api}/tournament/result`);
  }

  saveTournamentResult(result: TournamentResult): Observable<{ status: boolean; message: string }> {
    return this.http.post<{ status: boolean; message: string }>(`${this.api}/tournament/result`, result);
  }

  getAllTournamentPredictions(): Observable<TournamentPrediction[]> {
    return this.http.get<TournamentPrediction[]>(`${this.api}/tournament/predictions`);
  }

  // App config
  isTournamentOpen(): Observable<{ open: boolean }> {
    return this.http.get<{ open: boolean }>(`${this.api}/config/tournament-open`);
  }

  setTournamentOpen(open: boolean): Observable<{ open: boolean; message: string }> {
    return this.http.post<{ open: boolean; message: string }>(`${this.api}/admin/config/tournament-open`, { open });
  }

  // DB Config (superadmin)
  getDbTables(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/superadmin/db/tables`);
  }

  getDbRows(table: string, q = '', offset = 0, limit = 50): Observable<{ rows: any[]; total: number }> {
    return this.http.get<{ rows: any[]; total: number }>(`${this.api}/superadmin/db/table/${table}`, { params: { q, offset, limit } });
  }

  updateDbRow(table: string, id: any, fields: Record<string, any>): Observable<any> {
    return this.http.patch<any>(`${this.api}/superadmin/db/table/${table}/${id}`, fields);
  }

  deleteDbRow(table: string, id: any): Observable<any> {
    return this.http.delete<any>(`${this.api}/superadmin/db/table/${table}/${id}`);
  }
}
