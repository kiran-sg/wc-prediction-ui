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

              <!-- Podium: Top 3 -->
              @if (getTop3(loc.leaderBoard).length > 0) {
                <div class="podium">
                  @for (entry of getTop3(loc.leaderBoard); track entry.userId) {
                    <div class="podium-item rank-{{ entry.position }}"
                         [class.is-current-user]="entry.userId === currentUserId">
                      <div class="podium-medal">{{ getMedal(entry.position) }}</div>
                      <div class="podium-bar">
                        <span class="podium-name">{{ entry.userName }}</span>
                        <span class="podium-points">{{ entry.totalPoints }} pts</span>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Rest of board -->
              @if (getRest(loc.leaderBoard).length > 0) {
                <div class="rank-list">
                  @for (entry of getRest(loc.leaderBoard); track entry.userId) {
                    <div class="rank-row" [class.is-current-user]="entry.userId === currentUserId">
                      <span class="rank-pos">#{{ entry.position }}</span>
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
    .medal.large { font-size: 2.4rem; }
    .rank-number { font-size: 2rem; font-weight: 800; opacity: 0.95; }
    .your-rank-info { display: flex; flex-direction: column; }
    .your-rank-name { font-size: 1.1rem; font-weight: 600; }
    .your-rank-points { font-size: 0.9rem; opacity: 0.85; }

    /* Podium */
    .podium {
      display: flex; justify-content: center; align-items: flex-end;
      gap: 12px; margin-bottom: 24px; padding: 0 8px;
    }
    .podium-item {
      display: flex; flex-direction: column; align-items: center;
      flex: 1; max-width: 130px; transition: transform 0.2s;
    }
    .podium-item:hover { transform: translateY(-4px); }
    .podium-medal { font-size: 2.2rem; margin-bottom: 6px; }
    .podium-bar {
      width: 100%; border-radius: 12px 12px 8px 8px;
      padding: 14px 8px 12px; display: flex; flex-direction: column;
      align-items: center; gap: 4px; text-align: center;
    }
    .rank-1 .podium-bar {
      background: linear-gradient(180deg, #ffd700 0%, #f5c842 100%);
      color: #3e2c00; min-height: 70px; box-shadow: 0 4px 16px rgba(255,215,0,0.4);
    }
    .rank-2 .podium-bar {
      background: linear-gradient(180deg, #c0c0c0 0%, #a8a8a8 100%);
      color: #333; min-height: 58px; box-shadow: 0 4px 12px rgba(192,192,192,0.4);
    }
    .rank-3 .podium-bar {
      background: linear-gradient(180deg, #cd7f32 0%, #b8722e 100%);
      color: #fff; min-height: 48px; box-shadow: 0 4px 12px rgba(205,127,50,0.4);
    }
    .podium-name { font-weight: 700; font-size: 0.9rem; word-break: break-word; }
    .podium-points { font-size: 0.85rem; font-weight: 600; opacity: 0.85; }
    .podium-item.is-current-user .podium-bar { outline: 3px solid #1a378b; outline-offset: 2px; }

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
    .rank-pos { width: 44px; font-weight: 700; font-size: 0.95rem; color: #555; flex-shrink: 0; }
    .rank-name { flex: 1; font-size: 0.95rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-pts { font-weight: 600; font-size: 0.9rem; color: #1a378b; flex-shrink: 0; }

    /* Empty */
    .empty-state { text-align: center; padding: 48px 16px; color: #888; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; display: block; margin: 0 auto; }
    .empty-state p { margin-top: 12px; font-size: 0.95rem; }

    @media (max-width: 480px) {
      .podium-medal { font-size: 1.6rem; }
      .podium-bar { padding: 10px 6px; }
      .podium-name { font-size: 0.75rem; }
      .rank-1 .podium-bar { min-height: 90px; }
      .rank-2 .podium-bar { min-height: 74px; }
      .rank-3 .podium-bar { min-height: 60px; }
    }
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

  getTop3(board: LeaderboardEntry[]): LeaderboardEntry[] {
    return board.filter(e => e.position <= 3);
  }

  getRest(board: LeaderboardEntry[]): LeaderboardEntry[] {
    return board.filter(e => e.position > 3);
  }
}
