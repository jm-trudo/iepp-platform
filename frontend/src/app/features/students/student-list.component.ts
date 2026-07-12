import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/student.model';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <h2>Élèves</h2>
      @if (peutAjouter()) {
        <button mat-flat-button color="primary" (click)="allerVersFormulaire()">
          <mat-icon>add</mat-icon> Nouvel élève
        </button>
      }
    </div>

    <mat-form-field appearance="outline" class="champ-recherche">
      <mat-label>Rechercher un élève</mat-label>
      <input matInput [(ngModel)]="terme" (ngModelChange)="rechercher()" placeholder="Nom ou prénoms..." />
      <mat-icon matSuffix>search</mat-icon>
    </mat-form-field>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement des élèves...</p>
      } @else if (eleves().length === 0) {
        <p class="message-etat">Aucun élève trouvé.</p>
      } @else {
        <table mat-table [dataSource]="eleves()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="nom">
            <th mat-header-cell *matHeaderCellDef>Nom et prénoms</th>
            <td mat-cell *matCellDef="let e">{{ e.nom }} {{ e.prenoms }}</td>
          </ng-container>

          <ng-container matColumnDef="classe">
            <th mat-header-cell *matHeaderCellDef>Classe</th>
            <td mat-cell *matCellDef="let e">{{ e.classe_display }}</td>
          </ng-container>

          <ng-container matColumnDef="ecole">
            <th mat-header-cell *matHeaderCellDef>École</th>
            <td mat-cell *matCellDef="let e">{{ e.ecole_nom }}</td>
          </ng-container>

          <ng-container matColumnDef="parent">
            <th mat-header-cell *matHeaderCellDef>Parent/Tuteur</th>
            <td mat-cell *matCellDef="let e">{{ e.nom_parent || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button (click)="allerVersFormulaire(e.id)"><mat-icon>edit</mat-icon></button>
              @if (auth.hasRole('ADMIN', 'CHEF_IEPP', 'INSTITUTEUR')) {
                <button mat-icon-button (click)="confirmerSuppression(e)"><mat-icon color="warn">delete</mat-icon></button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colonnes"></tr>
          <tr mat-row *matRowDef="let row; columns: colonnes;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .entete-page { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .champ-recherche { width: 100%; max-width: 400px; margin-bottom: 16px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
  `],
})
export class StudentListComponent implements OnInit {
  eleves = signal<Student[]>([]);
  chargement = signal(true);
  terme = '';
  colonnes = ['nom', 'classe', 'ecole', 'parent', 'actions'];

  private timeoutRecherche: any;

  constructor(
    private studentService: StudentService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() { this.charger(); }

  peutAjouter(): boolean {
    return this.auth.hasRole('ADMIN', 'CHEF_IEPP', 'INSTITUTEUR');
  }

  charger() {
    this.chargement.set(true);
    this.studentService.liste(this.terme).subscribe({
      next: (r) => { this.eleves.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  rechercher() {
    clearTimeout(this.timeoutRecherche);
    this.timeoutRecherche = setTimeout(() => this.charger(), 400);
  }

  allerVersFormulaire(id?: number) {
    this.router.navigate(id ? ['/students', id] : ['/students/nouveau']);
  }

  confirmerSuppression(eleve: Student) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titre: 'Supprimer cet élève ?',
        message: `"${eleve.nom} ${eleve.prenoms}" sera définitivement supprimé(e).`,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (confirme) {
        this.studentService.supprimer(eleve.id).subscribe({
          next: () => { this.snackBar.open('Élève supprimé.', 'Fermer', { duration: 3000 }); this.charger(); },
          error: () => this.snackBar.open('Suppression impossible.', 'Fermer', { duration: 4000 }),
        });
      }
    });
  }
}