import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UserService } from '../../core/services/user.service';
import { Subscription } from '../../core/models/subscription.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-subscription-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.abonnement ? "Modifier l'abonnement" : 'Nouvel abonnement' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="formulaire" class="formulaire-dialogue">
        @if (!data.abonnement) {
          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>Chef IEPP</mat-label>
            <mat-select formControlName="chef">
              @for (chef of chefs(); track chef.id) {
                <mat-option [value]="chef.id">{{ chef.first_name }} {{ chef.last_name }} ({{ chef.username }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <div class="ligne-champs">
          <mat-form-field appearance="outline">
            <mat-label>Date de début</mat-label>
            <input matInput [matDatepicker]="pickerDebut" formControlName="date_debut" />
            <mat-datepicker-toggle matSuffix [for]="pickerDebut"></mat-datepicker-toggle>
            <mat-datepicker #pickerDebut></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date d'expiration</mat-label>
            <input matInput [matDatepicker]="pickerFin" formControlName="date_fin" />
            <mat-datepicker-toggle matSuffix [for]="pickerFin"></mat-datepicker-toggle>
            <mat-datepicker #pickerFin></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Montant (F CFA)</mat-label>
          <input matInput type="number" formControlName="montant" />
        </mat-form-field>

        @if (data.abonnement) {
          <mat-form-field appearance="outline" class="champ-pleine-largeur">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="statut">
              <mat-option value="ACTIF">Actif</mat-option>
              <mat-option value="SUSPENDU">Suspendu</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Annuler</button>
      <button mat-flat-button color="primary" [disabled]="formulaire.invalid || enCours()" (click)="enregistrer()">
        {{ enCours() ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .formulaire-dialogue { display: flex; flex-direction: column; gap: 4px; min-width: 400px; }
    .ligne-champs { display: flex; gap: 12px; }
    .ligne-champs mat-form-field { flex: 1; }
    .champ-pleine-largeur { width: 100%; }
  `],
})
export class SubscriptionFormDialogComponent implements OnInit {
  formulaire: ReturnType<FormBuilder['group']>;
  chefs = signal<User[]>([]);
  enCours = signal(false);

  constructor(
    private fb: FormBuilder,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<SubscriptionFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { abonnement?: Subscription },
  ) {
    this.formulaire = this.fb.group({
      chef: [null as number | null, data.abonnement ? [] : Validators.required],
      date_debut: [data.abonnement ? new Date(data.abonnement.date_debut) : null, Validators.required],
      date_fin: [data.abonnement ? new Date(data.abonnement.date_fin) : null, Validators.required],
      montant: [data.abonnement?.montant ?? null],
      statut: [data.abonnement?.statut ?? 'ACTIF'],
    });
  }

  ngOnInit() {
    if (!this.data.abonnement) {
      this.userService.liste('CHEF_IEPP').subscribe((r) => this.chefs.set(r.results));
    }
  }

  enregistrer() {
    if (this.formulaire.invalid) return;
    this.enCours.set(true);
    const v = this.formulaire.value;

    const donnees: any = {
      date_debut: new Date(v.date_debut).toISOString().split('T')[0],
      date_fin: new Date(v.date_fin).toISOString().split('T')[0],
      montant: v.montant,
    };

    const requete = this.data.abonnement
      ? this.subscriptionService.modifier(this.data.abonnement.id, { ...donnees, statut: v.statut })
      : this.subscriptionService.creer({ ...donnees, chef: v.chef });

    requete.subscribe({
      next: () => {
        this.snackBar.open('Abonnement enregistré.', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (erreur) => {
        this.enCours.set(false);
        this.snackBar.open(erreur.error?.detail || 'Erreur lors de l\'enregistrement.', 'Fermer', { duration: 5000 });
      },
    });
  }
}