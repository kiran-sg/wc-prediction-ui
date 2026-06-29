import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LeaderboardEntry } from '../../models/models';

interface LocationBoard {
  loc: string;
  label: string;
  leaderBoard: LeaderboardEntry[];
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule],
  template: `
    <div class="leaderboard-page">
      <h3 class="page-title">🏆 Leaderboard</h3>

      <mat-tab-group class="location-tabs" animationDuration="300ms" mat-stretch-tabs="false">
        @for (loc of locations; track loc.loc) {
          <mat-tab [label]="loc.label">
            <div class="tab-content">

              <!-- Your Standing -->
              @if (getUserRank(loc.leaderBoard); as myRank) {
                <div class="your-rank-card">
                  <div class="your-rank-label">Your Standing</div>
                  <div class="your-rank-body">
                    <div class="your-rank-position">
                      @if (myRank.position <= 3) {
                        <span class="medal large">{{ getMedal(myRank.position) }}</span>
                      } @else {
                        <span class="rank-number">#{{ myRank.position }}</span>
                      }
                    </div>
                    <div class="your-rank-info">
                      <span class="your-rank-name">{{ myRank.userName }}</span>
                      <span class="your-rank-points">{{ myRank.totalPoints }} pts</span>
                    </div>
                  </div>
                </div>
              }

              <!-- Full list -->
              @if (loc.leaderBoard.length > 0) {
                <div class="rank-list">
                  @for (entry of loc.leaderBoard; track entry.userId) {
                    <div class="rank-row" [class.is-current-user]="entry.userId === currentUserId">
                      <span class="rank-pos">
                        @if (entry.position <= 3) {
                          <span class="medal">{{ getMedal(entry.position) }}</span>
                        } @else {
                          #{{ entry.position }}
                        }
                      </span>
                      <span class="rank-name">{{ entry.userName }}</span>
                      <span class="rank-pts">{{ entry.totalPoints }} pts</span>
                    </div>
                  }
                </div>
              }

              @if (loading) {
                <div class="empty-state"><p>Loading...</p></div>
              } @else if (loc.leaderBoard.length === 0) {
                <div class="empty-state">
                  <mat-icon>emoji_events</mat-icon>
                  <p>No standings yet. Predictions are being tallied!</p>
                </div>
              }

            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .leaderboard-page { max-width: 600px; margin: 0 auto; padding: 16px 16px 80px; }
    .page-title { color: #1a237e; margin: 0 0 8px; font-size: 18px; font-weight: 700; }

    .location-tabs { margin-top: 4px; }
    .tab-content { padding: 16px 0 0; }

    /* Your rank card */
    .your-rank-card {
      background: linear-gradient(135deg, #1a378b, #3f51b5);
      border-radius: 14px; padding: 16px 20px; margin-bottom: 20px;
      color: #fff; box-shadow: 0 4px 20px rgba(26,55,139,0.35);
    }
    .your-rank-label {
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.5px;
      opacity: 0.8; margin-bottom: 8px;
    }
    .your-rank-body { display: flex; align-items: center; gap: 16px; }
    .rank-number { font-size: 2rem; font-weight: 800; opacity: 0.95; }
    .your-rank-info { display: flex; flex-direction: column; }
    .your-rank-name { font-size: 1.1rem; font-weight: 600; }
    .your-rank-points { font-size: 0.9rem; opacity: 0.85; }

    /* Rank list */
    .rank-list { display: flex; flex-direction: column; gap: 6px; }
    .rank-row {
      display: flex; align-items: center; padding: 12px 16px;
      background: #f9f9fc; border-radius: 10px; transition: background 0.15s;
    }
    .rank-row:hover { background: #eef0f8; }
    .rank-row.is-current-user {
      background: linear-gradient(90deg, #e8eaf6, #c5cae9);
      font-weight: 600; border-left: 4px solid #1a378b;
    }
    .rank-pos { width: 44px; font-weight: 700; font-size: 0.95rem; color: #555; flex-shrink: 0; display: flex; align-items: center; }
    .medal { font-size: 1.4rem; }
    .rank-name { flex: 1; font-size: 0.95rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-pts { font-weight: 600; font-size: 0.9rem; color: #1a378b; flex-shrink: 0; }

    /* Empty */
    .empty-state { text-align: center; padding: 48px 16px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; display: block; margin: 0 auto; }
    .empty-state p { margin-top: 12px; font-size: 0.95rem; }

  `]
})
export class LeaderboardComponent implements OnInit {
  locations: LocationBoard[] = [
    { loc: 'TVM', label: 'TVM', leaderBoard: [] },
    { loc: 'Pune', label: 'Pune', leaderBoard: [] },
  ];
  loading = true;
  currentUserId = '';

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.currentUser?.userId || '';
    // Put the current user's location tab first
    const userLoc = this.auth.currentUser?.location || '';
    if (userLoc && this.locations[0].loc !== userLoc) {
      const idx = this.locations.findIndex(l => l.loc === userLoc);
      if (idx > 0) this.locations.unshift(...this.locations.splice(idx, 1));
    }

    let done = 0;
    const finish = () => { if (++done === this.locations.length) this.loading = false; };
    this.locations.forEach(loc => {
      this.api.getLeaderboard(loc.loc).subscribe({
        next: data => { loc.leaderBoard = data; finish(); },
        error: () => finish()
      });
    });
  }

  getUserRank(board: LeaderboardEntry[]): LeaderboardEntry | null {
    return board.find(e => e.userId === this.currentUserId) ?? null;
  }

  getMedal(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  }

}
