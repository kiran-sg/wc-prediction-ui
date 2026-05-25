import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { WcMatch, WcPlayer, MatchResult } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatSnackBarModule
  ],
  template: `
    <div class="container">
      <h3>⚙️ Admin - Enter Results</h3>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Select Match</mat-label>
        <mat-select [(ngModel)]="selectedMatchNo" (selectionChange)="onMatchSelect()">
          @for (match of matches; track match.matchNo) {
            <mat-option [value]="match.matchNo">
              Match {{ match.matchNo }}: {{ match.teamA }} vs {{ match.teamB }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      @if (selectedMatch) {
        <form (ngSubmit)="submitResult()">
          <mat-card class="section-card">
            <h4>Match Result</h4>
            <mat-radio-group [(ngModel)]="result.matchResult" name="matchResult" required class="result-group">
              <mat-radio-button value="TEAM_A_WIN">{{ selectedMatch.teamA }} Win</mat-radio-button>
              <mat-radio-button value="DRAW">Draw</mat-radio-button>
              <mat-radio-button value="TEAM_B_WIN">{{ selectedMatch.teamB }} Win</mat-radio-button>
            </mat-radio-group>
          </mat-card>

          <mat-card class="section-card">
            <h4>Final Score</h4>
            <div class="score-row">
              <mat-form-field appearance="outline" class="score-field">
                <mat-label>{{ selectedMatch.teamA }}</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="result.scoreTeamA" name="scoreA" required>
              </mat-form-field>
              <span class="score-dash">–</span>
              <mat-form-field appearance="outline" class="score-field">
                <mat-label>{{ selectedMatch.teamB }}</mat-label>
                <input matInput type="number" min="0" [(ngModel)]="result.scoreTeamB" name="scoreB" required>
              </mat-form-field>
            </div>
          </mat-card>

          <mat-card class="section-card">
            <h4>First Goalscorer</h4>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Player</mat-label>
              <mat-select [(ngModel)]="result.firstGoalscorer" name="firstGoalscorer" required>
                <mat-option value="No Goal">No Goal (0-0)</mat-option>
                @for (player of players; track player.id) {
                  <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </mat-card>

          <mat-card class="section-card">
            <h4>Winning Goalscorer</h4>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Player</mat-label>
              <mat-select [(ngModel)]="result.winningGoalscorer" name="winningGoalscorer" required>
                <mat-option value="No Winning Goal (Draw)">No Winning Goal (Draw)</mat-option>
                @for (player of players; track player.id) {
                  <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </mat-card>

          <mat-card class="section-card">
            <h4>Player of the Match</h4>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Player</mat-label>
              <mat-select [(ngModel)]="result.playerOfMatch" name="potm" required>
                @for (player of players; track player.id) {
                  <mat-option [value]="player.playerName">{{ player.playerName }} ({{ player.team }})</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </mat-card>

          <button mat-raised-button color="warn" type="submit" class="full-width submit-btn" [disabled]="saving">
            {{ saving ? 'Saving...' : 'Submit Result & Calculate Points' }}
          </button>
        </form>
      }
    </div>
  `,
  styles: [`
    h3 { color: #1a237e; margin: 0 0 16px; }
    .section-card { padding: 16px; }
    .section-card h4 { margin: 0 0 12px; color: #1a237e; }
    .result-group { display: flex; flex-direction: column; gap: 8px; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .score-field { flex: 1; }
    .score-dash { font-size: 20px; font-weight: bold; color: #666; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
  `]
})
export class AdminComponent implements OnInit {
  matches: WcMatch[] = [];
  players: WcPlayer[] = [];
  selectedMatchNo = '';
  selectedMatch: WcMatch | null = null;
  result: MatchResult = this.emptyResult();
  saving = false;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getMatches().subscribe(m => this.matches = m);
  }

  onMatchSelect(): void {
    this.selectedMatch = this.matches.find(m => m.matchNo === this.selectedMatchNo) ?? null;
    if (this.selectedMatch) {
      this.result = this.emptyResult();
      this.result.matchId = this.selectedMatchNo;
      this.api.getPlayersByTeams([this.selectedMatch.teamA, this.selectedMatch.teamB]).subscribe(p => this.players = p);
      this.api.getMatchResult(this.selectedMatchNo).subscribe(res => {
        if (res.matchResult) this.result = res.matchResult;
      });
    }
  }

  submitResult(): void {
    this.saving = true;
    this.api.updateMatchResult(this.result).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.open(res.message, '✓', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error saving result', 'OK', { duration: 3000 });
      }
    });
  }

  private emptyResult(): MatchResult {
    return {
      matchId: '', matchResult: '', scoreTeamA: 0, scoreTeamB: 0,
      firstGoalscorer: '', winningGoalscorer: '', playerOfMatch: ''
    };
  }
}
