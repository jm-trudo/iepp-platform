export interface Student {
  id: number;
  nom: string;
  prenoms: string;
  date_naissance: string | null;
  sexe: 'M' | 'F' | '';
  classe: number;
  classe_display: string;
  ecole: number;
  ecole_nom: string;
  nom_parent: string;
  contact_parent: string;
  date_inscription: string;
}