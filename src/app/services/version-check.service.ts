import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VersionCheckService implements OnDestroy {
  private intervalId: any;
  private backendVersion: string | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  startChecking(): void {
    this.checkBackendVersion();
    // Poll every 30 seconds
    this.intervalId = setInterval(() => this.checkBackendVersion(), 30000);

    // Check UI version on visibility change (user returns to tab)
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.auth.isLoggedIn) {
      this.checkUIVersion();
      this.checkBackendVersion();
    }
  };

  private checkBackendVersion(): void {
    if (!this.auth.isLoggedIn) return;
    this.http.get<{ version: string }>(`${environment.apiUrl}/health`).subscribe({
      next: (res) => {
        if (this.backendVersion && this.backendVersion !== res.version) {
          this.forceLogout();
        }
        this.backendVersion = res.version;
      },
      error: () => {} // backend down, ignore
    });
  }

  private checkUIVersion(): void {
    // Fetch index.html to detect if bundle hashes changed
    this.http.get('/index.html', { responseType: 'text' }).subscribe({
      next: (html) => {
        const storedHash = sessionStorage.getItem('wc_ui_hash');
        const currentHash = this.hashCode(html);
        if (storedHash && storedHash !== currentHash) {
          this.forceLogout();
        }
        sessionStorage.setItem('wc_ui_hash', currentHash);
      }
    });
  }

  private forceLogout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}
