import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { VersionCheckService } from './services/version-check.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar />
    <router-outlet />
  `,
  styles: [`:host { display: block; }`]
})
export class AppComponent implements OnInit {
  constructor(private versionCheck: VersionCheckService) {}

  ngOnInit(): void {
    this.versionCheck.startChecking();
  }
}
