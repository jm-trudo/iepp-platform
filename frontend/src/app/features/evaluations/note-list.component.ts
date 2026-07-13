import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { EvaluationService } from '../../core/services/evaluation.service';
import { TeacherService } from '../../core/services/teacher.service';
import { Note, MATIERES, anneeScolaireCourante } from '../../core/models/evaluation.model';
import { Classe } from '../../core/models/classe.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <h2>Notes</h2>
      @if (auth.hasRole('ADMIN', 'INSTITUTEUR')) {
        <button mat-flat-button color="primary" (click)="allerVersSaisie()">
          <mat-icon>edit_note</mat-icon> Saisir des notes
        </button>
      }
    </div>

    <div class="barre-filtres">
      <mat-form-field appearance="outline">
        <mat-label>Classe</mat-label>
        <mat-select [(ngModel)]="classeId" (selectionChange)="charger()">
          <mat-option [value]="null">Toutes les classes</mat-option>
          @for (classe of classes(); track classe.id) {
            <mat-option [value]="classe.id">{{ classe.niveau_display }} {{ classe.libelle }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Matière</mat-label>
        <mat-select [(ngModel)]="matiere" (selectionChange)="charger()">
          <mat-option [value]="null">Toutes les matières</mat-option>
          @for (m of matieres; track m.value) {
            <mat-option [value]="m.value">{{ m.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement...</p>
      } @else if (notes().length === 0) {
        <p class="message-etat">Aucune note trouvée pour ces filtres.</p>
      } @else {
        <table mat-table [dataSource]="notes()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="eleve">
            <th mat-header-cell *matHeaderCellDef>Élève</th>
            <td mat-cell *matCellDef="let n">{{ n.eleve_nom }}</td>
          </ng-container>
          <ng-container matColumnDef="matiere">
            <th mat-header-cell *matHeaderCellDef>Matière</th>
            <td mat-cell *matCellDef="let n">{{ n.matiere_display }}</td>
          </ng-container>
          <ng-container matColumnDef="composition">
            <th mat-header-cell *matHeaderCellDef>Composition</th>
            <td mat-cell *matCellDef="let n">{{ n.composition_display }}</td>
          </ng-container>
          <ng-container matColumnDef="valeur">
            <th mat-header-cell *matHeaderCellDef>Note</th>
            <td mat-cell *matCellDef="let n">
              <span [class.note-faible]="n.valeur < 10" [class.note-bonne]="n.valeur >= 14">{{ n.valeur }}/20</span>
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
    .barre-filtres { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .barre-filtres mat-form-field { min-width: 220px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    .note-faible { color: #C62828; font-weight: 600; }
    .note-bonne { color: var(--iepp-vert); font-weight: 600; }
  `],
})
export class NoteListComponent implements OnInit {
  notes = signal<Note[]>([]);
  classes = signal<Classe[]>([]);
  chargement = signal(true);
  classeId: number | null = null;
  matiere: string | null = null;
  matieres = MATIERES;

  constructor(
    private evaluationService: EvaluationService,
    private teacherService: TeacherService,
    private router: Router,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.teacherService.listeClasses().subscribe((r) => this.classes.set(r.results));
    this.charger();
  }

  charger() {
    this.chargement.set(true);
    this.evaluationService.liste({
      classe: this.classeId ?? undefined,
      matiere: this.matiere ?? undefined,
      annee_scolaire: anneeScolaireCourante(),
    }).subscribe({
      next: (r) => { this.notes.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  colonnes = ['eleve', 'matiere', 'composition', 'valeur'];

  allerVersSaisie() {
    this.router.navigate(['/evaluations/saisie']);
  }
}