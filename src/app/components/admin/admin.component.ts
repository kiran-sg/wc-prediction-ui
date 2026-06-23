import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { WcMatch, WcPlayer, MatchResult, Prediction } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatSelectModule,
    MatInputModule, MatButtonModule, MatRadioModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatIconModule, MatAutocompleteModule,
    MatTabsModule, MatChipsModule, MatTooltipModule
  ],
  template: `
    <div class="container">
      <h3>⚙️ Admin</h3>

      <mat-tab-group animationDuration="150ms" class="top-tabs">

        <!-- ═══ TOP TAB: MATCH RESULTS ═══ -->
        <mat-tab label="Match Results">
          <div class="tab-content">

      <!-- Match selector -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Select Match</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput
               [(ngModel)]="matchSearch"
               (ngModelChange)="filterMatches()"
               (blur)="onMatchBlur()"
               [matAutocomplete]="matchAuto"
               placeholder="Search match or team...">
        <mat-autocomplete #matchAuto="matAutocomplete" (optionSelected)="onMatchSelected($event.option.value)">
          @for (match of filteredMatches; track match.matchNo) {
            <mat-option [value]="match.matchNo">
              Match {{ match.matchNo }}: {{ match.teamA }} vs {{ match.teamB }}
            </mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>

      @if (selectedMatch) {
        <mat-tab-group animationDuration="150ms" class="admin-tabs">

          <!-- TAB 1: Enter Result -->
          <mat-tab label="Enter Result">
            <div class="tab-content">
              <div class="fetch-row">
                <button mat-stroked-button color="primary" type="button"
                        (click)="fetchFromEspn()" [disabled]="fetching">
                  @if (fetching) {
                    <mat-spinner diameter="18" class="btn-spinner"></mat-spinner>
                  } @else {
                    <mat-icon>sports_soccer</mat-icon>
                  }
                  {{ fetching ? 'Fetching...' : 'Fetch from ESPN' }}
                </button>
                @if (fetchMessage) {
                  <span class="fetch-msg" [class.error]="!fetchSuccess">{{ fetchMessage }}</span>
                }
              </div>

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

                <button mat-raised-button color="warn" type="submit" class="full-width submit-btn" [disabled]="saving">
                  {{ saving ? 'Saving...' : 'Submit Result & Calculate Points' }}
                </button>
              </form>
            </div>
          </mat-tab>

          <!-- TAB 2: View Predictions -->
          <mat-tab>
            <ng-template mat-tab-label>
              Predictions
              @if (predictions.length > 0) {
                <span class="tab-badge">{{ predictions.length }}</span>
              }
            </ng-template>
            <div class="tab-content">
              @if (loadingPredictions) {
                <div class="text-center mt-16">Loading predictions...</div>
              } @else if (predictions.length === 0) {
                <div class="empty-preds">
                  <mat-icon>inbox</mat-icon>
                  <p>No predictions submitted for this match yet.</p>
                </div>
              } @else {
                <!-- Result banner if available -->
                @if (result.matchResult) {
                  <div class="result-banner">
                    <span class="banner-score">{{ result.scoreTeamA }} – {{ result.scoreTeamB }}</span>
                    <span class="banner-result">{{ formatResult(result.matchResult) }}</span>
                    @if (result.winningGoalscorer) {
                      <span class="banner-scorer"><mat-icon inline>sports_soccer</mat-icon> {{ result.winningGoalscorer }}</span>
                    }
                  </div>
                }

                <!-- Summary chips -->
                <div class="pred-summary">
                  <span class="summary-chip total">{{ predictions.length }} predictions</span>
                  <span class="summary-chip scored">{{ scoredCount }} scored</span>
                  @if (result.matchResult) {
                    <span class="summary-chip q1">{{ q1CorrectCount }}/{{ predictions.length }} Q1 ✓</span>
                    <span class="summary-chip q2">{{ q2CorrectCount }}/{{ predictions.length }} Score ✓</span>
                    <span class="summary-chip q3">{{ q3CorrectCount }}/{{ predictions.length }} Scorer ✓</span>
                  }
                </div>

                <!-- User search -->
                <div class="user-search-bar">
                  <mat-icon class="search-icon-inline">search</mat-icon>
                  <input class="user-search-input" placeholder="Search by name or user ID..."
                         [(ngModel)]="userSearch" (ngModelChange)="filterPredictions()">
                  @if (userSearch) {
                    <button class="clear-search" (click)="userSearch=''; filterPredictions()">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
                @if (filteredPredictions.length === 0) {
                  <div class="empty-preds"><p>No users match "{{ userSearch }}"</p></div>
                }

                <!-- User prediction cards -->
                @for (p of filteredPredictions; track p.predictionId) {
                  <div class="pred-row" [class.has-points]="p.points != null">
                    <!-- User info -->
                    <div class="pred-user">
                      <mat-icon class="user-icon">account_circle</mat-icon>
                      <div class="user-details">
                        <span class="user-name">{{ p.user?.name || p.userId }}</span>
                        <span class="user-id">{{ p.userId }}</span>
                      </div>
                      @if (p.points != null) {
                        <span class="pts-chip" [class.zero]="p.points === 0" [class.max]="p.points >= 13">
                          {{ p.points }} pts
                        </span>
                      } @else {
                        <span class="pts-chip pending">—</span>
                      }
                    </div>

                    <!-- Answers row -->
                    <div class="pred-answers">
                      <div class="ans-cell" [class.correct]="isQ1Correct(p)" [class.wrong]="result.matchResult && !isQ1Correct(p)">
                        <span class="ans-label">Who progresses</span>
                        <span class="ans-val">{{ formatResult(p.matchResultPredicted) }}</span>
                        @if (result.matchResult) {
                          <mat-icon class="ans-icon">{{ isQ1Correct(p) ? 'check_circle' : 'cancel' }}</mat-icon>
                        }
                      </div>
                      <div class="ans-cell" [class.correct]="isQ2Correct(p)" [class.wrong]="result.matchResult && !isQ2Correct(p)">
                        <span class="ans-label">Score</span>
                        <span class="ans-val">{{ p.scoreTeamAPredicted }} – {{ p.scoreTeamBPredicted }}</span>
                        @if (result.matchResult) {
                          <mat-icon class="ans-icon">{{ isQ2Correct(p) ? 'check_circle' : 'cancel' }}</mat-icon>
                        }
                      </div>
                      <div class="ans-cell" [class.correct]="isQ3Correct(p)" [class.wrong]="result.matchResult && !isQ3Correct(p)">
                        <span class="ans-label">Goalscorer</span>
                        <span class="ans-val">{{ p.winningGoalscorerPredicted || '—' }}</span>
                        @if (result.matchResult) {
                          <mat-icon class="ans-icon">{{ isQ3Correct(p) ? 'check_circle' : 'cancel' }}</mat-icon>
                        }
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      }

          </div>
        </mat-tab>

        <!-- ═══ TOP TAB: USERS ═══ -->
        <mat-tab>
          <ng-template mat-tab-label>
            Users
            @if (allUsers.length > 0) {
              <span class="tab-badge">{{ allUsers.length }}</span>
            }
          </ng-template>
          <div class="tab-content">

            <!-- Add user form -->
            <mat-card class="section-card add-user-card">
              <h4><mat-icon>person_add</mat-icon> Add New User</h4>
              <div class="add-user-form">
                <!-- Row 1: User ID + Name -->
                <div class="add-row">
                  <mat-form-field appearance="outline" class="add-field">
                    <mat-label>User ID</mat-label>
                    <input matInput [(ngModel)]="newUser.userId" placeholder="e.g. john01" maxlength="30">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="add-field">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="newUser.name" placeholder="Full name" maxlength="60">
                  </mat-form-field>
                </div>
                <!-- Row 2: Location + Role + Button -->
                <div class="add-row add-row-2">
                  <mat-form-field appearance="outline" class="add-field-sm">
                    <mat-label>Location</mat-label>
                    <mat-select [(ngModel)]="newUser.location">
                      <mat-option value="TVM">TVM</mat-option>
                      <mat-option value="Pune">Pune</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-radio-group [(ngModel)]="newUser.isAdmin" class="role-group">
                    <mat-radio-button [value]="false">User</mat-radio-button>
                    <mat-radio-button [value]="true">Admin</mat-radio-button>
                  </mat-radio-group>
                  <button mat-raised-button color="primary" (click)="addUser()"
                          [disabled]="addingUser || !newUser.userId.trim() || !newUser.name.trim()"
                          class="add-btn">
                    {{ addingUser ? 'Adding...' : 'Add User' }}
                  </button>
                </div>
              </div>
            </mat-card>

            <!-- Search + list -->
            <div class="user-search-bar">
              <mat-icon class="search-icon-inline">search</mat-icon>
              <input class="user-search-input" placeholder="Search by name or user ID..."
                     [(ngModel)]="allUsersSearch" (ngModelChange)="filterAllUsers()">
              @if (allUsersSearch) {
                <button class="clear-search" (click)="allUsersSearch=''; filterAllUsers()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </div>

            @if (loadingUsers) {
              <div class="text-center mt-16">Loading users...</div>
            } @else {
              <div class="users-summary">
                <span class="summary-chip total" [class.active]="locationFilter === ''" (click)="setLocationFilter('')">{{ allUsers.length }} All</span>
                <span class="summary-chip scored" [class.active]="locationFilter === 'TVM'" (click)="setLocationFilter('TVM')">{{ tvmCount }} TVM</span>
                <span class="summary-chip q1" [class.active]="locationFilter === 'Pune'" (click)="setLocationFilter('Pune')">{{ puneCount }} Pune</span>
              </div>
              @for (u of filteredUsers; track u.userId) {
                <div class="user-row">
                  <mat-icon class="user-row-icon">account_circle</mat-icon>
                  <div class="user-row-info">
                    <span class="user-row-name">{{ u.name }}</span>
                    <span class="user-row-meta">{{ u.userId }} · {{ u.location }}</span>
                  </div>
                  @if (u.isAdmin) {
                    <span class="admin-chip">Admin</span>
                  }
                </div>
              }
              @if (filteredUsers.length === 0 && allUsersSearch) {
                <div class="empty-preds"><p>No users match "{{ allUsersSearch }}"</p></div>
              }
            }

          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    h3 { color: #1a237e; margin: 0 0 4px; }
    .top-tabs { margin-top: 0; }
    .tab-content { padding: 16px 0; }

    /* Add user form */
    .add-user-card { padding: 16px; margin-bottom: 16px; }
    .add-user-card h4 { margin: 0 0 12px; color: #1a237e; display: flex; align-items: center; gap: 8px; }
    .add-user-form { display: flex; flex-direction: column; gap: 8px; }
    .add-row { display: flex; gap: 8px; align-items: flex-start; }
    .add-row-2 { align-items: center; flex-wrap: wrap; }
    .add-field { flex: 1; min-width: 0; }
    .add-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .add-field-sm { width: 110px; flex-shrink: 0; }
    .add-field-sm .mat-mdc-form-field-subscript-wrapper { display: none; }
    .role-group { display: flex; gap: 12px; align-items: center; flex: 1; }
    .add-btn { height: 44px; white-space: nowrap; flex-shrink: 0; }
    @media (max-width: 420px) {
      .add-row { flex-direction: column; }
      .add-field, .add-field-sm { width: 100%; flex: unset; }
      .add-row-2 { gap: 8px; }
      .add-btn { width: 100%; }
    }

    /* User list */
    .users-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .users-summary .summary-chip { cursor: pointer; transition: all 0.15s; opacity: 0.7; }
    .users-summary .summary-chip:hover { opacity: 1; }
    .users-summary .summary-chip.active { opacity: 1; box-shadow: 0 0 0 2px currentColor; }
    .user-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: #fff; border-radius: 10px;
      margin-bottom: 6px; border: 1px solid #e0e0e0;
    }
    .user-row-icon { color: #bdbdbd; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .user-row-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .user-row-name { font-size: 14px; font-weight: 600; color: #222; }
    .user-row-meta { font-size: 11px; color: #999; }
    .admin-chip {
      padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600;
      background: #e8eaf6; color: #1a237e; flex-shrink: 0;
    }
    .section-card { padding: 16px; }
    .section-card h4 { margin: 0 0 12px; color: #1a237e; display: flex; align-items: center; gap: 8px; }
    .result-group { display: flex; flex-direction: column; gap: 8px; }
    .score-row { display: flex; align-items: center; gap: 8px; }
    .score-field { flex: 1; }
    .score-dash { font-size: 20px; font-weight: bold; color: #666; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .fetch-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .fetch-row button { display: flex; align-items: center; gap: 6px; }
    .btn-spinner { display: inline-block; }
    .fetch-msg { font-size: 13px; color: #388e3c; }
    .fetch-msg.error { color: #d32f2f; }

    /* Tab badge */
    .admin-tabs { margin-top: 4px; }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      background: #1a237e; color: #fff; border-radius: 10px;
      font-size: 10px; font-weight: 700; min-width: 18px; height: 18px;
      padding: 0 5px; margin-left: 6px;
    }

    /* Result banner */
    .result-banner {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      background: #1a237e; color: #fff; border-radius: 10px;
      padding: 10px 16px; margin-bottom: 12px;
    }
    .banner-score { font-size: 20px; font-weight: 700; }
    .banner-result { font-size: 13px; opacity: 0.85; }
    .banner-scorer { font-size: 13px; opacity: 0.85; display: flex; align-items: center; gap: 4px; margin-left: auto; }

    /* Summary chips */
    .pred-summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .summary-chip {
      padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .summary-chip.total { background: #e8eaf6; color: #1a237e; }
    .summary-chip.scored { background: #e8f5e9; color: #2e7d32; }
    .summary-chip.q1 { background: #fff3e0; color: #e65100; }
    .summary-chip.q2 { background: #fce4ec; color: #880e4f; }
    .summary-chip.q3 { background: #e0f7fa; color: #006064; }

    /* Prediction rows */
    .pred-row {
      background: #fff; border-radius: 10px; margin-bottom: 10px;
      border: 1px solid #e0e0e0; overflow: hidden;
    }
    .pred-row.has-points { border-left: 3px solid #1a237e; }
    .pred-user {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: #fafafa; border-bottom: 1px solid #f0f0f0;
    }
    .user-icon { color: #9e9e9e; font-size: 28px; width: 28px; height: 28px; }
    .user-details { flex: 1; display: flex; flex-direction: column; }
    .user-name { font-size: 14px; font-weight: 600; color: #222; line-height: 1.2; }
    .user-id { font-size: 11px; color: #999; }
    .pts-chip {
      padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 700;
      background: #e8f5e9; color: #2e7d32; white-space: nowrap;
    }
    .pts-chip.zero { background: #fce4ec; color: #c62828; }
    .pts-chip.max { background: #1a237e; color: #fff; }
    .pts-chip.pending { background: #f5f5f5; color: #aaa; }

    .pred-answers {
      display: grid; grid-template-columns: repeat(3, 1fr);
      padding: 10px 12px; gap: 6px;
    }
    .ans-cell {
      display: flex; flex-direction: column; gap: 2px;
      padding: 8px 8px 8px 8px; border-radius: 8px; background: #f9f9f9;
      position: relative; min-width: 0;
    }
    .ans-cell.correct { background: #f1f8e9; }
    .ans-cell.wrong { background: #fce4ec; }
    .ans-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; padding-right: 16px; }
    .ans-val { font-size: 12px; color: #222; font-weight: 500; word-break: break-word; }
    .ans-icon {
      position: absolute; top: 6px; right: 4px;
      font-size: 14px; width: 14px; height: 14px;
    }
    .ans-cell.correct .ans-icon { color: #43a047; }
    .ans-cell.wrong .ans-icon { color: #e53935; }

    .user-search-bar {
      display: flex; align-items: center; gap: 8px;
      background: #f5f5f5; border-radius: 10px; padding: 10px 12px;
      margin-bottom: 12px; border: 1px solid #e0e0e0; min-height: 44px;
    }
    .search-icon-inline { color: #999; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .user-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 14px; color: #222; min-width: 0;
    }
    .clear-search {
      border: none; background: none; cursor: pointer; padding: 4px; display: flex; align-items: center;
      color: #aaa; min-width: 32px; min-height: 32px; justify-content: center;
    }
    .clear-search mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .clear-search:hover { color: #555; }

    .empty-preds { text-align: center; padding: 40px 16px; color: #aaa; }
    .empty-preds mat-icon { font-size: 40px; width: 40px; height: 40px; display: block; margin: 0 auto 8px; }

    @media (max-width: 520px) {
      .pred-answers { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 360px) {
      .pred-answers { grid-template-columns: 1fr; padding: 8px; }
      .result-banner { flex-direction: column; gap: 4px; }
      .banner-scorer { margin-left: 0; }
      .pred-user { padding: 8px 10px; }
      .user-name { font-size: 13px; }
    }
  `]
})
export class AdminComponent implements OnInit {
  matches: WcMatch[] = [];
  filteredMatches: WcMatch[] = [];
  matchSearch = '';
  players: WcPlayer[] = [];
  selectedMatch: WcMatch | null = null;
  result: MatchResult = this.emptyResult();
  saving = false;
  fetching = false;
  fetchMessage = '';
  fetchSuccess = false;

