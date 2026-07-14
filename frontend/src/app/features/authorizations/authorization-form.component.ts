import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AuthorizationService } from '../../core/services/authorization.service';
import { SchoolService } from '../../core/services/school.service';
import { AuthService } from '../../core/services/auth.service';
import { School } from '../../core/models/school.model';

@Component({
  selector: 'app-authorization-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <button mat-icon-button (click)="retour()">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h2>Nouvelle demande d'autorisation</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">

        @if (auth.hasRole('ADMIN', 'CHEF_IEPP')) {
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
        } @else {
          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>École</mat-label>
            <input matInput [value]="nomEcoleAgent()" disabled />
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Motif de la demande</mat-label>
          <textarea matInput formControlName="motif" rows="3"></textarea>
        </mat-form-field>

        <div class="ligne-champs">

          <mat-form-field appearance="outline">
            <mat-label>Date de départ</mat-label>
            <input matInput [matDatepicker]="pickerDepart" formControlName="date_depart">
            <mat-datepicker-toggle matSuffix [for]="pickerDepart"></mat-datepicker-toggle>
            <mat-datepicker #pickerDepart></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Date de retour</mat-label>
            <input matInput [matDatepicker]="pickerRetour" formControlName="date_retour">
            <mat-datepicker-toggle matSuffix [for]="pickerRetour"></mat-datepicker-toggle>
            <mat-datepicker #pickerRetour></mat-datepicker>
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

            {{ enCours() ? 'Envoi...' : 'Soumettre la demande' }}
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
      max-width: 600px;
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
  `]
})
export class AuthorizationFormComponent implements OnInit {

  formulaire: ReturnType<FormBuilder['group']>;
  ecoles = signal<School[]>([]);
  enCours = signal(false);
  nomEcoleAgent = signal('Chargement...');

  constructor(
    private fb: FormBuilder,
    private authorizationService: AuthorizationService,
    private schoolService: SchoolService,
    private router: Router,
    private snackBar: MatSnackBar,
    public auth: AuthService
  ) {
    this.formulaire = this.fb.group({
      ecole: [null as number | null, Validators.required],
      motif: ['', Validators.required],
      date_depart: [null as Date | null, Validators.required],
      date_retour: [null as Date | null, Validators.required],
    });
  }

  ngOnInit(): void {
    if (this.auth.hasRole('ADMIN', 'CHEF_IEPP')) {

      this.schoolService.liste().subscribe((r) => {
        this.ecoles.set(r.results);
      });

    } else {

      this.schoolService.liste().subscribe((r) => {
        const ecoles = r.results;

        if (ecoles.length > 0) {
          this.formulaire.patchValue({
            ecole: ecoles[0].id
          });

          this.nomEcoleAgent.set(ecoles[0].nom);
        } else {
          this.nomEcoleAgent.set(
            'Aucune école affectée — contactez votre administrateur.'
          );
        }
      });

    }
  }

  enregistrer(): void {

    if (this.formulaire.invalid) {
      return;
    }

    this.enCours.set(true);

    const v = this.formulaire.value;

    const donnees = {
      ecole: v.ecole,
      motif: v.motif,
      date_depart: new Date(v.date_depart!).toISOString().split('T')[0],
      date_retour: new Date(v.date_retour!).toISOString().split('T')[0],
    };

    this.authorizationService.creer(donnees).subscribe({
      next: () => {
        this.snackBar.open(
          'Demande soumise avec succès.',
          'Fermer',
          { duration: 3000 }
        );

        this.router.navigate(['/authorizations']);
      },

      error: (erreur) => {

        this.enCours.set(false);

        const message =
          erreur.error?.non_field_errors?.[0] ??
          erreur.error?.detail ??
          'Erreur lors de l’envoi.';

        this.snackBar.open(
          message,
          'Fermer',
          { duration: 5000 }
        );
      }
    });

  }

  retour(): void {
    this.router.navigate(['/authorizations']);
  }

}