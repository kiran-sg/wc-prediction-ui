import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LeaderboardEntry } from '../../models/models';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="container">
      <h3>🏆 Leaderboard</h3>
      @for (entry of leaderboard; track entry.userId; let i = $index) {
        <mat-card class="lb-card" [class.me]="entry.userId === auth.currentUser?.userId">
          <div class="rank">
            @if (entry.position === 1) { 🥇 }
            @else if (entry.position === 2) { 🥈 }
            @else if (entry.position === 3) { 🥉 }
            @else { {{ entry.position }} }
          </div>
          <div class="info">
            <span class="name">{{ entry.userName }}</span>
            <span class="location">{{ entry.location }}</span>
          </div>
          <div class="points">{{ entry.totalPoints }} pts</div>
        </mat-card>
      }
      @if (!loading && leaderboard.length === 0) {
        <div class="text-center mt-16">No predictions scored yet.</div>
      }
    </div>
  `,
  styles: [`
    h3 { color: #1a237e; margin: 0 0 16px; }
    .lb-card {
      display: flex; align-items: center; padding: 12px 16px; gap: 12px;
    }
    .lb-card.me { border-left: 4px solid #1a237e; background: #e8eaf6; }
    .rank { font-size: 20px; min-width: 36px; text-align: center; }
    .info { flex: 1; display: flex; flex-direction: column; }
    .name { font-weight: 500; font-size: 15px; }
    .location { font-size: 12px; color: #666; }
    .points { font-weight: 700; font-size: 16px; color: #1a237e; }
  `]
})
export class LeaderboardComponent implements OnInit {
  leaderboard: LeaderboardEntry[] = [];
  loading = true;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    const location = this.auth.currentUser?.location || '';
    this.api.getLeaderboard(location).subscribe({
      next: (data) => { this.leaderboard = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
