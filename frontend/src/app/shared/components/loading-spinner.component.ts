import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="conteneur-chargement">
      <mat-spinner diameter="36" color="primary"></mat-spinner>
      <span>Chargement...</span>
    </div>
  `,
  styles: [`
    .conteneur-chargement {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px;
      color: #9E9E9E;
    }
  `],
})
export class LoadingSpinnerComponent {}