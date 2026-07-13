import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StudentService } from '../../core/services/student.service';
import { TeacherService } from '../../core/services/teacher.service';
import { EvaluationService } from '../../core/services/evaluation.service';
import { Student } from '../../core/models/student.model';
import { Classe } from '../../core/models/classe.model';
import { MATIERES, COMPOSITIONS, anneeScolaireCourante } from '../../core/models/evaluation.model';

interface LigneSaisie {
  eleve: Student;
  valeur: number | null;
}

@Component({
  selector: 'app-note-entry',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <h2>Saisie des notes</h2>

    <mat-card class="iepp-carte carte-filtres">
      <div class="ligne-filtres">
        <mat-form-field appearance="outline">
          <mat-label>Classe</mat-label>
          <mat-select [(ngModel)]="classeId" (selectionChange)="chargerEleves()">
            @for (classe of classes(); track classe.id) {
              <mat-option [value]="classe.id">{{ classe.niveau_display }} {{ classe.libelle }} — {{ classe.ecole_nom }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Matière</mat-label>
          <mat-select [(ngModel)]="matiere" (selectionChange)="chargerNotesExistantes()">
            @for (m of matieres; track m.value) {
              <mat-option [value]="m.value">{{ m.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Composition</mat-label>
          <mat-select [(ngModel)]="composition" (selectionChange)="chargerNotesExistantes()">
            @for (c of compositions; track c.value) {
              <mat-option [value]="c.value">{{ c.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Année scolaire</mat-label>
          <input matInput [(ngModel)]="anneeScolaire" (change)="chargerNotesExistantes()" />
        </mat-form-field>
      </div>
    </mat-card>

    @if (!classeId) {
      <div class="iepp-carte message-etat">
        <mat-icon>info</mat-icon>
        <p>Sélectionnez une classe pour commencer la saisie.</p>
      </div>
    } @else if (chargement()) {
      <div class="iepp-carte message-etat"><p>Chargement des élèves...</p></div>
    } @else if (lignes().length === 0) {
      <div class="iepp-carte message-etat"><p>Aucun élève dans cette classe.</p></div>
    } @else {
      <mat-card class="iepp-carte carte-saisie">
        <table class="tableau-saisie">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Note / 20</th>
            </tr>
          </thead>
          <tbody>
            @for (ligne of lignes(); track ligne.eleve.id) {
              <tr>
                <td>{{ ligne.eleve.nom }} {{ ligne.eleve.prenoms }}</td>
                <td>
                  <mat-form-field appearance="outline" class="champ-note">
                    <input
                      matInput type="number" min="0" max="20" step="0.5"
                      [(ngModel)]="ligne.valeur"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </mat-form-field>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="actions-saisie">
          <span class="compteur-rempli">{{ nombreRemplies() }} / {{ lignes().length }} notes saisies</span>
          <button mat-flat-button color="primary" (click)="enregistrerTout()" [disabled]="enCours() || nombreRemplies() === 0">
            <mat-icon>save</mat-icon>
            {{ enCours() ? 'Enregistrement...' : 'Enregistrer les notes' }}
          </button>
        </div>
      </mat-card>
    }
  `,
  styles: [`
    .carte-filtres { margin-bottom: 16px; padding: 16px; }
    .ligne-filtres { display: flex; gap: 16px; flex-wrap: wrap; }
    .ligne-filtres mat-form-field { min-width: 200px; flex: 1; }
    .message-etat {
      text-align: center;
      color: #757575;
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .carte-saisie { padding: 16px; }
    .tableau-saisie { width: 100%; border-collapse: collapse; }
    .tableau-saisie th {
      text-align: left;
      padding: 10px;
      border-bottom: 2px solid var(--iepp-orange-clair);
      color: var(--iepp-orange);
    }
    .tableau-saisie td { padding: 6px 10px; border-bottom: 1px solid #F0F0F0; }
    .champ-note { width: 100px; }
    .champ-note ::ng-deep .mat-mdc-form-field-infix { padding: 8px 0; min-height: unset; }
    .actions-saisie {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #F0F0F0;
    }
    .compteur-rempli { color: #757575; font-size: 0.9em; }
  `],
})
export class NoteEntryComponent implements OnInit {
  classes = signal<Classe[]>([]);
  lignes = signal<LigneSaisie[]>([]);
  chargement = signal(false);
  enCours = signal(false);

  classeId: number | null = null;
  matiere = 'MATHEMATIQUES';
  composition = 'COMP1';
  anneeScolaire = anneeScolaireCourante();

  matieres = MATIERES;
  compositions = COMPOSITIONS;

  constructor(
    private teacherService: TeacherService,
    private studentService: StudentService,
    private evaluationService: EvaluationService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.teacherService.listeClasses().subscribe((r) => this.classes.set(r.results));
  }

  chargerEleves() {
    if (!this.classeId) return;
    this.chargement.set(true);
    this.studentService.liste(undefined, this.classeId).subscribe({
      next: (r) => {
        this.lignes.set(r.results.map((eleve) => ({ eleve, valeur: null })));
        this.chargement.set(false);
        this.chargerNotesExistantes();
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des élèves.', 'Fermer', { duration: 4000 });
        this.chargement.set(false);
      },
    });
  }

  chargerNotesExistantes() {
    if (!this.classeId || this.lignes().length === 0) return;
    this.evaluationService.liste({
      classe: this.classeId, matiere: this.matiere,
      composition: this.composition, annee_scolaire: this.anneeScolaire,
    }).subscribe((reponse) => {
      const notesExistantes = new Map(reponse.results.map((n) => [n.eleve, n.valeur]));
      this.lignes.update((lignes) =>
        lignes.map((ligne) => ({
          ...ligne,
          valeur: notesExistantes.get(ligne.eleve.id) ?? null,
        }))
      );
    });
  }

  nombreRemplies(): number {
    return this.lignes().filter((l) => l.valeur !== null && l.valeur !== undefined).length;
  }

  enregistrerTout() {
    const notesRemplies = this.lignes()
      .filter((l) => l.valeur !== null && l.valeur !== undefined)
      .map((l) => ({ eleve: l.eleve.id, valeur: l.valeur! }));

    if (notesRemplies.length === 0) return;

    this.enCours.set(true);
    this.evaluationService.saisieGroupee({
      classe: this.classeId!,
      matiere: this.matiere,
      composition: this.composition,
      annee_scolaire: this.anneeScolaire,
      notes: notesRemplies,
    }).subscribe({
      next: () => {
        this.enCours.set(false);
        this.snackBar.open(`${notesRemplies.length} note(s) enregistrée(s).`, 'Fermer', { duration: 3000 });
      },
      error: (erreur) => {
        this.enCours.set(false);
        const message = erreur.error?.detail || erreur.error?.non_field_errors?.[0] || 'Erreur lors de l\'enregistrement.';
        this.snackBar.open(message, 'Fermer', { duration: 5000 });
      },
    });
  }
}