  predictions: Prediction[] = [];
  filteredPredictions: Prediction[] = [];
  userSearch = '';
  loadingPredictions = false;

  allUsers: any[] = [];
  filteredUsers: any[] = [];
  allUsersSearch = '';
  locationFilter = '';
  loadingUsers = false;
  addingUser = false;
  newUser = { userId: '', name: '', location: 'TVM', isAdmin: false };

  get tvmCount(): number { return this.allUsers.filter(u => u.location === 'TVM').length; }
  get puneCount(): number { return this.allUsers.filter(u => u.location === 'Pune').length; }

  get scoredCount(): number { return this.predictions.filter(p => p.points != null).length; }
  get q1CorrectCount(): number { return this.predictions.filter(p => this.isQ1Correct(p)).length; }
  get q2CorrectCount(): number { return this.predictions.filter(p => this.isQ2Correct(p)).length; }
  get q3CorrectCount(): number { return this.predictions.filter(p => this.isQ3Correct(p)).length; }

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.api.getMatches().subscribe(m => { this.matches = m; this.filteredMatches = m; });
    this.loadUsers();
  }

  loadUsers(): void {
    this.loadingUsers = true;
    this.api.getUsers().subscribe({
      next: users => {
        this.allUsers = users.filter(u => !u.isAdmin).sort((a, b) => a.name.localeCompare(b.name));
        this.filterAllUsers();
        this.loadingUsers = false;
      },
      error: () => { this.loadingUsers = false; }
    });
  }

  setLocationFilter(loc: string): void {
    this.locationFilter = loc;
    this.filterAllUsers();
  }

  filterAllUsers(): void {
    const s = this.allUsersSearch.toLowerCase().trim();
    this.filteredUsers = this.allUsers.filter(u => {
      if (this.locationFilter && u.location !== this.locationFilter) return false;
      if (s && !u.name.toLowerCase().includes(s) && !u.userId.toLowerCase().includes(s)) return false;
      return true;
    });
  }

  addUser(): void {
    if (!this.newUser.userId.trim() || !this.newUser.name.trim()) return;
    this.addingUser = true;
    this.api.createUser({ ...this.newUser, userId: this.newUser.userId.trim(), name: this.newUser.name.trim() }).subscribe({
      next: () => {
        this.snackBar.open(`User "${this.newUser.name}" added`, '✓', { duration: 3000 });
        this.newUser = { userId: '', name: '', location: 'TVM', isAdmin: false };
        this.addingUser = false;
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Error adding user', 'OK', { duration: 3000 });
        this.addingUser = false;
      }
    });
  }

  filterMatches(): void {
    const s = this.matchSearch.toLowerCase();
    this.filteredMatches = s
      ? this.matches.filter(m => `${m.matchNo} ${m.teamA} ${m.teamB}`.toLowerCase().includes(s))
      : this.matches;
  }

  onMatchSelected(matchNo: string): void {
    this.selectedMatch = this.matches.find(m => m.matchNo === matchNo) ?? null;
    if (this.selectedMatch) {
      this.matchSearch = `Match ${this.selectedMatch.matchNo}: ${this.selectedMatch.teamA} vs ${this.selectedMatch.teamB}`;
      this.filteredMatches = this.matches;
      this.fetchMessage = '';
      this.result = this.emptyResult();
      this.result.matchId = matchNo;
      this.predictions = [];
      this.filteredPredictions = [];
      this.userSearch = '';
      this.api.getPlayersByTeams([this.selectedMatch.teamA, this.selectedMatch.teamB])
        .subscribe(p => this.players = p);
      this.api.getMatchResult(matchNo).subscribe(res => {
        if (res.matchResult) this.result = res.matchResult;
      });
      this.loadingPredictions = true;
      this.api.getPredictionsByMatch(matchNo).subscribe({
        next: res => {
          this.predictions = res.predictions || [];
          this.filteredPredictions = this.predictions;
          this.loadingPredictions = false;
        },
        error: () => { this.loadingPredictions = false; }
      });
    }
  }

  onMatchBlur(): void {
    // If the user clears the input or types something invalid, reset selection
    if (this.selectedMatch) {
      const expected = `Match ${this.selectedMatch.matchNo}: ${this.selectedMatch.teamA} vs ${this.selectedMatch.teamB}`;
      if (this.matchSearch !== expected) {
        this.selectedMatch = null;
        this.matchSearch = '';
        this.filteredMatches = this.matches;
      }
    }
  }

  fetchFromEspn(): void {
    this.fetching = true;
    this.fetchMessage = '';
    this.api.scrapeMatchResult(this.selectedMatch!.matchNo).subscribe({
      next: (res) => {
        this.fetching = false;
        if (res.status && res.matchResult) {
          this.result = res.matchResult;
          this.fetchSuccess = true;
          this.fetchMessage = 'Result fetched — review winning goalscorer and submit.';
        } else {
          this.fetchSuccess = false;
          this.fetchMessage = res.message || 'Could not fetch result from ESPN.';
        }
      },
      error: () => {
        this.fetching = false;
        this.fetchSuccess = false;
        this.fetchMessage = 'Error contacting server.';
      }
    });
  }

  submitResult(): void {
    this.saving = true;
    this.api.updateMatchResult(this.result).subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.open(res.message, '✓', { duration: 3000 });
        // Reload predictions so points are updated in the Predictions tab
        this.api.getPredictionsByMatch(this.result.matchId).subscribe(r => {
          this.predictions = r.predictions || [];
          this.filterPredictions();
        });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error saving result', 'OK', { duration: 3000 });
      }
    });
  }

  filterPredictions(): void {
    const s = this.userSearch.toLowerCase().trim();
    this.filteredPredictions = s
      ? this.predictions.filter(p =>
          (p.user?.name || '').toLowerCase().includes(s) ||
          (p.userId || '').toLowerCase().includes(s))
      : this.predictions;
  }

  formatResult(r: string): string {
    if (!r) return '—';
    if (r === 'TEAM_A_WIN') return this.selectedMatch ? this.selectedMatch.teamA + ' win' : 'Team A win';
    if (r === 'TEAM_B_WIN') return this.selectedMatch ? this.selectedMatch.teamB + ' win' : 'Team B win';
    if (r === 'DRAW') return 'Draw';
    return r;
  }

  isQ1Correct(p: Prediction): boolean {
    return !!this.result.matchResult && p.matchResultPredicted === this.result.matchResult;
  }

  isQ2Correct(p: Prediction): boolean {
    return !!this.result.matchResult &&
      p.scoreTeamAPredicted === this.result.scoreTeamA &&
      p.scoreTeamBPredicted === this.result.scoreTeamB;
  }

  isQ3Correct(p: Prediction): boolean {
    return !!this.result.matchResult && !!p.winningGoalscorerPredicted &&
      p.winningGoalscorerPredicted === this.result.winningGoalscorer;
  }

  private emptyResult(): MatchResult {
    return {
      matchId: '', matchResult: '', scoreTeamA: 0, scoreTeamB: 0,
      firstGoalscorer: '', winningGoalscorer: '', playerOfMatch: ''  // firstGoalscorer/playerOfMatch kept for DB compat
    };
  }
}
