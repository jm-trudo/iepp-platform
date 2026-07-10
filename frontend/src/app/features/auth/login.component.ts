import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-login">
      <mat-card class="iepp-carte carte-login">
        <div class="entete-login">
          <h1>Plateforme IEPP</h1>
          <p>Gestion de la circonscription scolaire</p>
        </div>

        <form [formGroup]="formulaire" (ngSubmit)="seConnecter()">
          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>Nom d'utilisateur</mat-label>
            <input matInput formControlName="username" autocomplete="username" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>Mot de passe</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
          </mat-form-field>

          @if (erreur()) {
            <p class="message-erreur">{{ erreur() }}</p>
          }

          <button
            mat-flat-button color="primary" type="submit"
            class="bouton-connexion"
            [disabled]="formulaire.invalid || enCours()"
          >
            @if (enCours()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Se connecter
            }
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-login {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--iepp-orange-clair), var(--iepp-vert-clair));
    }
    .carte-login { width: 380px; padding: 32px; }
    .entete-login { text-align: center; margin-bottom: 24px; }
    .entete-login h1 { color: var(--iepp-orange); margin-bottom: 4px; }
    .champ-pleine-largeur { width: 100%; margin-bottom: 8px; }
    .bouton-connexion { width: 100%; height: 44px; }
    .message-erreur { color: #C62828; font-size: 0.9em; margin-bottom: 12px; }
  `],
})
export class LoginComponent {
  formulaire: ReturnType<FormBuilder['group']>;
  enCours = signal(false);
  erreur = signal('');

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.formulaire = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  seConnecter() {
    if (this.formulaire.invalid) return;
    this.enCours.set(true);
    this.erreur.set('');

    const { username, password } = this.formulaire.value;
    this.auth.login(username!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.erreur.set('Identifiants incorrects ou compte inactif.');
        this.enCours.set(false);
      },
    });
  }
}