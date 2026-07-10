import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar class="iepp-topbar">
      <span>Plateforme IEPP</span>
      <span class="espace"></span>
      @if (auth.currentUser(); as user) {
        <span class="info-utilisateur">
          {{ user.first_name }} {{ user.last_name }} — {{ user.role_display }}
        </span>
      }
      <button mat-button (click)="auth.logout()">Déconnexion</button>
    </mat-toolbar>

    <div class="contenu-dashboard">
      <h2>Tableau de bord</h2>

      @if (stats(); as s) {
        <div class="grille-stats">
          <div class="iepp-carte"><span class="valeur">{{ s.statistiques_generales.nombre_ecoles }}</span><span>Écoles</span></div>
          <div class="iepp-carte"><span class="valeur">{{ s.statistiques_generales.nombre_enseignants }}</span><span>Enseignants</span></div>
          <div class="iepp-carte"><span class="valeur">{{ s.statistiques_generales.nombre_eleves }}</span><span>Élèves</span></div>
          <div class="iepp-carte"><span class="valeur">{{ s.statistiques_generales.nombre_classes }}</span><span>Classes</span></div>
          <div class="iepp-carte"><span class="valeur">{{ s.statistiques_generales.nombre_demandes_en_attente }}</span><span>Demandes en attente</span></div>
        </div>
      } @else {
        <p>Chargement des statistiques...</p>
      }
    </div>
  `,
  styles: [`
    .espace { flex: 1; }
    .info-utilisateur { margin-right: 16px; font-size: 0.9em; }
    .contenu-dashboard { padding: 24px; }
    .grille-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .grille-stats .iepp-carte {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .valeur { font-size: 2em; font-weight: bold; color: var(--iepp-orange); }
  `],
})
export class DashboardComponent implements OnInit {
  stats = signal<any>(null);

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit() {
    // Le dashboard complet est réservé à Admin/Chef IEPP côté backend (Section 10) ;
    // les autres rôles verront un 403, géré ici de façon simple pour l'instant.
    this.http.get(`${environment.apiUrl}/reports/dashboard/`).subscribe({
      next: (donnees) => this.stats.set(donnees),
      error: () => this.stats.set({ statistiques_generales: { nombre_ecoles: '—', nombre_enseignants: '—', nombre_eleves: '—', nombre_classes: '—', nombre_demandes_en_attente: '—' } }),
    });
  }
}