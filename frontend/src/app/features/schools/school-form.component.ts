import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SchoolService } from '../../core/services/school.service';
import { Sector } from '../../core/models/school.model';

@Component({
  selector: 'app-school-form',
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
    MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <button mat-icon-button (click)="retour()">
        <mat-icon>arrow_back</mat-icon>
      </button>

      <h2>{{ modeEdition() ? "Modifier l'école" : 'Nouvelle école' }}</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Nom de l'école</mat-label>
            <input matInput formControlName="nom" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Code école</mat-label>
            <input matInput formControlName="code" />
          </mat-form-field>
        </div>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Type d'école</mat-label>
            <mat-select formControlName="type_ecole">
              <mat-option value="PUBLIQUE">Publique</mat-option>
              <mat-option value="PRIVEE">Privée</mat-option>
              <mat-option value="COMMUNAUTAIRE">Communautaire</mat-option>
              <mat-option value="CONFESSIONNELLE">Confessionnelle</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Milieu</mat-label>
            <mat-select formControlName="milieu">
              <mat-option value="URBAIN">Urbain</mat-option>
              <mat-option value="RURAL">Rural</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Adresse</mat-label>
          <input matInput formControlName="adresse" />
        </mat-form-field>

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="telephone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Secteur pédagogique</mat-label>
          <mat-select formControlName="secteur">

            <mat-option [value]="null">
              — Aucun —
            </mat-option>

            @for (secteur of secteurs(); track secteur.id) {
              <mat-option [value]="secteur.id">
                {{ secteur.nom }}
              </mat-option>
            }

          </mat-select>
        </mat-form-field>

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
    .entete-page {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .carte-formulaire {
      max-width: 700px;
      padding: 24px;
    }

    .ligne-champs {
      display: flex;
      gap: 16px;
    }

    .ligne-champs mat-form-field {
      flex: 1;
    }

    .champ-pleine-largeur {
      width: 100%;
    }

    .actions-formulaire {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
  `],
})
export class SchoolFormComponent implements OnInit {

  formulaire!: FormGroup;

  secteurs = signal<Sector[]>([]);
  enCours = signal(false);
  ecoleId = signal<number | null>(null);
  modeEdition = signal(false);


  constructor(
    private fb: FormBuilder,
    private schoolService: SchoolService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}


  ngOnInit(): void {

    this.formulaire = this.fb.group({
      nom: ['', Validators.required],
      code: ['', Validators.required],
      type_ecole: ['PUBLIQUE', Validators.required],
      milieu: ['URBAIN', Validators.required],
      adresse: [''],
      telephone: [''],
      email: ['', Validators.email],
      secteur: [null],
    });


    // Chargement des secteurs
    this.schoolService.listeSecteurs().subscribe({
      next: (response) => {
        this.secteurs.set(response.results);
      },
      error: () => {
        this.secteurs.set([]);
      }
    });


    // Mode modification
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {

      const id = Number(idParam);

      this.ecoleId.set(id);
      this.modeEdition.set(true);


      this.schoolService.obtenir(id).subscribe((ecole) => {

        this.formulaire.patchValue({
          nom: ecole.nom,
          code: ecole.code,
          type_ecole: ecole.type_ecole,
          milieu: ecole.milieu,
          adresse: ecole.adresse,
          telephone: ecole.telephone,
          email: ecole.email,
          secteur: ecole.secteur,
        });

      });
    }
  }


  enregistrer(): void {

    if (this.formulaire.invalid) {
      return;
    }


    this.enCours.set(true);

    const donnees = this.formulaire.value;


    const requete = this.modeEdition()
      ? this.schoolService.modifier(this.ecoleId()!, donnees)
      : this.schoolService.creer(donnees);


    requete.subscribe({

      next: () => {

        this.snackBar.open(
          this.modeEdition()
            ? 'École modifiée avec succès.'
            : 'École créée avec succès.',
          'Fermer',
          { duration: 3000 }
        );


        this.router.navigate(['/schools']);

      },


      error: (erreur) => {

        this.enCours.set(false);


        const message =
          erreur.error?.code?.[0] ??
          erreur.error?.detail ??
          "Erreur lors de l'enregistrement.";


        this.snackBar.open(
          message,
          'Fermer',
          { duration: 5000 }
        );

      }

    });

  }


  retour(): void {
    this.router.navigate(['/schools']);
  }

}