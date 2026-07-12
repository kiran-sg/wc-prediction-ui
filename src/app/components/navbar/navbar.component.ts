import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    @if (auth.isLoggedIn) {
      <mat-toolbar class="navbar">
        <img class="nav-logo" src="fifa-logo-white.png" alt="FIFA">
        <!-- Desktop nav -->
        <nav class="nav-links desktop-nav">
          @if (auth.isAdmin) {
            <a routerLink="/admin" routerLinkActive="active" class="nav-item">
              <mat-icon>shield</mat-icon>
              <span class="nav-label">Admin</span>
            </a>
          }
          <a routerLink="/home" routerLinkActive="active" class="nav-item">
            <mat-icon>sports_soccer</mat-icon>
            <span class="nav-label">Matches</span>
          </a>
          @if (!auth.isAdmin) {
            <a routerLink="/my-predictions" routerLinkActive="active" class="nav-item">
              <mat-icon>assignment</mat-icon>
              <span class="nav-label">My Picks</span>
            </a>
            <a routerLink="/tournament" routerLinkActive="active" class="nav-item">
              <mat-icon>emoji_events</mat-icon>
              <span class="nav-label">Tournament</span>
            </a>
          }
          <a routerLink="/leaderboard" routerLinkActive="active" class="nav-item">
            <mat-icon>leaderboard</mat-icon>
            <span class="nav-label">Leaderboard</span>
          </a>
        </nav>
        <span class="spacer"></span>
        <img class="rhythm-logo" src="rhythm.jpeg" alt="Rhythm">
        <!-- Desktop user menu -->
        <button class="nav-item user-btn desktop-nav" [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="user-info">
            <mat-icon>person</mat-icon>
            <span>{{ auth.currentUser?.name }}</span>
          </div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
        <!-- Mobile hamburger -->
        <button class="nav-item mobile-user-btn" [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <button class="nav-item mobile-menu-btn" (click)="toggleDrawer()">
          <mat-icon>menu</mat-icon>
        </button>
      </mat-toolbar>

      <!-- Mobile drawer overlay -->
      @if (drawerOpen) {
        <div class="drawer-overlay" (click)="closeDrawer()"
             (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)"></div>
      }

      <!-- Mobile drawer -->
      <div class="drawer" [class.open]="drawerOpen"
           (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
        <div class="drawer-header">
          <mat-icon>account_circle</mat-icon>
          <span>{{ auth.currentUser?.name }}</span>
        </div>
        <nav class="drawer-nav">
          @if (auth.isAdmin) {
            <a routerLink="/admin" routerLinkActive="active" class="drawer-item" (click)="closeDrawer()">
              <mat-icon>shield</mat-icon>
              <span>Admin</span>
            </a>
          }
          <a routerLink="/home" routerLinkActive="active" class="drawer-item" (click)="closeDrawer()">
            <mat-icon>sports_soccer</mat-icon>
            <span>Matches</span>
          </a>
          @if (!auth.isAdmin) {
            <a routerLink="/my-predictions" routerLinkActive="active" class="drawer-item" (click)="closeDrawer()">
              <mat-icon>assignment</mat-icon>
              <span>My Picks</span>
            </a>
            <a routerLink="/tournament" routerLinkActive="active" class="drawer-item" (click)="closeDrawer()">
              <mat-icon>emoji_events</mat-icon>
              <span>Tournament Predictions</span>
            </a>
          }
          <a routerLink="/leaderboard" routerLinkActive="active" class="drawer-item" (click)="closeDrawer()">
            <mat-icon>leaderboard</mat-icon>
            <span>Leaderboard</span>
          </a>
          <button class="drawer-item logout" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </nav>
      </div>
    }
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(135deg, #0d1b4a 0%, #1b3a8a 50%, #3f51b5 100%);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 0 12px;
      height: 72px;
      overflow: visible;
      display: flex;
      align-items: center;
    }
    .spacer { flex: 1; }
    .nav-logo { height: 24px; margin-right: 12px; }
    .rhythm-logo { height: 60px; width: auto; object-fit: contain; margin-right: 8px; }
    @media (max-width: 768px) {
      .navbar { height: 60px; }
      .rhythm-logo { height: 48px; }
      .nav-logo { height: 20px; }
    }
    @media (max-width: 400px) {
      .navbar { height: 56px; }
      .rhythm-logo { height: 42px; }
    }
    .nav-links { display: flex; align-items: center; gap: 4px; }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 6px 12px; border-radius: 12px; cursor: pointer;
      color: rgba(255,255,255,0.75); text-decoration: none;
      transition: all 0.2s ease; border: none; background: none;
      line-height: 1;
    }
    .nav-item:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .nav-item.active { color: #fff; background: rgba(255,255,255,0.18); }
    .nav-label { font-size: 10px; margin-top: 2px; font-weight: 500; }
    .user-btn { color: rgba(255,255,255,0.85); }
    .user-btn:hover { color: #fff; }
    .user-info {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; font-weight: 500; color: #333;
      border-bottom: 1px solid #eee;
    }
    mat-icon { font-size: 22px; width: 22px; height: 22px; }

    /* Mobile menu button - hidden on desktop */
    .mobile-menu-btn { display: none; margin-left: 4px; }
    .mobile-user-btn { display: none; margin-left: auto; color: rgba(255,255,255,0.85); }

    /* Drawer */
    .drawer-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1100;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 260px;
      background: #fff; z-index: 1200;
      transform: translateX(100%); transition: transform 0.3s ease;
      box-shadow: -4px 0 20px rgba(0,0,0,0.2);
      display: none;
    }
    .drawer.open { transform: translateX(0); }
    .drawer-header {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 16px; background: linear-gradient(135deg, #0d1b4a, #3f51b5);
      color: #fff; font-weight: 500; font-size: 16px;
    }
    .drawer-header mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .drawer-nav { display: flex; flex-direction: column; padding: 8px 0; }
    .drawer-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px; text-decoration: none; color: #333;
      border: none; background: none; cursor: pointer; font-size: 15px;
      transition: background 0.15s;
    }
    .drawer-item:hover { background: #f5f5f5; }
    .drawer-item.active { color: #1a237e; background: #e8eaf6; font-weight: 500; }
    .drawer-item.logout { color: #d32f2f; margin-top: 16px; border-top: 1px solid #eee; padding-top: 16px; }

    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .mobile-menu-btn { display: flex; }
      .mobile-user-btn { display: flex; }
      .drawer { display: block; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  drawerOpen = false;
  private touchStartX = 0;
  private touchStartY = 0;

  constructor(public auth: AuthService) {}

  ngOnInit(): void {}

  toggleDrawer(): void {
    this.drawerOpen = !this.drawerOpen;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - this.touchStartY);
    // Swipe right to close (min 60px horizontal, less than 40px vertical)
    if (deltaX > 60 && deltaY < 40) {
      this.closeDrawer();
    }
  }

  // Swipe left from right edge to open
  @HostListener('document:touchstart', ['$event'])
  onDocTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  @HostListener('document:touchend', ['$event'])
  onDocTouchEnd(e: TouchEvent): void {
    if (this.drawerOpen) return;
    const screenWidth = window.innerWidth;
    // Only trigger if swipe started from right 30px edge
    if (this.touchStartX < screenWidth - 30) return;
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - this.touchStartY);
    if (deltaX < -60 && deltaY < 40) {
      this.drawerOpen = true;
    }
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}
