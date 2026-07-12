import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <h2>Tableau de bord</h2>

    @if (stats(); as s) {
      <div class="grille-stats">
        <div class="iepp-carte carte-stat"><mat-icon>apartment</mat-icon><span class="valeur">{{ s.statistiques_generales.nombre_ecoles }}</span><span>Écoles</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>school</mat-icon><span class="valeur">{{ s.statistiques_generales.nombre_enseignants }}</span><span>Enseignants</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>groups</mat-icon><span class="valeur">{{ s.statistiques_generales.nombre_eleves }}</span><span>Élèves</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>meeting_room</mat-icon><span class="valeur">{{ s.statistiques_generales.nombre_classes }}</span><span>Classes</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>assignment_late</mat-icon><span class="valeur">{{ s.statistiques_generales.nombre_demandes_en_attente }}</span><span>Demandes en attente</span></div>
      </div>
    } @else {
      <p>Chargement des statistiques...</p>
    }
  `,
  styles: [`
    .grille-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    .carte-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 6px;
      padding: 20px;
    }
    .carte-stat mat-icon { color: var(--iepp-orange); font-size: 32px; width: 32px; height: 32px; }
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