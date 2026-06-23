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
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { WcMatch } from '../../models/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatBadgeModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <div class="container">
      <h3 class="page-title">FIFA WC 2026 Prediction Contest</h3>

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
        <button mat-icon-button class="filter-toggle" [class.active]="showFilters" (click)="showFilters = !showFilters">
          <mat-icon>tune</mat-icon>
        </button>
      </div>

      <!-- Filter panel -->
      @if (showFilters) {
        <div class="filter-panel">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Team</mat-label>
            <mat-select [(ngModel)]="filterTeams" (ngModelChange)="applyFilters()" multiple>
              @for (team of teams; track team) {
                <mat-option [value]="team">{{ team }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Group</mat-label>
            <mat-select [(ngModel)]="filterGroups" (ngModelChange)="applyFilters()" multiple>
              @for (group of groups; track group) {
                <mat-option [value]="group">Group {{ group }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-button class="clear-btn" (click)="clearFilters()">Clear All</button>
        </div>
      }

      @for (match of filteredMatches; track match.matchNo) {
        <mat-card class="match-card" [class.locked]="isLocked(match)" (click)="openMatch(match)">
          <div class="match-header">
            <span class="match-no">Match {{ match.matchNo }}</span>
            <mat-chip-set>
              <mat-chip [class.live]="isLocked(match)">
                {{ isLocked(match) ? '🔒 Locked' : '🟢 Open' }}
              </mat-chip>
            </mat-chip-set>
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
          @if (match.groupName) {
            <div class="group-badge">Group {{ match.groupName }}</div>
          }
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
    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .search-field { flex: 1; }
    .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .filter-toggle { color: #1a237e; }
    .filter-toggle.active { background: #e8eaf6; }
    .filter-panel {
      display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
      padding: 12px; background: #f5f5f5; border-radius: 12px;
      align-items: center;
    }
    .filter-field { flex: 1; min-width: 140px; }
    .filter-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .clear-btn { color: #d32f2f; }
    .no-results { text-align: center; color: #999; padding: 32px; }
    .match-card {
      cursor: pointer; padding: 16px; transition: transform 0.15s ease, box-shadow 0.15s ease;
      touch-action: manipulation;
    }
    .match-card:active { transform: scale(0.98); }
    .match-card.locked { opacity: 0.7; }
    .match-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .match-no { font-size: 12px; color: #666; font-weight: 500; }
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
  showFilters = false;
  filterTeams: string[] = [];
  filterGroups: string[] = [];
  teams: string[] = [];
  groups: string[] = [];

  constructor(private api: ApiService, public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.api.getMatches().subscribe({
      next: (matches) => {
        // Only show upcoming (unlocked) matches on this screen
        this.matches = matches.filter(m => m.dateTime && !this.isLocked(m));
        this.filteredMatches = this.matches;
        this.teams = [...new Set(this.matches.flatMap(m => [m.teamA, m.teamB]))].sort();
        this.groups = [...new Set(this.matches.map(m => m.groupName).filter(Boolean))].sort();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase();
    this.filteredMatches = this.matches.filter(m => {
      // Search text
      if (search) {
        const matchStr = `${m.teamA} ${m.teamB}`.toLowerCase();
        if (!matchStr.includes(search)) return false;
      }
      // Team filter
      if (this.filterTeams.length && !this.filterTeams.includes(m.teamA) && !this.filterTeams.includes(m.teamB)) return false;
      // Group filter
      if (this.filterGroups.length && !this.filterGroups.includes(m.groupName)) return false;
      return true;
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterTeams = [];
    this.filterGroups = [];
    this.filteredMatches = this.matches;
  }

  isLocked(match: WcMatch): boolean {
    return new Date() >= new Date(match.dateTime);
  }

  openMatch(match: WcMatch): void {
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
