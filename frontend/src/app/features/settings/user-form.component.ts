import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-form',
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
      <h2>Nouvel utilisateur</h2>
    </div>

    <mat-card class="iepp-carte carte-formulaire">
      <form [formGroup]="formulaire" (ngSubmit)="enregistrer()">

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Rôle</mat-label>

          <mat-select formControlName="role">

            @if (auth.hasRole('ADMIN')) {
              <mat-option value="ADMIN">
                Administrateur système
              </mat-option>

              <mat-option value="CHEF_IEPP">
                Chef de Circonscription (IEPP)
              </mat-option>
            }

            <mat-option value="DIRECTEUR">
              Directeur d'école
            </mat-option>

            <mat-option value="CONSEILLER">
              Conseiller pédagogique
            </mat-option>

            <mat-option value="INSTITUTEUR">
              Instituteur
            </mat-option>

          </mat-select>
        </mat-form-field>


        <div class="ligne-champs">

          <mat-form-field appearance="outline">
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Mot de passe provisoire</mat-label>
            <input matInput type="password" formControlName="password">
          </mat-form-field>

        </div>


        <div class="ligne-champs">

          <mat-form-field appearance="outline">
            <mat-label>Prénoms</mat-label>
            <input matInput formControlName="first_name">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nom</mat-label>
            <input matInput formControlName="last_name">
          </mat-form-field>

        </div>


        <div class="ligne-champs">

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Téléphone</mat-label>
            <input matInput formControlName="telephone">
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

            {{ enCours() ? 'Enregistrement...' : 'Créer le compte' }}

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
  `],
})
export class UserFormComponent {

  formulaire: ReturnType<FormBuilder['group']>;
  enCours = signal(false);


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    public auth: AuthService
  ) {

    this.formulaire = this.fb.group({

      role: [
        'DIRECTEUR',
        Validators.required
      ],

      username: [
        '',
        Validators.required
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],

      first_name: [
        '',
        Validators.required
      ],

      last_name: [
        '',
        Validators.required
      ],

      email: [
        '',
        Validators.email
      ],

      telephone: [
        ''
      ],

    });

  }


  enregistrer(): void {

    if (this.formulaire.invalid) {
      return;
    }

    this.enCours.set(true);

    this.userService.creer(
      this.formulaire.value
    )
    .subscribe({

      next: () => {

        this.snackBar.open(
          'Compte créé avec succès.',
          'Fermer',
          {
            duration: 3000
          }
        );

        this.router.navigate([
          '/settings/users'
        ]);

      },

      error: (erreur) => {

        this.enCours.set(false);

        const message =
          erreur.error?.username?.[0] ||
          erreur.error?.detail ||
          'Erreur lors de la création.';

        this.snackBar.open(
          message,
          'Fermer',
          {
            duration: 5000
          }
        );

      }

    });

  }


  retour(): void {
    this.router.navigate([
      '/settings/users'
    ]);
  }

}