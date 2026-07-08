import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WcPlayer, TournamentPrediction, TournamentResult } from '../../models/models';

const QUESTIONS = [
  { key: 'goldenBall',   emoji: '⚽', image: 'trionda.png', label: 'Golden Ball',        desc: 'Best overall player of the tournament.',                                   isPlayer: true  },
  { key: 'goldenBoot',   emoji: '👟', image: '',            label: 'Golden Boot',         desc: 'Top goalscorer. Ties broken by assists, then fewest minutes played.',      isPlayer: true  },
  { key: 'goldenGlove',  emoji: '🧤', image: '',            label: 'Golden Glove',        desc: 'Best goalkeeper of the tournament.',                                       isPlayer: true  },
  { key: 'youngPlayer',  emoji: '🌟', image: '',            label: 'Young Player Award',  desc: 'Best player aged 21 or under.',                                           isPlayer: true  },
  { key: 'fairPlayTeam', emoji: '🤝', image: '',            label: 'Fair Play Trophy',    desc: 'Team with the fewest cards and infractions.',                              isPlayer: false },
] as const;

type QuestionKey = 'goldenBall' | 'goldenBoot' | 'goldenGlove' | 'youngPlayer' | 'fairPlayTeam';

@Component({
  selector: 'app-tournament-predict',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    MatAutocompleteModule, MatChipsModule, MatSelectModule
  ],
  template: `
    <div class="container">
      <mat-card class="header-card">
        <div class="header-title">🏆 Tournament Predictions</div>
        <div class="header-sub">5 questions · 3 points each · Max 15 pts</div>
        <div class="header-note">All results will be updated based on FIFA's official confirmation.</div>
        @if (locked) {
          <div class="locked-badge">🔒 Tournament predictions are locked</div>
        }
      </mat-card>

      @if (!locked) {
        <form (ngSubmit)="submit()">
          @for (q of questions; track q.key) {
            <mat-card class="section-card" [class.unanswered]="submitAttempted && !prediction[q.key]">
              <div class="q-header">
                @if (q.image) {
                  <img [src]="q.image" class="q-ball-img" alt="Golden Ball">
                } @else {
                  <span class="q-emoji">{{ q.emoji }}</span>
                }
                <div>
                  <h4>{{ q.label }} <span class="req-star">*</span></h4>
                  <p class="hint">{{ q.desc }}</p>
                </div>
              </div>

              <div class="search-wrap">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Search {{ q.isPlayer ? 'player' : 'team' }}...</mat-label>
                  <mat-icon matPrefix>search</mat-icon>
                  <input matInput
                         #trigger="matAutocompleteTrigger"
                         [(ngModel)]="searches[q.key]"
                         [name]="'search_' + q.key"
                         (ngModelChange)="filter(q.key)"
                         (blur)="onBlur(q.key)"
                         [matAutocomplete]="auto">
                  @if (q.isPlayer) {
                    <button type="button" matSuffix class="filter-icon-btn"
                            [class.active]="isFiltered(q.key)"
                            (click)="$event.stopPropagation(); toggleFilter(q.key, trigger)"
                            [title]="isFiltered(q.key) ? 'Filters active' : 'Filter by position/country'">
                      <mat-icon>{{ isFiltered(q.key) ? 'filter_alt' : 'tune' }}</mat-icon>
                    </button>
                  }
                  <mat-autocomplete #auto="matAutocomplete"
                                    (optionSelected)="onSelect(q.key, $event.option.value)">
                    @for (opt of filtered[q.key]; track opt) {
                      <mat-option [value]="opt">{{ opt }}{{ q.isPlayer && teamFor(opt) ? ' (' + teamFor(opt) + ')' : '' }}</mat-option>
                    }
                  </mat-autocomplete>
                  @if (submitAttempted && !prediction[q.key]) {
                    <mat-error>Required</mat-error>
                  }
                </mat-form-field>

                @if (q.isPlayer && showFilters[q.key]) {
                  <div class="filter-panel">
                    @if (q.key !== 'goldenGlove') {
                      <div class="filter-label">Position</div>
                      <div class="pos-chips">
                        @for (pos of ['All', ...positions]; track pos) {
                          <button type="button" class="pos-chip"
                                  [class.active]="filterPosition[q.key] === (pos === 'All' ? '' : pos)"
                                  (click)="setFilterPosition(q.key, pos === 'All' ? '' : pos)">
                            {{ pos }}
                          </button>
                        }
                      </div>
                    }
                    <div class="filter-label" style="margin-top:8px">Country</div>
                    <select class="country-select"
                            [(ngModel)]="filterCountry[q.key]"
                            [name]="'country_' + q.key"
                            (change)="onCountryChange(q.key)">
                      <option value="">All countries</option>
                      @for (c of countries; track c) {
                        <option [value]="c">{{ c }}</option>
                      }
                    </select>
                    <div class="filter-actions">
                      <button type="button" class="apply-filters-btn" (click)="applyAndClose(q.key)">
                        <mat-icon>check</mat-icon> Apply
                      </button>
                      @if (isFiltered(q.key)) {
                        <button type="button" class="clear-filters-btn" (click)="clearFilters(q.key)">
                          <mat-icon>close</mat-icon> Clear
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
              @if (prediction[q.key]) {
                <div class="selected-chip">
                  <mat-icon>check_circle</mat-icon>
                  <span>{{ prediction[q.key] }}{{ q.isPlayer && teamFor(prediction[q.key]) ? ' (' + teamFor(prediction[q.key]) + ')' : '' }}</span>
                  <button type="button" class="clear-btn" (click)="clear(q.key)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </mat-card>
          }
          <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="saving">
            {{ saving ? 'Saving...' : (existing ? 'Update Tournament Predictions' : 'Submit Tournament Predictions') }}
          </button>
        </form>
      } @else {
        @if (existing) {
          <mat-card class="section-card">
            <h4 style="margin:0 0 16px; color:#1a237e;">Your Tournament Predictions</h4>
            @for (q of questions; track q.key) {
              <div class="summary-row">
                @if (q.image) {
                  <img [src]="q.image" class="q-ball-sm" alt="Golden Ball">
                } @else {
                  <span class="q-emoji-sm">{{ q.emoji }}</span>
                }
                <span class="summary-label">{{ q.label }}</span>
                <strong>{{ prediction[q.key] || '—' }}</strong>
                @if (result && result[q.key]) {
                  <span class="pts-indicator" [class.correct]="prediction[q.key] === result[q.key]" [class.wrong]="prediction[q.key] !== result[q.key]">
                    {{ prediction[q.key] === result[q.key] ? '+3' : '0' }} pts
                  </span>
                } @else {
                  <span class="pts-indicator pending">Pending</span>
                }
              </div>
            }
            @if (result && (savedPrediction?.totalPoints != null)) {
              <div class="points-badge">{{ savedPrediction!.totalPoints }} / 15 pts</div>
            } @else {
              <div class="points-badge pending-total">Result not yet announced</div>
            }
          </mat-card>
        } @else {
          <mat-card class="section-card text-center">
            <p>You didn't submit tournament predictions.</p>
          </mat-card>
        }
      }

      <button mat-button (click)="router.navigate(['/home'])" class="full-width mt-8">
        <mat-icon>arrow_back</mat-icon> Back to Matches
      </button>
    </div>
  `,
  styles: [`
    .header-card {
      text-align: center; padding: 20px 16px;
      background: linear-gradient(135deg, #e8eaf6, #c5cae9); margin-bottom: 0;
    }
    .header-title { font-size: 20px; font-weight: 700; color: #1a237e; }
    .header-sub { font-size: 13px; color: #555; margin-top: 4px; }
    .header-note { font-size: 11px; color: #777; margin-top: 6px; font-style: italic; }
    .locked-badge { margin-top: 8px; color: #c62828; font-weight: 500; font-size: 13px; }
    .section-card { padding: 16px; }
    .section-card.unanswered { border: 2px solid #e53935; }
    .req-star { color: #e53935; font-weight: 700; margin-left: 2px; }
    .q-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .q-emoji { font-size: 28px; line-height: 1; flex-shrink: 0; margin-top: 2px; }
    .q-ball-img { width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; margin-top: 0; }
    .q-header h4 { margin: 0 0 4px; color: #1a237e; font-size: 15px; }
    .hint { font-size: 12px; color: #666; margin: 0; line-height: 1.5; }

    /* Filter icon button inside mat-suffix */
    .filter-icon-btn {
      background: none; border: none; cursor: pointer; padding: 0;
      display: flex; align-items: center; color: #9e9e9e; transition: color 0.15s;
    }
    .filter-icon-btn:hover { color: #3949ab; }
    .filter-icon-btn.active { color: #3949ab; }
    .filter-icon-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* Filter panel dropdown */
    .search-wrap { position: relative; }
    .filter-panel {
      position: absolute; top: calc(100% - 20px); left: 0; right: 0; z-index: 10;
      background: #fff; border: 1.5px solid #c5cae9; border-radius: 10px;
      padding: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }
    .filter-label { font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .pos-chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
    .pos-chips::-webkit-scrollbar { display: none; }
    .pos-chip {
      padding: 4px 10px; border-radius: 14px; border: 1.5px solid #c5cae9;
      background: #f5f5ff; color: #3949ab; font-size: 11px; font-weight: 600;
      cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: all 0.15s;
    }
    .pos-chip.active { background: #3949ab; color: #fff; border-color: #3949ab; }
    .pos-chip:hover:not(.active) { background: #e8eaf6; }
    .country-select {
      width: 100%; padding: 7px 10px; border-radius: 8px;
      border: 1.5px solid #c5cae9; background: #f5f5ff;
      color: #3949ab; font-size: 12px; font-weight: 500;
      cursor: pointer; outline: none;
    }
    .country-select:focus { border-color: #3949ab; }
    .filter-actions { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
    .apply-filters-btn {
      display: flex; align-items: center; gap: 4px;
      background: #3949ab; color: #fff; border: none; border-radius: 8px;
      padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .apply-filters-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .apply-filters-btn:hover { background: #1a237e; }
    .clear-filters-btn {
      display: flex; align-items: center; gap: 4px;
      border: none; background: none; color: #e53935; font-size: 12px;
      font-weight: 600; cursor: pointer; padding: 0;
    }
    .clear-filters-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .selected-chip {
      display: flex; align-items: center; gap: 8px;
      background: #e8f5e9; color: #2e7d32; border-radius: 20px;
      padding: 6px 12px; font-size: 13px; font-weight: 500;
      width: fit-content; max-width: 100%;
    }
    .selected-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .clear-btn {
      border: none; background: none; cursor: pointer;
      display: flex; align-items: center; padding: 0; color: #888;
    }
    .clear-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .clear-btn:hover { color: #333; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 8px; }
    .summary-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 0; border-bottom: 1px solid #eee;
    }
    .summary-row:last-of-type { border-bottom: none; }
    .q-emoji-sm { font-size: 18px; flex-shrink: 0; width: 24px; }
    .q-ball-sm { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
    .summary-label { font-size: 13px; color: #555; flex: 1; }
    .summary-row strong { font-size: 13px; }
    .pts-indicator {
      padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; flex-shrink: 0;
    }
    .pts-indicator.correct { background: #e8f5e9; color: #2e7d32; }
    .pts-indicator.wrong { background: #fce4ec; color: #c62828; }
    .pts-indicator.pending { background: #fff3e0; color: #e65100; }
    .pending-total {
      text-align: center; margin-top: 16px; padding: 10px;
      background: #fff3e0; color: #e65100; border-radius: 8px;
      font-weight: 500; font-size: 13px;
    }
    .points-badge {
      text-align: center; margin-top: 16px; padding: 12px;
      background: #e8f5e9; color: #2e7d32; border-radius: 8px;
      font-weight: 700; font-size: 20px;
    }
    @media (max-width: 400px) {
      .section-card { padding: 12px; }
      .q-emoji { font-size: 22px; }
    }
  `]
})
export class TournamentPredictComponent implements OnInit {
  readonly questions = QUESTIONS;
  players: WcPlayer[] = [];
  teams: string[] = [];
  countries: string[] = [];
  positions: string[] = [];

