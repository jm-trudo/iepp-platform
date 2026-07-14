export type StatutDemande = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface AuthorizationRequest {
  id: number;
  agent: number;
  agent_nom: string;
  fonction_agent: string;
  ecole: number | null;
  ecole_nom: string | null;
  motif: string;
  date_depart: string;
  date_retour: string;
  nombre_jours: number;
  piece_jointe: string | null;
  statut: StatutDemande;
  commentaire_chef: string;
  chef: number | null;
  chef_nom: string | null;
  date_decision: string | null;
  date_creation: string;
}