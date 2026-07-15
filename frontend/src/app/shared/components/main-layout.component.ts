import { Component, computed, signal } from '@angular/core';
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
import { CirconscriptionService } from '../../core/services/circonscription.service';
import { OnInit } from '@angular/core';

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
      <mat-sidenav #sidenav [mode]="modeMenu()" [opened]="menuOuvert()" class="menu-lateral">
      <div class="entete-menu">
          @if (logoCirconscription()) {
            <img [src]="logoCirconscription()" alt="Logo" class="logo-circonscription" />
        } @else {
          <mat-icon class="icone-logo">school</mat-icon>
        }
        <span class="titre-app">{{ nomCirconscription() || 'Plateforme IEPP' }}</span>
      </div>

        <mat-nav-list>
          @for (item of menus(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="lien-actif" (click)="fermerSiMobile()">
              <mat-icon matListItemIcon>{{ item.icone }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="iepp-topbar barre-superieure">
          @if (estMobile()) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="espace"></span>

          @if (auth.currentUser(); as user) {
            <button mat-button [matMenuTriggerFor]="menuUtilisateur" class="bouton-utilisateur">
              <mat-icon>account_circle</mat-icon>
              <span class="nom-utilisateur">{{ user.first_name || user.username }}</span>
              <span class="badge-role">{{ auth.getRoleLabel() }}</span>
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
      .menu-lateral { width: 220px; }
      .titre-app { font-size: 0.9em; }
      .contenu-page { padding: 12px; }
      .nom-utilisateur { display: none; }
      .badge-role { display: none; }
    }

    @media (max-width: 480px) {
      .contenu-page { padding: 8px; }
    }
      .logo-circonscription {
            width: 28px; height: 28px;
            object-fit: contain;
            border-radius: 4px;
            background: white;
            padding: 2px;
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  menus = computed(() => {
    const user = this.auth.currentUser();
    return user ? this.navigation.menusPourRole(user.role) : [];
  });

  logoCirconscription = signal<string | null>(null);
  nomCirconscription = signal<string | null>(null);

  estMobile = signal(window.innerWidth < 768);
  modeMenu = computed(() => (this.estMobile() ? 'over' : 'side'));
  menuOuvert = computed(() => !this.estMobile());

  constructor(
    public auth: AuthService,
    private navigation: NavigationService,
    private circonscriptionService: CirconscriptionService,
  ) {
    window.addEventListener('resize', () => {
      this.estMobile.set(window.innerWidth < 768);
    });
  }

  ngOnInit() {
    this.circonscriptionService.maCirconscription().subscribe({
      next: (c) => {
        this.logoCirconscription.set(c.logo);
        this.nomCirconscription.set(c.nom);
      },
      error: () => {
        // Admin ou compte sans circonscription : garde l'icône par défaut, silencieux.
      },
    });
  }

  fermerSiMobile() {}
}