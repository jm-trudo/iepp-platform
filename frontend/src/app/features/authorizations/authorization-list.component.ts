import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthorizationService } from '../../core/services/authorization.service';
import { AuthorizationRequest } from '../../core/models/authorization.model';
import { AuthService } from '../../core/services/auth.service';
import { DecisionDialogComponent } from './decision-dialog.component';

@Component({
  selector: 'app-authorization-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatFormFieldModule, MatSelectModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="entete-page">
      <h2>Demandes d'autorisation</h2>
      <button mat-flat-button color="primary" (click)="allerVersFormulaire()">
        <mat-icon>add</mat-icon> Nouvelle demande
      </button>
    </div>

    <mat-form-field appearance="outline" class="champ-filtre">
      <mat-label>Filtrer par statut</mat-label>
      <mat-select [(ngModel)]="statutFiltre" (selectionChange)="charger()">
        <mat-option [value]="null">Toutes</mat-option>
        <mat-option value="EN_ATTENTE">En attente</mat-option>
        <mat-option value="ACCEPTEE">Acceptées</mat-option>
        <mat-option value="REFUSEE">Refusées</mat-option>
      </mat-select>
    </mat-form-field>

    <div class="iepp-carte">
      @if (chargement()) {
        <p class="message-etat">Chargement...</p>
      } @else if (demandes().length === 0) {
        <p class="message-etat">Aucune demande trouvée.</p>
      } @else {
        <table mat-table [dataSource]="demandes()" class="tableau-pleine-largeur">
          <ng-container matColumnDef="agent">
            <th mat-header-cell *matHeaderCellDef>Agent</th>
            <td mat-cell *matCellDef="let d">{{ d.agent_nom }} <span class="fonction">({{ d.fonction_agent }})</span></td>
          </ng-container>
          <ng-container matColumnDef="motif">
            <th mat-header-cell *matHeaderCellDef>Motif</th>
            <td mat-cell *matCellDef="let d">{{ d.motif }}</td>
          </ng-container>
          <ng-container matColumnDef="periode">
            <th mat-header-cell *matHeaderCellDef>Période</th>
            <td mat-cell *matCellDef="let d">{{ d.date_depart | date:'dd/MM/yy' }} → {{ d.date_retour | date:'dd/MM/yy' }} ({{ d.nombre_jours }}j)</td>
          </ng-container>
          <ng-container matColumnDef="statut">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let d">
              <mat-chip [class]="'puce-' + d.statut.toLowerCase()">{{ libelleStatut(d.statut) }}</mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let d">
              @if (d.statut === 'EN_ATTENTE' && auth.hasRole('ADMIN', 'CHEF_IEPP')) {
                <button mat-icon-button color="primary" (click)="ouvrirDecision(d, true)" matTooltip="Accepter">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="ouvrirDecision(d, false)" matTooltip="Refuser">
                  <mat-icon>cancel</mat-icon>
                </button>
              }
              @if (d.statut !== 'EN_ATTENTE') {
                <button mat-icon-button (click)="telechargerPdf(d)" matTooltip="Télécharger le PDF">
                  <mat-icon>picture_as_pdf</mat-icon>
                </button>
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
    .champ-filtre { width: 100%; max-width: 260px; margin-bottom: 16px; }
    .tableau-pleine-largeur { width: 100%; }
    .message-etat { text-align: center; color: #757575; padding: 32px; }
    .fonction { color: #9E9E9E; font-size: 0.85em; }
    mat-chip.puce-en_attente { background: #FFF3E0; color: #E65100; }
    mat-chip.puce-acceptee { background: var(--iepp-vert-clair); color: var(--iepp-vert); }
    mat-chip.puce-refusee { background: #FFEBEE; color: #C62828; }
  `],
})
export class AuthorizationListComponent implements OnInit {
  demandes = signal<AuthorizationRequest[]>([]);
  chargement = signal(true);
  statutFiltre: string | null = null;
  colonnes = ['agent', 'motif', 'periode', 'statut', 'actions'];

  constructor(
    private authorizationService: AuthorizationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() { this.charger(); }

  charger() {
    this.chargement.set(true);
    this.authorizationService.liste(this.statutFiltre ?? undefined).subscribe({
      next: (r) => { this.demandes.set(r.results); this.chargement.set(false); },
      error: () => { this.snackBar.open('Erreur de chargement.', 'Fermer', { duration: 4000 }); this.chargement.set(false); },
    });
  }

  libelleStatut(statut: string): string {
    return { EN_ATTENTE: 'En attente', ACCEPTEE: 'Acceptée', REFUSEE: 'Refusée' }[statut] ?? statut;
  }

  allerVersFormulaire() {
    this.router.navigate(['/authorizations/nouveau']);
  }

  ouvrirDecision(demande: AuthorizationRequest, estAcceptation: boolean) {
    const ref = this.dialog.open(DecisionDialogComponent, {
      data: {
        titre: estAcceptation ? 'Accepter cette demande ?' : 'Refuser cette demande ?',
        estAcceptation,
      },
    });
    ref.afterClosed().subscribe((commentaire) => {
      if (commentaire === null || commentaire === undefined) return;
      const requete = estAcceptation
        ? this.authorizationService.accepter(demande.id, commentaire)
        : this.authorizationService.refuser(demande.id, commentaire);

      requete.subscribe({
        next: () => {
          this.snackBar.open('Décision enregistrée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: () => this.snackBar.open('Erreur lors de la décision.', 'Fermer', { duration: 4000 }),
      });
    });
  }

  telechargerPdf(demande: AuthorizationRequest) {
    this.authorizationService.telechargerPdf(demande.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = `autorisation_${demande.agent_nom}_${demande.id}.pdf`;
        lien.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Téléchargement impossible.', 'Fermer', { duration: 4000 }),
    });
  }
}