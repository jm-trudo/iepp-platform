import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { AuthService } from '../../core/services/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatChipsModule],
  template: `
    <h2>Tableau de bord</h2>

    @if (!auth.hasRole('ADMIN', 'CHEF_IEPP')) {
      <!-- Vue simplifiée pour les autres rôles -->
      <mat-card class="iepp-carte carte-bienvenue">
        <mat-icon class="icone-bienvenue">waving_hand</mat-icon>
        <h3>Bienvenue, {{ auth.currentUser()?.first_name || auth.currentUser()?.username }}</h3>
        <p>Utilisez le menu à gauche pour accéder aux modules disponibles pour votre rôle.</p>
      </mat-card>
    } @else if (chargement()) {
      <p class="message-etat">Chargement des statistiques...</p>
    } @else if (donnees(); as d) {

      <div class="grille-stats">
        <div class="iepp-carte carte-stat"><mat-icon>apartment</mat-icon><span class="valeur">{{ d.statistiques_generales.nombre_ecoles }}</span><span>Écoles</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>school</mat-icon><span class="valeur">{{ d.statistiques_generales.nombre_enseignants }}</span><span>Enseignants</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>groups</mat-icon><span class="valeur">{{ d.statistiques_generales.nombre_eleves }}</span><span>Élèves</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>meeting_room</mat-icon><span class="valeur">{{ d.statistiques_generales.nombre_classes }}</span><span>Classes</span></div>
        <div class="iepp-carte carte-stat"><mat-icon>assignment_late</mat-icon><span class="valeur">{{ d.statistiques_generales.nombre_demandes_en_attente }}</span><span>Demandes en attente</span></div>
      </div>

      <div class="grille-double">
        <mat-card class="iepp-carte">
          <h3 class="titre-carte">Moyennes par matière</h3>
          @if (d.moyennes_par_matiere.length === 0) {
            <p class="message-vide">Aucune note enregistrée pour le moment.</p>
          } @else {
            <canvas #graphiqueMatieres></canvas>
          }
        </mat-card>

        <mat-card class="iepp-carte">
          <h3 class="titre-carte">Analyse pédagogique</h3>

          @if (d.analyse_pedagogique.points_forts.length > 0) {
            <div class="section-analyse">
              <span class="etiquette-section etiquette-forte">Points forts</span>
              <div class="puces-matieres">
                @for (m of d.analyse_pedagogique.points_forts; track m.matiere) {
                  <mat-chip class="puce-forte">{{ m.matiere_display }} — {{ m.moyenne }}/20</mat-chip>
                }
              </div>
            </div>
          }

          @if (d.analyse_pedagogique.matieres_faibles.length > 0) {
            <div class="section-analyse">
              <span class="etiquette-section etiquette-faible">À renforcer</span>
              <div class="puces-matieres">
                @for (m of d.analyse_pedagogique.matieres_faibles; track m.matiere) {
                  <mat-chip class="puce-faible">{{ m.matiere_display }} — {{ m.moyenne }}/20</mat-chip>
                }
              </div>
            </div>
          }

          <div class="section-analyse">
            <span class="etiquette-section">Commentaires</span>
            <ul class="liste-commentaires">
              @for (commentaire of d.analyse_pedagogique.commentaires; track commentaire) {
                <li>{{ commentaire }}</li>
              }
            </ul>
          </div>
        </mat-card>
      </div>

      <div class="grille-triple">
        <mat-card class="iepp-carte">
          <h3 class="titre-carte">Top élèves</h3>
          @if (d.classement_eleves.length === 0) {
            <p class="message-vide">Aucun classement disponible.</p>
          } @else {
            <table class="tableau-classement">
              <tbody>
                @for (e of d.classement_eleves.slice(0, 10); track e.eleve_id; let i = $index) {
                  <tr>
                    <td class="rang">{{ i + 1 }}</td>
                    <td>{{ e.nom }} {{ e.prenoms }}<span class="sous-texte">{{ e.ecole }}</span></td>
                    <td class="moyenne" [class.note-bonne]="e.moyenne! >= 14">{{ e.moyenne }}/20</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </mat-card>

        <mat-card class="iepp-carte">
          <h3 class="titre-carte">Classement des classes</h3>
          @if (d.classement_classes.length === 0) {
            <p class="message-vide">Aucun classement disponible.</p>
          } @else {
            <table class="tableau-classement">
              <tbody>
                @for (c of d.classement_classes.slice(0, 10); track c.classe_id; let i = $index) {
                  <tr>
                    <td class="rang">{{ i + 1 }}</td>
                    <td>{{ c.niveau }} {{ c.libelle }}<span class="sous-texte">{{ c.ecole }}</span></td>
                    <td class="moyenne" [class.note-bonne]="c.moyenne! >= 14">{{ c.moyenne }}/20</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </mat-card>

        <mat-card class="iepp-carte">
          <h3 class="titre-carte">Classement des écoles</h3>
          @if (d.classement_ecoles.length === 0) {
            <p class="message-vide">Aucun classement disponible.</p>
          } @else {
            <table class="tableau-classement">
              <tbody>
                @for (ec of d.classement_ecoles; track ec.ecole_id; let i = $index) {
                  <tr>
                    <td class="rang">{{ i + 1 }}</td>
                    <td>{{ ec.ecole_nom }}</td>
                    <td class="moyenne" [class.note-bonne]="ec.moyenne! >= 14">{{ ec.moyenne }}/20</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .carte-bienvenue {
      text-align: center;
      padding: 48px 24px;
      max-width: 500px;
      margin: 40px auto;
    }
    .icone-bienvenue { font-size: 48px; width: 48px; height: 48px; color: var(--iepp-orange); }

    .message-etat, .message-vide { text-align: center; color: #757575; padding: 24px; }

    .grille-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .carte-stat {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 6px; padding: 20px;
    }
    .carte-stat mat-icon { color: var(--iepp-orange); font-size: 32px; width: 32px; height: 32px; }
    .valeur { font-size: 2em; font-weight: bold; color: var(--iepp-orange); }

    .grille-double {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .grille-triple {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 900px) {
      .grille-double, .grille-triple { grid-template-columns: 1fr; }
    }

    .titre-carte { color: var(--iepp-orange); margin: 0 0 12px; font-size: 1em; }

    .section-analyse { margin-bottom: 16px; }
    .etiquette-section {
      display: block;
      font-size: 0.8em;
      text-transform: uppercase;
      color: #9E9E9E;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .puces-matieres { display: flex; flex-wrap: wrap; gap: 6px; }
    mat-chip.puce-forte { background: var(--iepp-vert-clair); color: var(--iepp-vert); }
    mat-chip.puce-faible { background: #FFEBEE; color: #C62828; }
    .liste-commentaires { margin: 0; padding-left: 18px; color: #424242; font-size: 0.92em; }
    .liste-commentaires li { margin-bottom: 4px; }

    .tableau-classement { width: 100%; border-collapse: collapse; }
    .tableau-classement td { padding: 8px 6px; border-bottom: 1px solid #F0F0F0; font-size: 0.9em; }
    .rang { font-weight: bold; color: var(--iepp-orange); width: 24px; }
    .sous-texte { display: block; font-size: 0.8em; color: #9E9E9E; }
    .moyenne { text-align: right; font-weight: 600; color: #C62828; }
    .moyenne.note-bonne { color: var(--iepp-vert); }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('graphiqueMatieres') graphiqueRef?: ElementRef<HTMLCanvasElement>;

  donnees = signal<DashboardData | null>(null);
  chargement = signal(true);
  private graphique?: Chart;

  constructor(private dashboardService: DashboardService, public auth: AuthService) {}

  ngOnInit() {
    if (!this.auth.hasRole('ADMIN', 'CHEF_IEPP')) {
      this.chargement.set(false);
      return;
    }
    this.dashboardService.obtenir().subscribe({
      next: (d) => {
        this.donnees.set(d);
        this.chargement.set(false);
        setTimeout(() => this.dessinerGraphique());
      },
      error: () => this.chargement.set(false),
    });
  }

  ngAfterViewInit() {
    this.dessinerGraphique();
  }

  private dessinerGraphique() {
    const donnees = this.donnees();
    if (!donnees || !this.graphiqueRef || donnees.moyennes_par_matiere.length === 0) return;

    if (this.graphique) this.graphique.destroy();

    this.graphique = new Chart(this.graphiqueRef.nativeElement, {
      type: 'bar',
      data: {
        labels: donnees.moyennes_par_matiere.map((m) => m.matiere_display),
        datasets: [{
          label: 'Moyenne /20',
          data: donnees.moyennes_par_matiere.map((m) => m.moyenne ?? 0),
          backgroundColor: donnees.moyennes_par_matiere.map((m) =>
            (m.moyenne ?? 0) >= 14 ? '#2E7D32' : (m.moyenne ?? 0) < 10 ? '#C62828' : '#E07B00'
          ),
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, max: 20 } },
      },
    });
  }
}