  searches:       Record<QuestionKey, string>   = { goldenBall: '', goldenBoot: '', goldenGlove: '', youngPlayer: '', fairPlayTeam: '' };
  filtered:       Record<QuestionKey, string[]>  = { goldenBall: [], goldenBoot: [], goldenGlove: [], youngPlayer: [], fairPlayTeam: [] };
  prediction:     Record<QuestionKey, string>   = { goldenBall: '', goldenBoot: '', goldenGlove: '', youngPlayer: '', fairPlayTeam: '' };
  filterPosition: Record<QuestionKey, string>   = { goldenBall: '', goldenBoot: '', goldenGlove: '', youngPlayer: '', fairPlayTeam: '' };
  filterCountry:  Record<QuestionKey, string>   = { goldenBall: '', goldenBoot: '', goldenGlove: '', youngPlayer: '', fairPlayTeam: '' };
  showFilters:    Record<QuestionKey, boolean>  = { goldenBall: false, goldenBoot: false, goldenGlove: false, youngPlayer: false, fairPlayTeam: false };

  result: TournamentResult | null = null;
  savedPrediction: TournamentPrediction | null = null;
  locked = false;
  existing = false;
  saving = false;
  submitAttempted = false;

  constructor(
    public router: Router,
    private api: ApiService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.api.isTournamentOpen().subscribe(r => { this.locked = !r.open; });

    this.api.getAllPlayers().subscribe(p => {
      this.players = p;
      this.countries = [...new Set(p.map(x => x.team).filter(Boolean))].sort();
      this.positions = [...new Set(p.map(x => x.position?.toUpperCase()).filter(Boolean) as string[])].sort();
      for (const q of this.questions) {
        this.filtered[q.key] = this.applyFilters(q.key);
      }
    });

    this.api.getAllTeams().subscribe(teams => {
      this.teams = teams.map((t: any) => t.teamName).filter(Boolean).sort();
      this.filtered['fairPlayTeam'] = this.teams;
    });

    this.api.getTournamentResult().subscribe(r => { this.result = r; });

    const userId = this.auth.currentUser!.userId;
    this.api.getTournamentPrediction(userId).subscribe(res => {
      if (res.prediction && res.prediction.userId) {
        this.savedPrediction = res.prediction;
        this.existing = true;
        const p = res.prediction;
        this.prediction = {
          goldenBall:   p.goldenBall   || '',
          goldenBoot:   p.goldenBoot   || '',
          goldenGlove:  p.goldenGlove  || '',
          youngPlayer:  p.youngPlayer  || '',
          fairPlayTeam: p.fairPlayTeam || '',
        };
        this.searches = { ...this.prediction };
      }
    });
  }

