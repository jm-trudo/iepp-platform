export interface Subscription {
  id: number;
  chef: number;
  chef_nom: string;
  date_debut: string;
  date_fin: string;
  statut: 'ACTIF' | 'EXPIRE' | 'SUSPENDU';
  montant: number | null;
  reference_paiement: string;
  jours_restants: number;
  est_active: boolean;
  notifie_expiration: boolean;
  date_creation: string;
}