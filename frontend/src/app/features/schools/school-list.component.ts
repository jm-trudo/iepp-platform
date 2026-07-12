import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SchoolService } from '../../core/services/school.service';
import { School } from '../../core/models/school.model';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule, MatDialogModule,
    MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <div class="entete-page">
      <h2>Écoles</h2>
      @if (peutGerer()) {
        <button mat-flat-button color="primary" (click)="allerVersFormulaire()">
          <mat-icon>add</mat-icon> Nouvelle école
        </button>
      }
    </div>

    <mat-form-field appearance="outline" class="champ-recherche">
      <mat-label>Rechercher une école</mat-label>
      <input matInput [(ngModel)]="terme" (ngModelChange)="rechercher()" placeholder="Nom ou code..." />
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement des écoles...</p>
      } @else if (ecoles().length === 0) {
        <p class="message-etat">Aucune école trouvée.</p>
      } @else {
        <table mat-table [dataSource]="ecoles()" class="tableau-ecoles">
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let ecole">{{ ecole.nom }}</td>
          </ng-container>

          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Code</th>
            <td mat-cell *matCellDef="let ecole">{{ ecole.code }}</td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let ecole">
              <mat-chip [class]="'puce-' + ecole.milieu.toLowerCase()">{{ ecole.milieu === 'URBAIN' ? 'Urbain' : 'Rural' }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="directeur">
            <th mat-header-cell *matHeaderCellDef>Directeur</th>
            <td mat-cell *matCellDef="let ecole">{{ ecole.directeur_nom || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="effectifs">
            <th mat-header-cell *matHeaderCellDef>Effectifs</th>
            <td mat-cell *matCellDef="let ecole">
              <span matTooltip="Enseignants">👤 {{ ecole.nombre_enseignants }}</span>
              &nbsp;
              <span matTooltip="Élèves">🎓 {{ ecole.nombre_eleves }}</span>
              &nbsp;
              <span matTooltip="Classes">🏫 {{ ecole.nombre_classes }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let ecole">
              <button mat-icon-button (click)="allerVersFormulaire(ecole.id)" matTooltip="Modifier">
                <mat-icon>edit</mat-icon>
              </button>
              @if (auth.hasRole('ADMIN', 'CHEF_IEPP')) {
                <button mat-icon-button (click)="confirmerSuppression(ecole)" matTooltip="Supprimer">
                  <mat-icon color="warn">delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colonnesAffichees"></tr>
          <tr mat-row *matRowDef="let row; columns: colonnesAffichees;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .entete-page {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .champ-recherche { width: 100%; max-width: 400px; margin-bottom: 16px; }
    .tableau-ecoles { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    mat-chip.puce-urbain { background: var(--iepp-vert-clair); color: var(--iepp-vert); }
    mat-chip.puce-rural { background: var(--iepp-orange-clair); color: var(--iepp-orange); }
  `],
})
export class SchoolListComponent implements OnInit {
  ecoles = signal<School[]>([]);
  chargement = signal(true);
  terme = '';
  colonnesAffichees = ['nom', 'code', 'type', 'directeur', 'effectifs', 'actions'];

  private timeoutRecherche: any;

  constructor(
    private schoolService: SchoolService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.charger();
  }

  peutGerer(): boolean {
    return this.auth.hasRole('ADMIN', 'CHEF_IEPP', 'DIRECTEUR');
  }

  charger() {
    this.chargement.set(true);
    this.schoolService.liste(this.terme).subscribe({
      next: (reponse) => {
        this.ecoles.set(reponse.results);
        this.chargement.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des écoles.', 'Fermer', { duration: 4000 });
        this.chargement.set(false);
      },
    });
  }

  rechercher() {
    clearTimeout(this.timeoutRecherche);
    this.timeoutRecherche = setTimeout(() => this.charger(), 400);
  }

  allerVersFormulaire(id?: number) {
    this.router.navigate(id ? ['/schools', id] : ['/schools/nouveau']);
  }

  confirmerSuppression(ecole: School) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titre: 'Supprimer cette école ?',
        message: `Cette action est irréversible : "${ecole.nom}" (${ecole.code}) sera définitivement supprimée.`,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (confirme) {
        this.schoolService.supprimer(ecole.id).subscribe({
          next: () => {
            this.snackBar.open('École supprimée.', 'Fermer', { duration: 3000 });
            this.charger();
          },
          error: () => this.snackBar.open('Suppression impossible.', 'Fermer', { duration: 4000 }),
        });
      }
    });
  }
}