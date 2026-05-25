import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WcMatch, WcPlayer, Prediction } from '../../models/models';

@Component({
  selector: 'app-predict',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatIconModule, MatSnackBarModule, MatAutocompleteModule
  ],
  template: `
    <div class="container">
      @if (match) {
        <mat-card class="header-card">
          <div class="match-title">
            <span class="team-name">{{ match.teamA }}</span>
            <span class="vs">vs</span>
            <span class="team-name">{{ match.teamB }}</span>
          </div>
          <div class="match-meta">
            {{ formatDate(match.dateTime) }} • {{ match.venue }}
          </div>
          @if (locked) {
            <div class="locked-badge">🔒 Predictions Locked</div>
          }
        </mat-card>

        @if (!locked) {
          <form (ngSubmit)="submit()">
            <!-- Match Result -->
            <mat-card class="section-card">
              <h4>Match Result</h4>
              <mat-radio-group [(ngModel)]="prediction.matchResultPredicted" name="matchResult" required class="result-group">
                <mat-radio-button value="TEAM_A_WIN">{{ match.teamA }} Win</mat-radio-button>
                <mat-radio-button value="DRAW">Draw</mat-radio-button>
                <mat-radio-button value="TEAM_B_WIN">{{ match.teamB }} Win</mat-radio-button>
              </mat-radio-group>
            </mat-card>

            <!-- Exact Score -->
            <mat-card class="section-card">
              <h4>Exact Score</h4>
              <div class="score-row">
                <mat-form-field appearance="outline" class="score-field">
                  <mat-label>{{ match.teamA }}</mat-label>
                  <input matInput type="number" min="0" max="20" [(ngModel)]="prediction.scoreTeamAPredicted" name="scoreA" required>
                </mat-form-field>
                <span class="score-dash">–</span>
                <mat-form-field appearance="outline" class="score-field">
                  <mat-label>{{ match.teamB }}</mat-label>
                  <input matInput type="number" min="0" max="20" [(ngModel)]="prediction.scoreTeamBPredicted" name="scoreB" required>
                </mat-form-field>
              </div>
            </mat-card>

            <!-- First Goalscorer -->
            <mat-card class="section-card">
              <h4>First Goalscorer</h4>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Player</mat-label>
                <mat-select [(ngModel)]="prediction.firstGoalscorerPredicted" name="firstGoalscorer" required>
                  <mat-option value="No Goal">No Goal (0-0)</mat-option>
                  @for (player of players; track player.id) {
                    <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </mat-card>

            <!-- Winning Goalscorer -->
            <mat-card class="section-card">
              <h4>Winning Goalscorer</h4>
              <p class="hint">Player who scores the decisive goal giving the winning team a lead they don't lose.</p>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Player</mat-label>
                <mat-select [(ngModel)]="prediction.winningGoalscorerPredicted" name="winningGoalscorer" required>
                  <mat-option value="No Winning Goal (Draw)">No Winning Goal (Draw)</mat-option>
                  @for (player of players; track player.id) {
                    <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </mat-card>

            <!-- Player of the Match -->
            <mat-card class="section-card">
              <h4>Player of the Match</h4>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Select Player</mat-label>
                <mat-select [(ngModel)]="prediction.playerOfMatchPredicted" name="potm" required>
                  @for (player of players; track player.id) {
                    <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </mat-card>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="saving">
              {{ saving ? 'Saving...' : (existing ? 'Update Prediction' : 'Submit Prediction') }}
            </button>
          </form>
        } @else {
          @if (prediction.predictionId) {
            <mat-card class="section-card">
              <h4>Your Prediction</h4>
              <div class="summary-row"><span>Result:</span><strong>{{ prediction.matchResultPredicted }}</strong></div>
              <div class="summary-row"><span>Score:</span><strong>{{ prediction.scoreTeamAPredicted }} – {{ prediction.scoreTeamBPredicted }}</strong></div>
              <div class="summary-row"><span>First Goalscorer:</span><strong>{{ prediction.firstGoalscorerPredicted }}</strong></div>
              <div class="summary-row"><span>Winning Goalscorer:</span><strong>{{ prediction.winningGoalscorerPredicted }}</strong></div>
              <div class="summary-row"><span>Player of Match:</span><strong>{{ prediction.playerOfMatchPredicted }}</strong></div>
              @if (prediction.points != null) {
                <div class="points-badge">{{ prediction.points }} pts</div>
              }
            </mat-card>
          } @else {
            <mat-card class="section-card text-center">
              <p>You didn't predict this match.</p>
            </mat-card>
          }
        }

        <button mat-button (click)="goBack()" class="full-width mt-8">
          <mat-icon>arrow_back</mat-icon> Back to Matches
        </button>
      }
    </div>
  `,
  styles: [`
    .header-card { text-align: center; padding: 20px; background: linear-gradient(135deg, #e8eaf6, #c5cae9); }
    .match-title { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .team-name { font-size: 18px; font-weight: 500; }
    .vs { color: #666; font-size: 14px; }
    .match-meta { font-size: 12px; color: #555; margin-top: 8px; }
    .locked-badge { margin-top: 8px; color: #c62828; font-weight: 500; font-size: 13px; }
    .section-card { padding: 16px; }
    .section-card h4 { margin: 0 0 12px; color: #1a237e; }
    .hint { font-size: 12px; color: #666; margin: -8px 0 12px; }
    .result-group { display: flex; flex-direction: column; gap: 8px; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .score-field { flex: 1; }
    .score-dash { font-size: 20px; font-weight: bold; color: #666; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .summary-row:last-of-type { border-bottom: none; }
    .points-badge {
      text-align: center; margin-top: 12px; padding: 8px;
      background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-weight: 500; font-size: 18px;
    }
  `]
})
export class PredictComponent implements OnInit {
  match: WcMatch | null = null;
  players: WcPlayer[] = [];
  prediction: Prediction = this.emptyPrediction();
  locked = false;
  existing = false;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const matchId = this.route.snapshot.paramMap.get('matchId')!;
    this.prediction.matchId = matchId;
    this.prediction.userId = this.auth.currentUser!.userId;

    this.api.getMatches().subscribe(matches => {
      this.match = matches.find(m => m.matchNo === matchId) ?? null;
      if (this.match) {
        this.locked = new Date() >= new Date(this.match.dateTime);
        this.api.getPlayersByTeams([this.match.teamA, this.match.teamB]).subscribe(p => this.players = p);
      }
    });

    this.api.getPrediction(this.auth.currentUser!.userId, matchId).subscribe(res => {
      if (res.prediction) {
        this.prediction = res.prediction;
        this.existing = true;
      }
    });
  }

  submit(): void {
    this.saving = true;
    this.api.savePrediction(this.prediction).subscribe({
      next: (res) => {
        this.saving = false;
        this.existing = true;
        this.snackBar.open(res.message, '✓', { duration: 2500 });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error saving prediction', 'OK', { duration: 3000 });
      }
    });
  }

  goBack(): void { this.router.navigate(['/home']); }

  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private emptyPrediction(): Prediction {
    return {
      matchId: '', userId: '', matchResultPredicted: '',
      scoreTeamAPredicted: 0, scoreTeamBPredicted: 0,
      firstGoalscorerPredicted: '', winningGoalscorerPredicted: '', playerOfMatchPredicted: ''
    };
  }
}
