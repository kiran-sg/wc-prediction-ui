import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Prediction, MatchResult } from '../../models/models';

interface PredictionRow {
  prediction: Prediction;
  result: MatchResult | null;
}

@Component({
  selector: 'app-my-predictions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatChipsModule, MatButtonModule],
  template: `
    <div class="container">
      <h3 class="page-title">My Predictions</h3>

      @if (loading) {
        <div class="text-center mt-16">Loading...</div>
      } @else if (rows.length === 0) {
        <div class="empty">
          <mat-icon>inbox</mat-icon>
          <p>No predictions yet. Go predict some matches!</p>
          <button mat-raised-button color="primary" (click)="router.navigate(['/home'])">View Matches</button>
        </div>
      } @else {
        <div class="summary-bar">
          <div class="summary-item">
            <span class="summary-num">{{ rows.length }}</span>
            <span class="summary-label">Predicted</span>
          </div>
          <div class="summary-item">
            <span class="summary-num">{{ scoredCount }}</span>
            <span class="summary-label">Scored</span>
          </div>
          <div class="summary-item highlight">
            <span class="summary-num">{{ totalPoints }}</span>
            <span class="summary-label">Total pts</span>
          </div>
        </div>

        <!-- Team search -->
        <div class="team-search-bar">
          <mat-icon class="search-icon-inline">search</mat-icon>
          <input class="team-search-input" placeholder="Search by team name..."
                 [(ngModel)]="teamSearch" (ngModelChange)="filterRows()">
          @if (teamSearch) {
            <button class="clear-search" (click)="teamSearch=''; filterRows()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        @for (row of filteredRows; track row.prediction.predictionId) {
          <mat-card class="pred-card">
            <!-- Match header -->
            <div class="card-header">
              <span class="match-label">{{ row.prediction.match }}</span>
              <span class="match-date"><mat-icon inline>schedule</mat-icon> {{ formatDate(row.prediction.matchDateTime) }}</span>
              @if (row.prediction.points != null && row.prediction.points >= 0 && row.result) {
                <span class="pts-badge" [class.zero]="row.prediction.points === 0">
                  {{ row.prediction.points }} pts
                </span>
              } @else {
                <span class="pts-badge pending">Pending</span>
              }
            </div>

            <!-- Prediction vs Result grid -->
            <div class="grid-header">
              <span></span>
              <span class="col-label">Your Prediction</span>
              <span class="col-label">Actual Result</span>
              <span class="col-label result-col">Result</span>
            </div>

            <!-- Q1: Who progresses -->
            <div class="grid-row" [class.correct]="q1Correct(row)" [class.wrong]="row.result && !q1Correct(row)">
              <span class="q-label">Who progresses</span>
              <span class="q-value">{{ formatResult(row.prediction.matchResultPredicted, row.prediction.match) }}</span>
              <span class="q-value actual">{{ row.result ? formatResult(row.result.matchResult, row.prediction.match) : '—' }}</span>
              <span class="q-status">
                @if (row.result) {
                  @if (q1Correct(row)) { <mat-icon class="icon-correct">check_circle</mat-icon> }
                  @else { <mat-icon class="icon-wrong">cancel</mat-icon> }
                } @else { <span class="dots">•••</span> }
              </span>
            </div>

            <!-- Q2: Exact score -->
            <div class="grid-row" [class.correct]="q2Correct(row)" [class.wrong]="row.result && !q2Correct(row)">
              <span class="q-label">Exact score</span>
              <span class="q-value">{{ row.prediction.scoreTeamAPredicted }} – {{ row.prediction.scoreTeamBPredicted }}</span>
              <span class="q-value actual">{{ row.result ? (row.result.scoreTeamA + ' – ' + row.result.scoreTeamB) : '—' }}</span>
              <span class="q-status">
                @if (row.result) {
                  @if (q2Correct(row)) { <mat-icon class="icon-correct">check_circle</mat-icon> }
                  @else { <mat-icon class="icon-wrong">cancel</mat-icon> }
                } @else { <span class="dots">•••</span> }
              </span>
            </div>

            <!-- Q3: Winning goalscorer -->
            <div class="grid-row" [class.correct]="q3Correct(row)" [class.wrong]="row.result && !q3Correct(row)">
              <span class="q-label">Winning goalscorer</span>
              <span class="q-value">{{ row.prediction.winningGoalscorerPredicted || '—' }}</span>
              <span class="q-value actual">{{ row.result?.winningGoalscorer || '—' }}</span>
              <span class="q-status">
                @if (row.result) {
                  @if (q3Correct(row)) { <mat-icon class="icon-correct">check_circle</mat-icon> }
                  @else { <mat-icon class="icon-wrong">cancel</mat-icon> }
                } @else { <span class="dots">•••</span> }
              </span>
            </div>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .page-title { margin: 0 0 16px; color: #1a237e; font-size: 18px; font-weight: 700; }
    .empty { text-align: center; padding: 48px 16px; color: #999; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .empty p { margin: 0 0 16px; font-size: 15px; }

    .summary-bar {
      display: flex; gap: 0; margin-bottom: 16px;
      background: #1a237e; border-radius: 12px; overflow: hidden;
    }
    .summary-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      padding: 12px 8px; color: rgba(255,255,255,0.8);
      border-right: 1px solid rgba(255,255,255,0.15);
    }
    .summary-item:last-child { border-right: none; }
    .summary-item.highlight { background: rgba(255,255,255,0.1); color: #fff; }
    .summary-num { font-size: 24px; font-weight: 700; line-height: 1; color: #fff; }
    .summary-label { font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

    .pred-card { padding: 0; overflow: hidden; }

    .card-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #eee;
    }
    .match-label { font-weight: 600; font-size: 14px; flex: 1; color: #1a237e; }
    .match-date { font-size: 12px; color: #888; }
    .pts-badge {
      padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
      background: #e8f5e9; color: #2e7d32;
    }
    .pts-badge.zero { background: #fce4ec; color: #c62828; }
    .pts-badge.pending { background: #fff8e1; color: #e65100; }

    .grid-header {
      display: grid; grid-template-columns: 100px 1fr 1fr 28px;
      padding: 6px 12px; background: #fafafa;
      border-bottom: 1px solid #eee;
    }
    .col-label { font-size: 10px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.4px; }
    .result-col { text-align: center; }

    .grid-row {
      display: grid; grid-template-columns: 100px 1fr 1fr 28px;
      padding: 10px 12px; border-bottom: 1px solid #f0f0f0; align-items: center;
      transition: background 0.15s; gap: 4px;
    }
    .grid-row:last-child { border-bottom: none; }
    .grid-row.correct { background: #f1f8e9; }
    .grid-row.wrong { background: #fce4ec; }

    .q-label { font-size: 11px; color: #555; font-weight: 600; word-break: break-word; }
    .q-value { font-size: 12px; color: #222; word-break: break-word; }
    .q-value.actual { color: #1a237e; font-weight: 500; }
    .q-status { display: flex; justify-content: center; align-items: center; }
    .icon-correct { color: #43a047; font-size: 18px; width: 18px; height: 18px; }
    .icon-wrong { color: #e53935; font-size: 18px; width: 18px; height: 18px; }
    .dots { color: #bbb; font-size: 14px; letter-spacing: 2px; }

    .team-search-bar {
      display: flex; align-items: center; gap: 8px;
      background: #f5f5f5; border-radius: 10px; padding: 10px 12px;
      margin-bottom: 12px; border: 1px solid #e0e0e0; min-height: 44px;
    }
    .search-icon-inline { color: #999; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .team-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; color: #222; min-width: 0;
    }
    .clear-search {
      border: none; background: none; cursor: pointer; padding: 4px;
      display: flex; align-items: center; color: #aaa;
      min-width: 32px; min-height: 32px; justify-content: center;
    }
    .clear-search mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .clear-search:hover { color: #555; }

    @media (max-width: 400px) {
      .grid-header, .grid-row { grid-template-columns: 80px 1fr 1fr 24px; padding: 8px 10px; }
      .q-value, .q-label { font-size: 11px; }
      .card-header { padding: 10px 12px; }
      .match-label { font-size: 13px; }
    }
  `]
})
export class MyPredictionsComponent implements OnInit {
  rows: PredictionRow[] = [];
  filteredRows: PredictionRow[] = [];
  teamSearch = '';
  loading = true;
  totalPoints = 0;
  scoredCount = 0;

