import { Component, OnInit, signal, computed } from '@angular/core';
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
import { Note, MATIERES, COMPOSITIONS } from '../../core/models/evaluation.model';
import { Classe } from '../../core/models/classe.model';
import { AuthService } from '../../core/services/auth.service';

interface LigneEleve {
  eleveId: number;
  eleveNom: string;
  notesParComposition: Record<string, number | null>;
  moyenne: number | null;
}

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
          @for (classe of classes(); track classe.id) {
            <mat-option [value]="classe.id">{{ classe.niveau_display }} {{ classe.libelle }} — {{ classe.ecole_nom }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Matière</mat-label>
        <mat-select [(ngModel)]="matiere" (selectionChange)="charger()">
          @for (m of matieres; track m.value) {
            <mat-option [value]="m.value">{{ m.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (!classeId) {
      <div class="iepp-carte message-etat">
        <mat-icon>info</mat-icon>
        <p>Sélectionnez une classe et une matière pour afficher les notes.</p>
      </div>
    } @else if (chargement()) {
      <div class="iepp-carte message-etat"><p>Chargement...</p></div>
    } @else if (lignes().length === 0) {
      <div class="iepp-carte message-etat"><p>Aucun élève ou aucune note pour cette sélection.</p></div>
    } @else {
      <div class="iepp-carte">
        <table mat-table [dataSource]="lignes()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="eleve">
            <th mat-header-cell *matHeaderCellDef>Élève</th>
            <td mat-cell *matCellDef="let l">{{ l.eleveNom }}</td>
          </ng-container>

          @for (compo of compositions; track compo.value) {
            <ng-container [matColumnDef]="compo.value">
              <th mat-header-cell *matHeaderCellDef>{{ compo.label }}</th>
              <td mat-cell *matCellDef="let l">
                @if (l.notesParComposition[compo.value] !== null && l.notesParComposition[compo.value] !== undefined) {
                  <span [class.note-faible]="l.notesParComposition[compo.value]! < 10" [class.note-bonne]="l.notesParComposition[compo.value]! >= 14">
                    {{ l.notesParComposition[compo.value] }}
                  </span>
                } @else {
                  <span class="note-absente">—</span>
                }
              </td>
            </ng-container>
          }

          <ng-container matColumnDef="moyenne">
            <th mat-header-cell *matHeaderCellDef>Moyenne</th>
            <td mat-cell *matCellDef="let l">
              @if (l.moyenne !== null) {
                <strong [class.note-faible]="l.moyenne < 10" [class.note-bonne]="l.moyenne >= 14">{{ l.moyenne }}/20</strong>
              } @else {
                <span class="note-absente">—</span>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colonnesAffichees"></tr>
          <tr mat-row *matRowDef="let row; columns: colonnesAffichees;"></tr>
        </table>
      </div>
    }
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .barre-filtres { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .barre-filtres mat-form-field { min-width: 220px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat {
      text-align: center; color: #757575; padding: 32px;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .note-faible { color: #C62828; font-weight: 600; }
    .note-bonne { color: var(--iepp-vert); font-weight: 600; }
    .note-absente { color: #BDBDBD; }
  `],
})
export class NoteListComponent implements OnInit {
  notesBrutes = signal<Note[]>([]);
  classes = signal<Classe[]>([]);
  chargement = signal(true);
  classeId: number | null = null;
  matiere = 'MATHEMATIQUES';
  matieres = MATIERES;
  compositions = COMPOSITIONS;

  colonnesAffichees = ['eleve', ...COMPOSITIONS.map((c) => c.value), 'moyenne'];

  lignes = computed<LigneEleve[]>(() => {
    const parEleve = new Map<number, LigneEleve>();

    for (const note of this.notesBrutes()) {
      if (!parEleve.has(note.eleve)) {
        parEleve.set(note.eleve, {
          eleveId: note.eleve,
          eleveNom: note.eleve_nom,
          notesParComposition: {},
          moyenne: null,
        });
      }
      parEleve.get(note.eleve)!.notesParComposition[note.composition] = note.valeur;
    }

    for (const ligne of parEleve.values()) {
      const valeurs = Object.values(ligne.notesParComposition).filter((v): v is number => v !== null && v !== undefined);
      ligne.moyenne = valeurs.length > 0
        ? Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 100) / 100
        : null;
    }

    return Array.from(parEleve.values()).sort((a, b) => a.eleveNom.localeCompare(b.eleveNom));
  });

  constructor(
    private evaluationService: EvaluationService,
    private teacherService: TeacherService,
    private router: Router,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.teacherService.listeClasses().subscribe((r) => {
      this.classes.set(r.results);
      if (r.results.length > 0) {
        this.classeId = r.results[0].id;
        this.charger();
      } else {
        this.chargement.set(false);
      }
    });
  }

  charger() {
    if (!this.classeId) return;
    this.chargement.set(true);
    this.evaluationService.liste({
      classe: this.classeId,
      matiere: this.matiere,
    }).subscribe({
      next: (r) => { this.notesBrutes.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  allerVersSaisie() {
    this.router.navigate(['/evaluations/saisie']);
  }
}