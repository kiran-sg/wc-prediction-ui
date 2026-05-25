import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="text-center mb-16">
          <span class="login-icon"><img src="fifa-logo-white.png" alt="FIFA" class="fifa-logo"></span>
          <h2>WORLD CUP 2026</h2>
          <p class="subtitle">Prediction Contest</p>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>User ID</mat-label>
          <input matInput [(ngModel)]="userId" (keyup.enter)="login()"
                 autocomplete="username" maxlength="30">
        </mat-form-field>
        <button mat-raised-button color="primary" class="full-width login-btn"
                [disabled]="!userId.trim() || loading" (click)="login()">
          {{ loading ? 'Logging in...' : 'Enter' }}
        </button>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 16px;
      background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
        url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat;
    }
    @media (max-width: 768px) {
      .login-container {
        background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
          url('https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=800&q=80') center/cover no-repeat;
      }
    }
    .login-card { max-width: 360px; width: 100%; padding: 32px 24px; border-radius: 16px !important; }
    .login-icon { display: block; background: #1a237e; border-radius: 12px; padding: 12px; display: inline-block; }
    .fifa-logo { width: 80px; display: block; }
    h2 { margin: 8px 0 0; color: #1a237e; }
    .subtitle { color: #666; margin: 4px 0 24px; }
    .login-btn { height: 48px; font-size: 16px; }
  `]
})
export class LoginComponent {
  userId = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router, private snackBar: MatSnackBar) {
    if (auth.isLoggedIn) this.router.navigate(['/home']);
  }

  login(): void {
    if (!this.userId.trim()) return;
    this.loading = true;
    this.auth.login(this.userId.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.validUser) {
          this.router.navigate(['/home']);
        } else {
          this.snackBar.open('Invalid User ID', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Connection error', 'OK', { duration: 3000 });
      }
    });
  }
}
