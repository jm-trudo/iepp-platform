import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../core/services/teacher.service';
import { UserService } from '../../core/services/user.service';
import { SchoolService } from '../../core/services/school.service';
import { School } from '../../core/models/school.model';
import { Classe } from '../../core/models/classe.model';

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="entete-page">
      <button mat-icon-button (click)="retour()"><mat-icon>arrow_back</mat-icon></button>
      <h2>{{ modeEdition() ? "Modifier l'enseignant" : 'Nouvel enseignant' }}</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">

        @if (!modeEdition()) {
          <div class="ligne-champs">
            <mat-form-field appearance="outline">
              <mat-label>Nom d'utilisateur</mat-label>
              <input matInput formControlName="username" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Mot de passe provisoire</mat-label>
              <input matInput type="password" formControlName="password" />
            </mat-form-field>
          </div>
        }

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Prénoms</mat-label>
            <input matInput formControlName="first_name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="last_name" />
          </mat-form-field>
        </div>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Matricule</mat-label>
            <input matInput formControlName="matricule" />
          </mat-form-field>
        </div>

        <h3 class="titre-section">Affectation</h3>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>École</mat-label>
            <mat-select formControlName="ecole" (selectionChange)="chargerClassesDeLecole($event.value)">
              @for (ecole of ecoles(); track ecole.id) {
                <mat-option [value]="ecole.id">{{ ecole.nom }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Classe</mat-label>
            <mat-select formControlName="classe">
              @for (classe of classesDisponibles(); track classe.id) {
                <mat-option [value]="classe.id">{{ classe.niveau_display }} {{ classe.libelle }}</mat-option>
              }
            </mat-select>
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
    .titre-section { color: var(--iepp-orange); margin: 16px 0 8px; font-size: 1em; }
    .actions-formulaire { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
  `],
})
export class TeacherFormComponent implements OnInit {
  formulaire: ReturnType<FormBuilder['group']>;

  ecoles = signal<School[]>([]);
  classesDisponibles = signal<Classe[]>([]);
  enCours = signal(false);
  enseignantId = signal<number | null>(null);
  modeEdition = signal(false);

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private userService: UserService,
    private schoolService: SchoolService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.formulaire = this.fb.group({
      username: [''],
      password: [''],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', Validators.email],
      matricule: [''],
      ecole: [null as number | null],
      classe: [null as number | null],
    });
  }

  ngOnInit() {
    this.schoolService.liste().subscribe((r) => this.ecoles.set(r.results));

    if (!this.modeEdition()) {
      this.formulaire.get('username')!.addValidators(Validators.required);
      this.formulaire.get('password')!.addValidators([Validators.required, Validators.minLength(8)]);
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.enseignantId.set(id);
      this.modeEdition.set(true);
      this.teacherService.obtenirEnseignant(id).subscribe((enseignant) => {
        this.formulaire.patchValue({
          first_name: enseignant.first_name,
          last_name: enseignant.last_name,
          email: enseignant.email,
          matricule: enseignant.matricule,
          ecole: enseignant.profile?.ecole ?? null,
          classe: enseignant.profile?.classe ?? null,
        });
        if (enseignant.profile?.ecole) {
          this.chargerClassesDeLecole(enseignant.profile.ecole);
        }
      });
    }
  }

  chargerClassesDeLecole(ecoleId: number) {
    this.teacherService.listeClasses(ecoleId).subscribe((r) => this.classesDisponibles.set(r.results));
  }

  enregistrer() {
    if (this.formulaire.invalid) return;
    this.enCours.set(true);
    const v = this.formulaire.value;

    if (this.modeEdition()) {
      this.teacherService.modifierEnseignant(this.enseignantId()!, {
        first_name: v.first_name, last_name: v.last_name, email: v.email, matricule: v.matricule,
        profile: { ecole: v.ecole, classe: v.classe },
      }).subscribe({
        next: () => this.succes(),
        error: (e) => this.echec(e),
      });
    } else {
      this.userService.creer({
        username: v.username, password: v.password, role: 'INSTITUTEUR',
        first_name: v.first_name, last_name: v.last_name, email: v.email, matricule: v.matricule,
      }).subscribe({
        next: (nouvelUtilisateur) => {
          this.teacherService.modifierEnseignant(nouvelUtilisateur.id, {
            profile: { ecole: v.ecole, classe: v.classe },
          }).subscribe({
            next: () => this.succes(),
            error: (e) => this.echec(e),
          });
        },
        error: (e) => this.echec(e),
      });
    }
  }

  private succes() {
    this.snackBar.open('Enseignant enregistré.', 'Fermer', { duration: 3000 });
    this.router.navigate(['/teachers']);
  }

  private echec(erreur: any) {
    this.enCours.set(false);
    const message = erreur.error?.username?.[0] || erreur.error?.detail || 'Erreur lors de l\'enregistrement.';
    this.snackBar.open(message, 'Fermer', { duration: 5000 });
  }

  retour() { this.router.navigate(['/teachers']); }
}