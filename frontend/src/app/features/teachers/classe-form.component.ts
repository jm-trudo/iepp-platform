import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatSnackBarModule,
  MatSnackBar
} from '@angular/material/snack-bar';

import { TeacherService } from '../../core/services/teacher.service';
import { SchoolService } from '../../core/services/school.service';
import { School } from '../../core/models/school.model';
import { Classe } from '../../core/models/classe.model';

const NIVEAUX = [
  { value: 'PS', label: 'Petite Section' },
  { value: 'MS', label: 'Moyenne Section' },
  { value: 'GS', label: 'Grande Section' },
  { value: 'CP1', label: 'CP1' },
  { value: 'CP2', label: 'CP2' },
  { value: 'CE1', label: 'CE1' },
  { value: 'CE2', label: 'CE2' },
  { value: 'CM1', label: 'CM1' },
  { value: 'CM2', label: 'CM2' },
];

@Component({
  selector: 'app-classe-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="entete-page">
      <button mat-icon-button (click)="retour()">
        <mat-icon>arrow_back</mat-icon>
      </button>

      <h2>{{ modeEdition() ? 'Modifier la classe' : 'Nouvelle classe' }}</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>École</mat-label>

          <mat-select formControlName="ecole">
            @for (ecole of ecoles(); track ecole.id) {
              <mat-option [value]="ecole.id">
                {{ ecole.nom }}
              </mat-option>
            }
          </mat-select>

        </mat-form-field>

        <div class="ligne-champs">

          <mat-form-field appearance="outline">
            <mat-label>Niveau</mat-label>

            <mat-select formControlName="niveau">
              @for (n of niveaux; track n.value) {
                <mat-option [value]="n.value">
                  {{ n.label }}
                </mat-option>
              }
            </mat-select>

          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Libellé</mat-label>
            <input matInput formControlName="libelle">
          </mat-form-field>

        </div>

        <div class="actions-formulaire">
          <button mat-button type="button" (click)="retour()">
            Annuler
          </button>

          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="formulaire.invalid || enCours()">

            {{ enCours() ? 'Enregistrement...' : 'Enregistrer' }}

          </button>
        </div>

      </form>
    </mat-card>
  `,
  styles: [`
    .entete-page{
      display:flex;
      align-items:center;
      gap:8px;
      margin-bottom:16px;
    }

    .carte-formulaire{
      max-width:600px;
      padding:24px;
    }

    .ligne-champs{
      display:flex;
      gap:16px;
    }

    .ligne-champs mat-form-field{
      flex:1;
    }

    .champ-pleine-largeur{
      width:100%;
    }

    .actions-formulaire{
      display:flex;
      justify-content:flex-end;
      gap:8px;
      margin-top:12px;
    }
  `]
})
export class ClasseFormComponent implements OnInit {

  niveaux = NIVEAUX;

  formulaire!: FormGroup;

  ecoles = signal<School[]>([]);
  enCours = signal(false);
  classeId = signal<number | null>(null);
  modeEdition = signal(false);

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private schoolService: SchoolService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {

    this.formulaire = this.fb.group({
      ecole: [null, Validators.required],
      niveau: ['', Validators.required],
      libelle: ['']
    });

    this.schoolService.liste().subscribe((r) => {
      this.ecoles.set(r.results);
    });

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {

      const id = Number(idParam);

      this.classeId.set(id);
      this.modeEdition.set(true);

      this.teacherService.obtenirClasse(id).subscribe((classe) => {

        this.formulaire.patchValue({
          ecole: classe.ecole,
          niveau: classe.niveau,
          libelle: classe.libelle
        });

      });

    }

  }

  enregistrer(): void {

    if (this.formulaire.invalid) {
      return;
    }

    this.enCours.set(true);

    const raw = this.formulaire.getRawValue();

    const donnees: Partial<Classe> = {
      ecole: raw.ecole ?? undefined,
      niveau: raw.niveau ?? undefined,
      libelle: raw.libelle ?? undefined
    };

    const requete = this.modeEdition()
      ? this.teacherService.modifierClasse(this.classeId()!, donnees)
      : this.teacherService.creerClasse(donnees);

    requete.subscribe({

      next: () => {

        this.snackBar.open(
          'Classe enregistrée.',
          'Fermer',
          { duration: 3000 }
        );

        this.router.navigate(['/classes']);

      },

      error: (erreur) => {

        this.enCours.set(false);

        this.snackBar.open(
          erreur.error?.detail || 'Erreur lors de l’enregistrement.',
          'Fermer',
          { duration: 5000 }
        );

      }

    });

  }

  retour(): void {
    this.router.navigate(['/classes']);
  }

}