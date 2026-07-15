import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { CirconscriptionService } from '../../core/services/circonscription.service';
import { Circonscription } from '../../core/models/circonscription.model';

@Component({
  selector: 'app-circonscription-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <h2>Ma circonscription</h2>

    @if (chargement()) {
      <p class="message-etat">Chargement...</p>
    } @else if (circo(); as c) {
      <mat-card class="iepp-carte carte-circonscription">
        <div class="zone-logo">
          @if (c.logo) {
            <img [src]="c.logo" alt="Logo de la circonscription" class="apercu-logo" />
          } @else {
            <div class="logo-vide">
              <mat-icon>image</mat-icon>
              <span>Aucun logo</span>
            </div>
          }
          <div>
            <input type="file" #inputFichier accept="image/*" (change)="surSelectionFichier($event)" hidden />
            <button mat-stroked-button color="primary" (click)="inputFichier.click()">
              <mat-icon>upload</mat-icon> {{ c.logo ? 'Changer le logo' : 'Ajouter un logo' }}
            </button>
            <p class="aide-logo">Format carré recommandé (PNG ou JPG, max 2 Mo).</p>
          </div>
        </div>

        <mat-form-field appearance="outline" class="champ-pleine-largeur">
          <mat-label>Nom de la circonscription</mat-label>
          <input matInput [(ngModel)]="nomModifie" />
        </mat-form-field>

        <div class="actions-formulaire">
          <button mat-flat-button color="primary" (click)="enregistrerNom(c.id)" [disabled]="enCours()">
            {{ enCours() ? 'Enregistrement...' : 'Enregistrer le nom' }}
          </button>
        </div>

        <p class="info-ecoles">{{ c.nombre_ecoles }} école(s) rattachée(s)</p>
      </mat-card>
    } @else {
      <p class="message-etat">Aucune circonscription associée à votre compte.</p>
    }
  `,
  styles: [`
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    .carte-circonscription { max-width: 600px; padding: 24px; }
    .zone-logo { display: flex; align-items: center; gap: 20px; margin-bottom: 20px; }
    .apercu-logo {
      width: 90px; height: 90px; object-fit: contain;
      border: 1px solid #E0E0E0; border-radius: 8px; padding: 6px; background: white;
    }
    .logo-vide {
      width: 90px; height: 90px; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 4px;
      border: 2px dashed #E0E0E0; border-radius: 8px; color: #BDBDBD; font-size: 0.75em;
    }
    .aide-logo { font-size: 0.8em; color: #9E9E9E; margin: 6px 0 0; }
    .champ-pleine-largeur { width: 100%; }
    .actions-formulaire { display: flex; justify-content: flex-end; margin-top: 8px; }
    .info-ecoles { color: #757575; font-size: 0.9em; margin-top: 16px; border-top: 1px solid #F0F0F0; padding-top: 12px; }
  `],
})
export class CirconscriptionSettingsComponent implements OnInit {
  circo = signal<Circonscription | null>(null);
  chargement = signal(true);
  enCours = signal(false);
  nomModifie = '';

  constructor(private service: CirconscriptionService, private snackBar: MatSnackBar) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.chargement.set(true);
    this.service.maCirconscription().subscribe({
      next: (c) => { this.circo.set(c); this.nomModifie = c.nom; this.chargement.set(false); },
      error: () => { this.chargement.set(false); },
    });
  }

  surSelectionFichier(event: Event) {
    const fichier = (event.target as HTMLInputElement).files?.[0];
    const c = this.circo();
    if (!fichier || !c) return;

    this.service.televerserLogo(c.id, fichier).subscribe({
      next: (mis_a_jour) => {
        this.circo.set(mis_a_jour);
        this.snackBar.open('Logo mis à jour.', 'Fermer', { duration: 3000 });
      },
      error: () => this.snackBar.open('Erreur lors du téléversement.', 'Fermer', { duration: 4000 }),
    });
  }

  enregistrerNom(id: number) {
    this.enCours.set(true);
    this.service.modifierNom(id, this.nomModifie).subscribe({
      next: (c) => {
        this.circo.set(c);
        this.enCours.set(false);
        this.snackBar.open('Nom enregistré.', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.enCours.set(false);
        this.snackBar.open('Erreur lors de l\'enregistrement.', 'Fermer', { duration: 4000 });
      },
    });
  }
}