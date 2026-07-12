import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StudentService } from '../../core/services/student.service';
import { SchoolService } from '../../core/services/school.service';
import { TeacherService } from '../../core/services/teacher.service';
import { School } from '../../core/models/school.model';
import { Classe } from '../../core/models/classe.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <button mat-icon-button (click)="retour()"><mat-icon>arrow_back</mat-icon></button>
      <h2>{{ modeEdition() ? "Modifier l'élève" : 'Nouvel élève' }}</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">
        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="nom" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Prénoms</mat-label>
            <input matInput formControlName="prenoms" />
          </mat-form-field>
        </div>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Date de naissance</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date_naissance" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sexe</mat-label>
            <mat-select formControlName="sexe">
              <mat-option value="M">Masculin</mat-option>
              <mat-option value="F">Féminin</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        @if (afficherSelecteurEcole()) {
          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>École</mat-label>
            <mat-select [(value)]="ecoleSelectionnee" (selectionChange)="chargerClasses($event.value)">
              @for (ecole of ecoles(); track ecole.id) {
                <mat-option [value]="ecole.id">{{ ecole.nom }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Classe</mat-label>
          <mat-select formControlName="classe">
            @for (classe of classesDisponibles(); track classe.id) {
              <mat-option [value]="classe.id">{{ classe.niveau_display }} {{ classe.libelle }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <h3 class="titre-section">Parent / Tuteur</h3>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Nom du parent/tuteur</mat-label>
            <input matInput formControlName="nom_parent" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Contact</mat-label>
            <input matInput formControlName="contact_parent" />
          </mat-form-field>
        </div>

        <div class="actions-formulaire">
          <button mat-button type="button" (click)="retour()">Annuler</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="formulaire.invalid || enCours()">
            {{ enCours() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </mat-card>
  `,
  styles: [`
    .entete-page { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .carte-formulaire { max-width: 700px; padding: 24px; }
    .ligne-champs { display: flex; gap: 16px; }
    .ligne-champs mat-form-field { flex: 1; }
    .champ-pleine-largeur { width: 100%; }
    .titre-section { color: var(--iepp-orange); margin: 16px 0 8px; font-size: 1em; }
    .actions-formulaire { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `],
})
export class StudentFormComponent implements OnInit {
  formulaire: ReturnType<FormBuilder['group']>;

  ecoles = signal<School[]>([]);
  classesDisponibles = signal<Classe[]>([]);
  ecoleSelectionnee: number | null = null;
  enCours = signal(false);
  eleveId = signal<number | null>(null);
  modeEdition = signal(false);

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private schoolService: SchoolService,
    private teacherService: TeacherService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {
    this.formulaire = this.fb.group({
      nom: ['', Validators.required],
      prenoms: ['', Validators.required],
      date_naissance: [null],
      sexe: [''],
      classe: [null as number | null, Validators.required],
      nom_parent: [''],
      contact_parent: [''],
    });
  }

  ngOnInit() {
    // Un Instituteur n'a qu'une seule classe : pas besoin du sélecteur d'école,
    // on charge directement sa classe. Les autres rôles choisissent l'école d'abord.
    if (this.afficherSelecteurEcole()) {
      this.schoolService.liste().subscribe((r) => this.ecoles.set(r.results));
    } else {
      this.teacherService.listeClasses().subscribe((r) => this.classesDisponibles.set(r.results));
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.eleveId.set(id);
      this.modeEdition.set(true);
      this.studentService.obtenir(id).subscribe((eleve) => {
        this.formulaire.patchValue({
          nom: eleve.nom,
          prenoms: eleve.prenoms,
          date_naissance: eleve.date_naissance,
          sexe: eleve.sexe,
          classe: eleve.classe,
          nom_parent: eleve.nom_parent,
          contact_parent: eleve.contact_parent,
        });
        if (this.afficherSelecteurEcole()) {
          this.ecoleSelectionnee = eleve.ecole;
          this.chargerClasses(eleve.ecole);
        }
      });
    }
  }

  afficherSelecteurEcole(): boolean {
    return this.auth.hasRole('ADMIN', 'CHEF_IEPP', 'DIRECTEUR');
  }

  chargerClasses(ecoleId: number) {
    this.teacherService.listeClasses(ecoleId).subscribe((r) => this.classesDisponibles.set(r.results));
  }

  enregistrer() {
    if (this.formulaire.invalid) return;
    this.enCours.set(true);
    const v = this.formulaire.value;

    const donnees = {
      ...v,
      date_naissance: v.date_naissance
        ? new Date(v.date_naissance).toISOString().split('T')[0]
        : null,
    };

    const requete = this.modeEdition()
      ? this.studentService.modifier(this.eleveId()!, donnees)
      : this.studentService.creer(donnees);

    requete.subscribe({
      next: () => {
        this.snackBar.open('Élève enregistré.', 'Fermer', { duration: 3000 });
        this.router.navigate(['/students']);
      },
      error: (erreur) => {
        this.enCours.set(false);
        const message = erreur.error?.detail || 'Erreur lors de l\'enregistrement.';
        this.snackBar.open(message, 'Fermer', { duration: 5000 });
      },
    });
  }

  retour() { this.router.navigate(['/students']); }
}