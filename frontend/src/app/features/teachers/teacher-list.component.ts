import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../core/services/teacher.service';
import { Teacher } from '../../core/models/teacher.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="entete-page">
      <h2>Enseignants</h2>
      @if (auth.hasRole('ADMIN', 'CHEF_IEPP', 'DIRECTEUR')) {
        <button mat-flat-button color="primary" (click)="allerVersFormulaire()">
          <mat-icon>add</mat-icon> Nouvel enseignant
        </button>
      }
    </div>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement...</p>
      } @else if (enseignants().length === 0) {
        <p class="message-etat">Aucun enseignant trouvé.</p>
      } @else {
        <table mat-table [dataSource]="enseignants()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let e">{{ e.first_name }} {{ e.last_name }}</td>
          </ng-container>
          <ng-container matColumnDef="matricule">
            <th mat-header-cell *matHeaderCellDef>Matricule</th>
            <td mat-cell *matCellDef="let e">{{ e.matricule || '—' }}</td>
          </ng-container>
         <ng-container matColumnDef="ecole">
  <th mat-header-cell *matHeaderCellDef>École / Classe</th>
  <td mat-cell *matCellDef="let e">
    @if (e.profile?.ecole_nom) {
      {{ e.profile.ecole_nom }} — {{ e.profile.classe_display || 'Aucune classe' }}
    } @else {
      <span class="non-affecte">Non affecté</span>
    }
  </td>
         </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button (click)="allerVersFormulaire(e.id)"><mat-icon>edit</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
          <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    .non-affecte { color: #9E9E9E; font-style: italic; }
  `],
})
export class TeacherListComponent implements OnInit {
  enseignants = signal<Teacher[]>([]);
  chargement = signal(true);
  colonnes = ['nom', 'matricule', 'ecole', 'actions'];

  constructor(private teacherService: TeacherService, private router: Router, private snackBar: MatSnackBar, public auth: AuthService) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.chargement.set(true);
    this.teacherService.listeEnseignants().subscribe({
      next: (r) => { this.enseignants.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  allerVersFormulaire(id?: number) {
    this.router.navigate(id ? ['/teachers', id] : ['/teachers/nouveau']);
  }
}