  teamFor(playerName: string): string {
    return this.players.find(p => p.playerName === playerName)?.team || '';
  }

  toggleFilter(key: QuestionKey, trigger?: MatAutocompleteTrigger): void {
    trigger?.closePanel();
    (Object.keys(this.showFilters) as QuestionKey[]).forEach(k => {
      if (k !== key) this.showFilters[k] = false;
    });
    this.showFilters[key] = !this.showFilters[key];
  }

  isFiltered(key: QuestionKey): boolean {
    return !!(this.filterPosition[key] || this.filterCountry[key]);
  }

  applyAndClose(key: QuestionKey): void {
    this.filtered[key] = this.applyFilters(key);
    this.showFilters[key] = false;
  }

  clearFilters(key: QuestionKey): void {
    this.filterPosition[key] = '';
    this.filterCountry[key] = '';
    this.filtered[key] = this.applyFilters(key);
  }

  onCountryChange(key: QuestionKey): void {
    this.filtered[key] = this.applyFilters(key);
  }

  setFilterPosition(key: QuestionKey, pos: string): void {
    this.filterPosition[key] = pos;
    this.filtered[key] = this.applyFilters(key);
  }

  // Main filter engine — combines position + country + name search
  applyFilters(key: QuestionKey): string[] {
    if (key === 'fairPlayTeam') {
      const s = this.searches[key].toLowerCase().trim();
      return s ? this.teams.filter(t => t.toLowerCase().includes(s)) : this.teams;
    }

    let src = this.players;

    // Golden Glove always locked to GK
    if (key === 'goldenGlove') {
      const gks = src.filter(p => p.position?.toUpperCase() === 'GK');
      if (gks.length > 0) src = gks;
    } else if (this.filterPosition[key]) {
      src = src.filter(p => p.position?.toUpperCase() === this.filterPosition[key]);
    }

    if (this.filterCountry[key]) {
      src = src.filter(p => p.team === this.filterCountry[key]);
    }

    const s = this.searches[key].toLowerCase().trim();
    if (s) {
      src = src.filter(p => p.playerName.toLowerCase().includes(s));
    }

    return [...new Set(src.map(p => p.playerName))].sort();
  }

