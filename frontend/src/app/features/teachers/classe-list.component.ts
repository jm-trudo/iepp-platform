import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../core/services/teacher.service';
import { Classe } from '../../core/models/classe.model';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-classe-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="entete-page">
      <h2>Classes</h2>
      @if (auth.hasRole('ADMIN', 'CHEF_IEPP', 'DIRECTEUR')) {
        <button mat-flat-button color="primary" (click)="allerVersFormulaire()">
          <mat-icon>add</mat-icon> Nouvelle classe
        </button>
      }
    </div>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement...</p>
      } @else if (classes().length === 0) {
        <p class="message-etat">Aucune classe trouvée.</p>
      } @else {
        <table mat-table [dataSource]="classes()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="niveau">
            <th mat-header-cell *matHeaderCellDef>Niveau</th>
            <td mat-cell *matCellDef="let c">{{ c.niveau_display }} {{ c.libelle }}</td>
          </ng-container>
          <ng-container matColumnDef="ecole">
            <th mat-header-cell *matHeaderCellDef>École</th>
            <td mat-cell *matCellDef="let c">{{ c.ecole_nom }}</td>
          </ng-container>
          <ng-container matColumnDef="eleves">
            <th mat-header-cell *matHeaderCellDef>Élèves</th>
            <td mat-cell *matCellDef="let c">{{ c.nombre_eleves }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button (click)="allerVersFormulaire(c.id)"><mat-icon>edit</mat-icon></button>
              @if (auth.hasRole('ADMIN', 'CHEF_IEPP')) {
                <button mat-icon-button (click)="confirmerSuppression(c)"><mat-icon color="warn">delete</mat-icon></button>
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
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
  `],
})
export class ClasseListComponent implements OnInit {
  classes = signal<Classe[]>([]);
  chargement = signal(true);
  colonnes = ['niveau', 'ecole', 'eleves', 'actions'];

  constructor(
    private teacherService: TeacherService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.chargement.set(true);
    this.teacherService.listeClasses().subscribe({
      next: (r) => { this.classes.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  allerVersFormulaire(id?: number) {
    this.router.navigate(id ? ['/classes', id] : ['/classes/nouveau']);
  }

  confirmerSuppression(classe: Classe) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titre: 'Supprimer cette classe ?', message: `"${classe.niveau_display} ${classe.libelle}" sera définitivement supprimée.` },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (confirme) {
        this.teacherService.supprimerClasse(classe.id).subscribe({
          next: () => { this.snackBar.open('Classe supprimée.', 'Fermer', { duration: 3000 }); this.charger(); },
          error: () => this.snackBar.open('Suppression impossible.', 'Fermer', { duration: 4000 }),
        });
      }
    });
  }
}