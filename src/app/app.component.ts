import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { VersionCheckService } from './services/version-check.service';
import { AuthService } from './services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before logout

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, MatSnackBarModule],
  template: `
    <app-navbar />
    <router-outlet />
  `,
  styles: [`:host { display: block; }`]
})
export class AppComponent implements OnInit, OnDestroy {
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private versionCheck: VersionCheckService,
    private auth: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.versionCheck.startChecking();
    this.resetTimer();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  @HostListener('document:mousemove')
  @HostListener('document:keydown')
  @HostListener('document:click')
  @HostListener('document:touchstart')
  onUserActivity(): void {
    this.resetTimer();
  }

  private resetTimer(): void {
    this.clearTimers();
    if (!this.auth.isLoggedIn) return;

    // Warning snackbar 2 min before logout
    this.warningTimer = setTimeout(() => {
      const ref = this.snackBar.open(
        'You will be logged out in 2 minutes due to inactivity.',
        'Stay Logged In',
        { duration: WARNING_BEFORE_MS, panelClass: 'inactivity-snack' }
      );
      ref.onAction().subscribe(() => this.resetTimer());
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Actual logout
    this.inactivityTimer = setTimeout(() => {
      this.snackBar.dismiss();
      this.auth.logout();
      window.location.href = '/login';
    }, INACTIVITY_TIMEOUT_MS);
  }

  private clearTimers(): void {
    if (this.inactivityTimer) { clearTimeout(this.inactivityTimer); this.inactivityTimer = null; }
    if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null; }
  }
}
