import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WcMatch, WcPlayer, WcUser, Prediction, MatchResult, LeaderboardEntry } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Matches
  getMatches(): Observable<WcMatch[]> {
    return this.http.get<WcMatch[]>(`${this.api}/matches`);
  }

  // Players
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
}