  constructor(public router: Router, private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    const userId = this.auth.currentUser!.userId;
    this.api.getMyPredictions(userId).subscribe({
      next: (res) => {
        const predictions = res.predictions || [];
        if (predictions.length === 0) { this.loading = false; return; }

        const resultCalls = predictions.map(p =>
          this.api.getMatchResult(p.matchId)
        );

        forkJoin(resultCalls).subscribe({
          next: (results) => {
            this.rows = predictions
              .map((p, i) => ({ prediction: p, result: results[i].matchResult }))
              .sort((a, b) => new Date(a.prediction.matchDateTime || '').getTime() - new Date(b.prediction.matchDateTime || '').getTime());
            this.filteredRows = this.rows;
            this.totalPoints = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
            this.scoredCount = predictions.filter(p => p.points != null && p.points >= 0 && this.rows.find(r => r.prediction === p)?.result != null).length;
            this.loading = false;
          },
          error: () => {
            this.rows = predictions
              .map(p => ({ prediction: p, result: null }))
              .sort((a, b) => new Date(a.prediction.matchDateTime || '').getTime() - new Date(b.prediction.matchDateTime || '').getTime());
            this.filteredRows = this.rows;
            this.loading = false;
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  formatDate(dateTime: string | undefined): string {
    if (!dateTime) return 'TBD';
    const normalised = dateTime.replace(/([+-]\d{2}):(\d{2})$/, '$1$2');
    const d = new Date(normalised);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST';
  }

  filterRows(): void {
    const s = this.teamSearch.toLowerCase().trim();
    this.filteredRows = s
      ? this.rows.filter(r => (r.prediction.match || '').toLowerCase().includes(s))
      : this.rows;
  }

  formatResult(result: string, matchName: string | undefined): string {
    if (!matchName || !result) return result || '—';
    const [teamA, teamB] = matchName.split(' vs ');
    if (result === 'TEAM_A_WIN') return teamA + ' win';
    if (result === 'TEAM_B_WIN') return teamB + ' win';
    if (result === 'DRAW') return 'Draw';
    return result;
  }

  q1Correct(row: PredictionRow): boolean {
    return !!row.result && row.prediction.matchResultPredicted === row.result.matchResult;
  }

  q2Correct(row: PredictionRow): boolean {
    return !!row.result &&
      row.prediction.scoreTeamAPredicted === row.result.scoreTeamA &&
      row.prediction.scoreTeamBPredicted === row.result.scoreTeamB;
  }

  q3Correct(row: PredictionRow): boolean {
    return !!row.result && !!row.prediction.winningGoalscorerPredicted &&
      row.prediction.winningGoalscorerPredicted === row.result.winningGoalscorer;
  }
}
