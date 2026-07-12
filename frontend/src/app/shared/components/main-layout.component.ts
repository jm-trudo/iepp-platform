import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="conteneur-principal">
      <mat-sidenav mode="side" opened class="menu-lateral">
        <div class="entete-menu">
          <mat-icon class="icone-logo">school</mat-icon>
          <span class="titre-app">Plateforme IEPP</span>
        </div>

        <mat-nav-list>
          @for (item of menus(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="lien-actif">
              <mat-icon matListItemIcon>{{ item.icone }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="iepp-topbar barre-superieure">
          <span class="espace"></span>

          @if (auth.currentUser(); as user) {
            <button mat-button [matMenuTriggerFor]="menuUtilisateur" class="bouton-utilisateur">
              <mat-icon>account_circle</mat-icon>
              {{ user.first_name || user.username }}
              <span class="badge-role">{{ user.role_display }}</span>
            </button>
            <mat-menu #menuUtilisateur="matMenu">
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon>
                <span>Déconnexion</span>
              </button>
            </mat-menu>
          }
        </mat-toolbar>

        <div class="contenu-page">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .conteneur-principal { height: 100vh; }

    .menu-lateral {
      width: 240px;
      background: var(--iepp-blanc);
      border-right: 1px solid #E0E0E0;
    }

    .entete-menu {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      background: var(--iepp-orange);
      color: white;
    }
    .icone-logo { font-size: 28px; width: 28px; height: 28px; }
    .titre-app { font-weight: 600; font-size: 1.05em; }

    .lien-actif {
      background: var(--iepp-orange-clair) !important;
      color: var(--iepp-orange) !important;
      border-right: 3px solid var(--iepp-orange);
    }
    .lien-actif mat-icon { color: var(--iepp-orange) !important; }

    .barre-superieure {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .espace { flex: 1; }
    .bouton-utilisateur {
      display: flex;
      align-items: center;
      gap: 6px;
      color: white;
    }
    .badge-role {
      font-size: 0.75em;
      background: rgba(255,255,255,0.25);
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 6px;
    }

    .contenu-page {
      padding: 24px;
      background: #FAFAFA;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 768px) {
      .menu-lateral { width: 200px; }
      .titre-app { font-size: 0.9em; }
      .contenu-page { padding: 12px; }
    }
  `],
})
export class MainLayoutComponent {
  menus = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.navigation.menusPourRole(user.role) : [];
  });

  constructor(public auth: AuthService, private navigation: NavigationService) {}
}