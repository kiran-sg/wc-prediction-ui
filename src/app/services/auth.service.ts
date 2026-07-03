import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { WcUser } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<WcUser | null>(this.getStoredUser());
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUser(): WcUser | null {
    return this.userSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.isAdmin ?? false;
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.isSuperAdmin ?? false;
  }

  login(userId: string): Observable<{ validUser: boolean; user: WcUser; message: string }> {
    return this.http.post<{ validUser: boolean; user: WcUser; message: string }>(
      `${environment.apiUrl}/users/validate`,
      { userId }
    ).pipe(
      tap(res => {
        if (res.validUser) {
          sessionStorage.setItem('wc_user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('wc_user');
    this.userSubject.next(null);
  }

  private getStoredUser(): WcUser | null {
    const stored = sessionStorage.getItem('wc_user');
    return stored ? JSON.parse(stored) : null;
  }
}
