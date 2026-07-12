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
            <!-- Q1: Who progresses -->
            <mat-card class="section-card">
              <h4>Who progresses to the next round</h4>
              <p class="hint">Predict which team advances from the match. The outcome is determined after full time, extra time, or a penalty shootout.</p>
              <mat-radio-group [(ngModel)]="prediction.matchResultPredicted" name="matchResult" required class="result-group">
                <mat-radio-button value="TEAM_A_WIN">{{ match.teamA }}</mat-radio-button>
                <mat-radio-button value="TEAM_B_WIN">{{ match.teamB }}</mat-radio-button>
              </mat-radio-group>
            </mat-card>

            <!-- Q2: Exact Score -->
            <mat-card class="section-card">
              <h4>Exact score after full time &amp; extra time</h4>
              <p class="hint">Predict the final scoreline at the end of regulation or, where applicable, extra time. The score at the end of extra time is the score that counts — regardless of what follows. Shootout goals excluded.</p>
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

            <!-- Q3: Winning Goalscorer -->
            <mat-card class="section-card">
              <h4>Winning goalscorer</h4>
              <p class="hint">Predict the player who scores the goal that gives the winning team a lead they never relinquish. Shootout goals are excluded.<br><br><em>Example: Score is 2–2 → player scores to make it 3–2 → match ends 4–2: scorer of the 3rd goal is the Winning Goalscorer. If match ends 4–3, scorer of the 4th goal is the Winning Goalscorer.</em></p>
              <div class="own-goal-rule">
                <button type="button" mat-button class="own-goal-toggle" (click)="showOwnGoalRule = !showOwnGoalRule">
                  <mat-icon>{{ showOwnGoalRule ? 'expand_less' : 'expand_more' }}</mat-icon>
                  Own Goal Exception
                </button>
                @if (showOwnGoalRule) {
                  <div class="own-goal-content">
                    <p>If the decisive goal is an own goal, the Winning Goalscorer is instead:</p>
                    <ul>
                      <li>The scorer of the <strong>first real goal by the winning team after</strong> that own goal</li>
                      <li>If no real goals follow (e.g. multiple own goals decided the match), then the scorer of the winning team's <strong>most recent real goal before</strong> the first own goal</li>
                    </ul>
                    <p class="own-goal-ex-label"><strong>Examples</strong></p>
                    <ul>
                      <li>3–3 → own goal (4–3) → winning team scores to make 5–3 → ends 5–3: <strong>scorer of the 5–3 goal</strong></li>
                      <li>3–3 → own goal (4–3) → winning team scores 5–3, then 6–3 → ends 6–3: <strong>still scorer of 5–3</strong> (first real goal after the own goal)</li>
                      <li>3–3 → own goal (4–3) → own goal (5–3) → ends 5–3 (no real goal from winning team after 3–3): <strong>scorer of the winning team's most recent real goal before the own goal</strong></li>
                    </ul>
                  </div>
                }
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Search player</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input matInput
                       [(ngModel)]="goalscorerSearch"
                       name="goalscorerSearch"
                       (ngModelChange)="filterPlayers()"
                       (blur)="onGoalscorerBlur()"
                       [matAutocomplete]="goalscorerAuto"
                       placeholder="Type name or team...">
                <mat-autocomplete #goalscorerAuto="matAutocomplete"
                                  (optionSelected)="onGoalscorerSelected($event.option.value)">
                  <mat-option value="No Winning Goal (Draw)">No Winning Goal (Draw)</mat-option>
                  @for (player of filteredPlayers; track player.id) {
                    <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                  }
                </mat-autocomplete>
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
              <div class="summary-row"><span>Who progresses:</span><strong>{{ formatResult(prediction.matchResultPredicted) }}</strong></div>
              <div class="summary-row"><span>Exact score:</span><strong>{{ prediction.scoreTeamAPredicted }} – {{ prediction.scoreTeamBPredicted }}</strong></div>
              <div class="summary-row"><span>Winning goalscorer:</span><strong>{{ prediction.winningGoalscorerPredicted }}</strong></div>
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
    .header-card { text-align: center; padding: 20px 16px; background: linear-gradient(135deg, #e8eaf6, #c5cae9); }
    .match-title { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .team-name { font-size: 17px; font-weight: 600; word-break: break-word; }
    .vs { color: #666; font-size: 13px; flex-shrink: 0; }
    .match-meta { font-size: 12px; color: #555; margin-top: 8px; }
    .locked-badge { margin-top: 8px; color: #c62828; font-weight: 500; font-size: 13px; }
    .section-card { padding: 16px; }
    .section-card h4 { margin: 0 0 8px; color: #1a237e; font-size: 15px; }
    .hint { font-size: 12px; color: #666; margin: 0 0 12px; line-height: 1.5; }
    .result-group { display: flex; flex-direction: column; gap: 10px; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .score-field { flex: 1; min-width: 0; }
    .score-dash { font-size: 20px; font-weight: bold; color: #666; flex-shrink: 0; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .summary-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid #eee; gap: 8px;
    }
    .summary-row span { font-size: 13px; color: #555; flex-shrink: 0; }
    .summary-row strong { font-size: 13px; text-align: right; word-break: break-word; }
    .summary-row:last-of-type { border-bottom: none; }
    .points-badge {
      text-align: center; margin-top: 12px; padding: 10px;
      background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-weight: 700; font-size: 20px;
    }
    .own-goal-rule { margin-top: 10px; border-top: 1px solid #e0e0e0; padding-top: 6px; }
    .own-goal-toggle { font-size: 12px; color: #555; padding: 0 4px; min-height: 32px; display: flex; align-items: center; gap: 2px; }
    .own-goal-toggle mat-icon { font-size: 18px; height: 18px; width: 18px; }
    .own-goal-content { background: #f5f5f5; border-radius: 8px; padding: 12px 14px; margin-top: 6px; font-size: 12px; color: #444; line-height: 1.6; }
    .own-goal-content p { margin: 0 0 8px; }
    .own-goal-content ul { margin: 0 0 8px; padding-left: 18px; }
    .own-goal-content li { margin-bottom: 6px; }
    .own-goal-ex-label { margin-top: 10px !important; }
    @media (max-width: 400px) {
      .team-name { font-size: 14px; }
      .section-card { padding: 12px; }
      .own-goal-content { padding: 10px 12px; }
    }
  `]
})
export class PredictComponent implements OnInit {
  match: WcMatch | null = null;
  players: WcPlayer[] = [];
  filteredPlayers: WcPlayer[] = [];
  goalscorerSearch = '';
  prediction: Prediction = this.emptyPrediction();
  locked = false;
  existing = false;
  saving = false;
  showOwnGoalRule = false;

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
        this.api.getPlayersByTeams([this.match.teamA, this.match.teamB]).subscribe(p => {
          this.players = p;
          this.filteredPlayers = p;
        });
      }
    });

    this.api.getPrediction(this.auth.currentUser!.userId, matchId).subscribe(res => {
      if (res.prediction) {
        this.prediction = res.prediction;
        this.existing = true;
        this.goalscorerSearch = res.prediction.winningGoalscorerPredicted || '';
      }
    });
  }

  submit(): void {
    if (!this.prediction.matchResultPredicted) {
      this.snackBar.open('Please select who progresses to the next round.', 'OK', { duration: 3000 });
      return;
    }
    if (this.prediction.scoreTeamAPredicted == null || this.prediction.scoreTeamBPredicted == null) {
      this.snackBar.open('Please enter the exact score for both teams.', 'OK', { duration: 3000 });
      return;
    }
    if (!this.prediction.winningGoalscorerPredicted) {
      this.snackBar.open('Please select a winning goalscorer.', 'OK', { duration: 3000 });
      return;
    }
    this.saving = true;
    this.api.savePrediction(this.prediction).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.open(res.message, '✓', { duration: 2000 });
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error saving prediction', 'OK', { duration: 3000 });
      }
    });
  }

  filterPlayers(): void {
    const s = this.goalscorerSearch.toLowerCase().trim();
    this.filteredPlayers = s
      ? this.players.filter(p => p.playerName.toLowerCase().includes(s) || p.team.toLowerCase().includes(s))
      : this.players;
  }

  onGoalscorerSelected(value: string): void {
    this.prediction.winningGoalscorerPredicted = value;
    this.goalscorerSearch = value;
  }

  onGoalscorerBlur(): void {
    // If input doesn't match a valid selection, revert to last valid value
    const valid = this.goalscorerSearch === 'No Winning Goal (Draw)' ||
      this.players.some(p => p.playerName === this.goalscorerSearch);
    if (!valid) {
      this.goalscorerSearch = this.prediction.winningGoalscorerPredicted || '';
    }
  }

  goBack(): void { this.router.navigate(['/home']); }

  formatDate(dateTime: string): string {
    return new Date(dateTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  formatResult(result: string): string {
    if (result === 'TEAM_A_WIN') return this.match?.teamA + ' win';
    if (result === 'TEAM_B_WIN') return this.match?.teamB + ' win';
    if (result === 'DRAW') return 'Draw';
    return result;
  }

  private emptyPrediction(): Prediction {
    return {
      matchId: '', userId: '', matchResultPredicted: '',
      scoreTeamAPredicted: 0, scoreTeamBPredicted: 0,
      firstGoalscorerPredicted: '', winningGoalscorerPredicted: '', playerOfMatchPredicted: ''
    };
  }
}