  filter(key: QuestionKey): void {
    this.filtered[key] = this.applyFilters(key);
  }

  onSelect(key: QuestionKey, value: string): void {
    this.prediction[key] = value;
    this.searches[key] = value;
    if (this.submitAttempted && this.questions.every(q => this.prediction[q.key])) {
      this.submitAttempted = false;
    }
  }

  onBlur(key: QuestionKey): void {
    if (key === 'fairPlayTeam') {
      if (this.searches[key] && !this.teams.includes(this.searches[key])) {
        this.searches[key] = this.prediction[key];
      }
      return;
    }
    const allNames = this.players.map(p => p.playerName);
    if (this.searches[key] && !allNames.includes(this.searches[key])) {
      this.searches[key] = this.prediction[key];
    }
  }

  clear(key: QuestionKey): void {
    this.prediction[key] = '';
    this.searches[key] = '';
    this.filterPosition[key] = '';
    this.filterCountry[key] = '';
    this.showFilters[key] = false;
    this.filtered[key] = this.applyFilters(key);
  }

  submit(): void {
    this.submitAttempted = true;
    const missing = this.questions.filter(q => !this.prediction[q.key]);
    if (missing.length > 0) {
      this.snackBar.open(`Please answer all ${missing.length} remaining question${missing.length > 1 ? 's' : ''}.`, 'OK', { duration: 3000 });
      return;
    }
    this.saving = true;
    const payload: TournamentPrediction = {
      userId: this.auth.currentUser!.userId,
      ...this.prediction,
    };
    this.api.saveTournamentPrediction(payload).subscribe({
      next: (res) => {
        this.saving = false;
        this.savedPrediction = res.prediction;
        this.existing = true;
        this.snackBar.open(res.message, '✓', { duration: 2000 });
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Error saving prediction', 'OK', { duration: 3000 });
      }
    });
  }
}
