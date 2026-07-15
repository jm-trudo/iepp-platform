export interface Circonscription {
  id: number;
  nom: string;
  chef: number;
  chef_nom: string;
  logo: string | null;
  nombre_ecoles: number;
  date_creation: string;
}