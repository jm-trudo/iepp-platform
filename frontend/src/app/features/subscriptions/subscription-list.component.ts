import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { SubscriptionService } from '../../core/services/subscription.service';
import { Subscription } from '../../core/models/subscription.model';
import { AuthService } from '../../core/services/auth.service';

import { SubscriptionFormDialogComponent } from './subscription-form-dialog.component';


@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  template: `

    <h2>Abonnements</h2>


    @if (!auth.hasRole('ADMIN')) {

      @if (monAbonnement(); as a) {

        <mat-card class="iepp-carte carte-statut"
          [class.carte-alerte]="!a.est_active">

          <mat-icon class="icone-statut">
            {{ a.est_active ? 'verified' : 'error' }}
          </mat-icon>

          <h3>
            {{ a.est_active 
              ? 'Abonnement actif'
              : 'Abonnement expiré ou suspendu'
            }}
          </h3>


          <p>
            Valide du
            {{ a.date_debut | date:'dd/MM/yyyy' }}
            au
            {{ a.date_fin | date:'dd/MM/yyyy' }}
          </p>


          @if (a.est_active) {

            <p class="jours-restants">
              {{ a.jours_restants }} jour(s) restant(s)
            </p>

          } @else {

            <p class="message-contact">
              Contactez l'administrateur pour renouveler votre abonnement.
            </p>

          }

        </mat-card>


      } @else if (chargement()) {

        <p class="message-etat">
          Chargement...
        </p>

      } @else {

        <p class="message-etat">
          Aucun abonnement configuré.
        </p>

      }


    } @else {


      <div class="entete-page">

        <span></span>

        <button mat-flat-button color="primary"
          (click)="ouvrirFormulaire()">

          <mat-icon>add</mat-icon>
          Nouvel abonnement

        </button>

      </div>



      <div class="iepp-carte">


        @if (chargement()) {

          <p class="message-etat">
            Chargement...
          </p>


        } @else if (abonnements().length === 0) {

          <p class="message-etat">
            Aucun abonnement créé.
          </p>


        } @else {


          <table mat-table
            [dataSource]="abonnements()"
            class="tableau-pleine-largeur">


            <ng-container matColumnDef="chef">

              <th mat-header-cell *matHeaderCellDef>
                Chef IEPP
              </th>

              <td mat-cell *matCellDef="let a">
                {{a.chef_nom}}
              </td>

            </ng-container>



            <ng-container matColumnDef="periode">

              <th mat-header-cell *matHeaderCellDef>
                Période
              </th>

              <td mat-cell *matCellDef="let a">

                {{a.date_debut | date:'dd/MM/yy'}}
                →
                {{a.date_fin | date:'dd/MM/yy'}}

              </td>

            </ng-container>



            <ng-container matColumnDef="statut">

              <th mat-header-cell *matHeaderCellDef>
                Statut
              </th>

              <td mat-cell *matCellDef="let a">

                <mat-chip>
                  {{libelleStatut(a.statut)}}
                </mat-chip>

              </td>

            </ng-container>



            <ng-container matColumnDef="joursRestants">

              <th mat-header-cell *matHeaderCellDef>
                Jours restants
              </th>

              <td mat-cell *matCellDef="let a">

                {{a.est_active ? a.jours_restants : '—'}}

              </td>

            </ng-container>



            <ng-container matColumnDef="montant">

              <th mat-header-cell *matHeaderCellDef>
                Montant
              </th>

              <td mat-cell *matCellDef="let a">

                {{a.montant ? (a.montant | number) + ' F CFA' : '—'}}

              </td>

            </ng-container>



            <ng-container matColumnDef="actions">

              <th mat-header-cell *matHeaderCellDef></th>

              <td mat-cell *matCellDef="let a">

                <button mat-icon-button
                  (click)="ouvrirFormulaire(a)">

                  <mat-icon>
                    edit
                  </mat-icon>

                </button>

              </td>

            </ng-container>



            <tr mat-header-row
              *matHeaderRowDef="colonnes">
            </tr>


            <tr mat-row
              *matRowDef="let row; columns: colonnes;">
            </tr>


          </table>

        }


      </div>


    }

  `,

  styles: [`

    .entete-page {
      display:flex;
      justify-content:space-between;
      align-items:center;
      margin-bottom:16px;
    }


    .tableau-pleine-largeur {
      width:100%;
    }


    .message-etat {
      text-align:center;
      padding:32px;
      color:#757575;
    }


    .carte-statut {
      max-width:460px;
      margin:24px auto;
      text-align:center;
      padding:32px;
    }


    .carte-alerte {
      border:2px solid #C62828;
    }


    .jours-restants {
      color:green;
      font-weight:bold;
    }


    .message-contact {
      color:#C62828;
    }


  `]
})
export class SubscriptionListComponent implements OnInit {


  abonnements = signal<Subscription[]>([]);

  monAbonnement = signal<Subscription | null>(null);

  chargement = signal<boolean>(true);


  colonnes = [
    'chef',
    'periode',
    'statut',
    'joursRestants',
    'montant',
    'actions'
  ];



  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService
  ) {}



  ngOnInit(): void {

    this.charger();

  }



  charger() {


    this.chargement.set(true);



    if (this.auth.hasRole('ADMIN')) {


      this.subscriptionService.liste()
      .subscribe({

        next:(r)=>{

          this.abonnements.set(r.results);

          this.chargement.set(false);

        },


        error:()=>{

          this.snackBar.open(
            'Erreur de chargement.',
            'Fermer',
            {duration:4000}
          );

          this.chargement.set(false);

        }

      });



    } else {



      this.subscriptionService.monStatut()
      .subscribe({

        next:(a)=>{

          this.monAbonnement.set(a);

          this.chargement.set(false);

        },


        error:()=>{

          this.chargement.set(false);

        }

      });


    }


  }



  libelleStatut(statut:string):string {

    const labels:any = {

      ACTIF:'Actif',
      EXPIRE:'Expiré',
      SUSPENDU:'Suspendu'

    };


    return labels[statut] ?? statut;

  }




  ouvrirFormulaire(abonnement?:Subscription){


    const ref = this.dialog.open(
      SubscriptionFormDialogComponent,
      {
        width:'480px',
        data:{
          abonnement
        }
      }
    );


    ref.afterClosed()
    .subscribe((result)=>{

      if(result){

        this.charger();

      }

    });


  }


}