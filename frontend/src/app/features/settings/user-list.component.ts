import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule],
  template: `
    <div class="entete-page">
      <h2>Utilisateurs</h2>
      <button mat-flat-button color="primary" (click)="router.navigate(['/settings/users/nouveau'])">
        <mat-icon>person_add</mat-icon> Nouvel utilisateur
      </button>
    </div>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement...</p>
      } @else if (utilisateurs().length === 0) {
        <p class="message-etat">Aucun utilisateur trouvé.</p>
      } @else {
        <table mat-table [dataSource]="utilisateurs()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let u">{{ u.first_name }} {{ u.last_name }} <span class="sous-texte">({{ u.username }})</span></td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rôle</th>
            <td mat-cell *matCellDef="let u"><mat-chip>{{ u.role_display }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="statut">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let u">{{ u.is_active ? 'Actif' : 'Inactif' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
          <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    .sous-texte { color: #9E9E9E; font-size: 0.85em; }
  `],
})
export class UserListComponent implements OnInit {
  utilisateurs = signal<User[]>([]);
  chargement = signal(true);
  colonnes = ['nom', 'role', 'email', 'statut'];

  constructor(private userService: UserService, public router: Router, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.userService.liste().subscribe({
      next: (r) => { this.utilisateurs.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }
}