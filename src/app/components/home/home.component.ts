import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WcMatch, Prediction, TournamentPrediction } from '../../models/models';

const STAGE_FULL: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter Final',
  SF: 'Semi Final', LF: 'Losers Final', FINAL: 'Final'
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="container">
      <h3 class="page-title">FIFA WC 2026 Prediction Contest</h3>

      <!-- Tournament prediction banner -->
      @if (!auth.isAdmin) {
        <div class="tourn-banner" [class.done]="hasTournamentPrediction" [class.closed]="!tournamentOpen" (click)="router.navigate(['/tournament'])">
          <span class="tourn-banner-icon">🏆</span>
          <div class="tourn-banner-text">
            <span class="tourn-banner-title">Tournament Predictions</span>
            @if (!tournamentOpen) {
              <span class="tourn-banner-sub">🔒 Predictions are closed.</span>
            } @else if (hasTournamentPrediction) {
              <span class="tourn-banner-sub">Your picks are in! Tap to view.</span>
            } @else {
              <span class="tourn-banner-sub">Predict award winners — 5 questions, 15 pts!</span>
            }
          </div>
          @if (tournamentOpen && !hasTournamentPrediction) {
            <span class="tourn-pending-badge">Pending</span>
          }
          @if (!tournamentOpen) {
            <span class="tourn-closed-badge">Closed</span>
          }
          <mat-icon class="tourn-arrow">chevron_right</mat-icon>
        </div>
      }

      <!-- Search bar -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search team..." [(ngModel)]="searchText" (ngModelChange)="applyFilters()">
          @if (searchText) {
            <button matSuffix mat-icon-button (click)="searchText=''; applyFilters()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

      @for (match of filteredMatches; track match.matchNo) {
        <mat-card class="match-card"
          [class.locked]="isLocked(match)"
          [class.tbd]="!teamsKnown(match)"
          [class.no-click]="auth.isAdmin || !teamsKnown(match)"
          (click)="openMatch(match)">
          <div class="match-header">
            <span class="match-no">{{ matchLabel(match) }}</span>
            <div class="header-chips">
              @if (!teamsKnown(match)) {
                <span class="tbd-badge">Teams TBD</span>
              } @else if (!auth.isAdmin && !isLocked(match) && !hasPrediction(match)) {
                <span class="pending-badge">Prediction Pending</span>
              }
              <mat-chip-set>
                <mat-chip [class.live]="isLocked(match)" [class.tbd-chip]="!teamsKnown(match)">
                  {{ !teamsKnown(match) ? '⏳ Awaiting Teams' : isLocked(match) ? '🔒 Locked' : '🟢 Open' }}
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>
          <div class="teams">
            <span class="team"><img class="team-flag" [src]="match.teamALogo" [alt]="match.teamA"> {{ match.teamA }}</span>
            <span class="vs">vs</span>
            <span class="team"><img class="team-flag" [src]="match.teamBLogo" [alt]="match.teamB"> {{ match.teamB }}</span>
          </div>
          <div class="match-info">
            <span><mat-icon inline>schedule</mat-icon> {{ formatDate(match.dateTime) }}</span>
            <span><mat-icon inline>stadium</mat-icon> {{ match.venue }}</span>
          </div>
          <div class="group-badge">{{ stageLabel(match.stage) }}</div>
        </mat-card>
      }

      @if (filteredMatches.length === 0 && !loading) {
        <div class="no-results">No upcoming matches found</div>
      }

      @if (loading) {
        <div class="text-center mt-16">Loading matches...</div>
      }
    </div>
  `,
  styles: [`
    .page-title { margin: 0 0 12px; color: #1a237e; font-size: 18px; font-weight: 700; }
    .tourn-banner {
      display: flex; align-items: center; gap: 12px;
      background: linear-gradient(135deg, #1a237e, #3949ab);
      color: #fff; border-radius: 14px; padding: 14px 16px;
      margin-bottom: 12px; cursor: pointer; transition: opacity 0.15s;
      touch-action: manipulation;
    }
    .tourn-banner:active { opacity: 0.85; }
    .tourn-banner.done { background: linear-gradient(135deg, #1b5e20, #388e3c); }
    .tourn-banner.closed { background: linear-gradient(135deg, #37474f, #546e7a); }
    .tourn-banner-icon { font-size: 28px; flex-shrink: 0; line-height: 1; }
    .tourn-banner-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .tourn-banner-title { font-size: 14px; font-weight: 700; }
    .tourn-banner-sub { font-size: 11px; opacity: 0.85; }
    .tourn-pending-badge {
      padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
      background: rgba(255,255,255,0.2); flex-shrink: 0;
    }
    .tourn-closed-badge {
      padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
      background: rgba(255,255,255,0.15); flex-shrink: 0; letter-spacing: 0.3px;
    }
    .tourn-arrow { opacity: 0.7; flex-shrink: 0; }
    .search-bar { display: flex; margin-bottom: 8px; }
    .search-field { flex: 1; }
    .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .no-results { text-align: center; color: #999; padding: 32px; }
    .match-card {
      cursor: pointer; padding: 16px; transition: transform 0.15s ease, box-shadow 0.15s ease;
      touch-action: manipulation;
    }
    .match-card:active { transform: scale(0.98); }
    .match-card.locked { opacity: 0.7; }
    .match-card.no-click { cursor: default; pointer-events: none; }
    .match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .match-no { font-size: 12px; color: #666; font-weight: 500; }
    .header-chips { display: flex; align-items: center; gap: 6px; }
    .pending-badge {
      font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px;
      background: #fff3e0; color: #e65100; border: 1px solid #ffcc80;
      white-space: nowrap;
    }
    .tbd-badge {
      font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 10px;
      background: #f5f5f5; color: #9e9e9e; border: 1px solid #e0e0e0;
      white-space: nowrap;
    }
    .match-card.tbd { opacity: 0.55; cursor: default; }
    .teams { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; }
    .team { font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px; word-break: break-word; }
    .team-flag { width: 24px; height: 16px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
    .vs { color: #999; font-size: 13px; flex-shrink: 0; }
    .match-info {
      display: flex; flex-direction: column; gap: 4px;
      font-size: 12px; color: #666; margin-top: 8px;
    }
    .match-info span { display: flex; align-items: center; gap: 4px; }
    .match-info mat-icon { font-size: 14px; width: 14px; height: 14px; flex-shrink: 0; }
    .group-badge {
      position: absolute; top: 12px; right: 12px;
      background: #e8eaf6; color: #1a237e; padding: 2px 8px;
      border-radius: 12px; font-size: 11px; font-weight: 500;
    }
    mat-chip.live { background: #ffcdd2 !important; }
    mat-chip.tbd-chip { background: #f5f5f5 !important; color: #9e9e9e !important; }
    @media (max-width: 768px) {
      .filter-panel { flex-direction: column; }
      .filter-field { min-width: 100%; }
    }
    @media (max-width: 400px) {
      .team { font-size: 13px; }
      .match-card { padding: 12px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  matches: WcMatch[] = [];
  filteredMatches: WcMatch[] = [];
  loading = true;
  searchText = '';
  predictedMatchIds = new Set<string>();
  hasTournamentPrediction = false;
  tournamentOpen = true;
  private matchLabels = new Map<string, string>();

  constructor(private api: ApiService, public auth: AuthService, public router: Router) {}

  ngOnInit(): void {
    this.api.getMatches().subscribe({
      next: (matches) => {
        this.buildMatchLabels(matches);
        this.matches = this.auth.isAdmin
          ? matches.filter(m => m.dateTime)
          : matches.filter(m => m.dateTime && !this.isLocked(m));
        this.filteredMatches = this.matches;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    if (!this.auth.isAdmin) {
      this.api.getMyPredictions(this.auth.currentUser!.userId).subscribe({
        next: (res) => {
          this.predictedMatchIds = new Set(res.predictions.map(p => p.matchId));
        }
      });
      this.api.getTournamentPrediction(this.auth.currentUser!.userId).subscribe({
        next: (res) => { this.hasTournamentPrediction = !!(res.prediction && res.prediction.userId); },
        error: () => {}
      });
      this.api.isTournamentOpen().subscribe({
        next: (res) => { this.tournamentOpen = res.open; },
        error: () => {}
      });
    }
  }

  private buildMatchLabels(matches: WcMatch[]): void {
    const counters: Record<string, number> = {};
    const stageOrder = ['R32', 'R16', 'QF', 'SF', 'LF', 'FINAL'];
    const sorted = [...matches].sort((a, b) => {
      const si = stageOrder.indexOf(a.stage ?? '') - stageOrder.indexOf(b.stage ?? '');
      return si !== 0 ? si : (a.dateTime ?? '').localeCompare(b.dateTime ?? '');
    });
    sorted.forEach(m => {
      const s = m.stage ?? 'FINAL';
      counters[s] = (counters[s] ?? 0) + 1;
      if (s === 'LF' || s === 'FINAL') {
        this.matchLabels.set(m.matchNo, STAGE_FULL[s] ?? s);
      } else {
        this.matchLabels.set(m.matchNo, `${s} ${counters[s]}`);
      }
    });
  }

  matchLabel(match: WcMatch): string {
    return this.matchLabels.get(match.matchNo) ?? `Match ${match.matchNo}`;
  }

  stageLabel(stage: string | undefined): string {
    return STAGE_FULL[stage ?? ''] ?? stage ?? '';
  }

  hasPrediction(match: WcMatch): boolean {
    return this.predictedMatchIds.has(match.matchNo);
  }

  teamsKnown(match: WcMatch): boolean {
    return !!(match.teamALogo && match.teamBLogo);
  }

  applyFilters(): void {
    const raw = this.searchText.toLowerCase().trim();
    if (!raw) { this.filteredMatches = this.matches; return; }
    // Normalize month names so "june" matches "jun", "january" matches "jan" etc.
    const search = raw
      .replace(/\bjanuary\b/, 'jan').replace(/\bfebruary\b/, 'feb')
      .replace(/\bmarch\b/, 'mar').replace(/\bapril\b/, 'apr')
      .replace(/\bmay\b/, 'may').replace(/\bjune\b/, 'jun')
      .replace(/\bjuly\b/, 'jul').replace(/\baugust\b/, 'aug')
      .replace(/\bseptember\b/, 'sep').replace(/\boctober\b/, 'oct')
      .replace(/\bnovember\b/, 'nov').replace(/\bdecember\b/, 'dec');
    this.filteredMatches = this.matches.filter(m => {
      const teams = `${m.teamA} ${m.teamB}`.toLowerCase();
      const date = this.formatDate(m.dateTime).toLowerCase();
      return teams.includes(search) || date.includes(search);
    });
  }

  isLocked(match: WcMatch): boolean {
    return new Date() >= new Date(match.dateTime);
  }

  openMatch(match: WcMatch): void {
    if (this.auth.isAdmin || !this.teamsKnown(match)) return;
    this.router.navigate(['/predict', match.matchNo]);
  }

  formatDate(dateTime: string): string {
    if (!dateTime) return 'TBD';
    // normalise "+05:30" → "+0530" for cross-browser ISO 8601 parsing
    const normalised = dateTime.replace(/([+-]\d{2}):(\d{2})$/, '$1$2');
    const d = new Date(normalised);
    if (isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST';
  }
}
