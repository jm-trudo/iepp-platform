import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DecisionDialogData {
  titre: string;
  estAcceptation: boolean;
}

@Component({
  selector: 'app-decision-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.titre }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="champ-pleine-largeur">
        <mat-label>Commentaire (optionnel)</mat-label>
        <textarea matInput [(ngModel)]="commentaire" rows="3"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Annuler</button>
      <button
        mat-flat-button
        [color]="data.estAcceptation ? 'primary' : 'warn'"
        [mat-dialog-close]="commentaire"
      >
        Confirmer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.champ-pleine-largeur { width: 100%; margin-top: 8px; }`],
})
export class DecisionDialogComponent {
  commentaire = '';
  constructor(@Inject(MAT_DIALOG_DATA) public data: DecisionDialogData) {}
}