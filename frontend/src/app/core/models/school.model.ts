export interface Sector {
  id: number;
  nom: string;
}

export interface School {
  id: number;
  nom: string;
  code: string;
  type_ecole: 'PUBLIQUE' | 'PRIVEE' | 'COMMUNAUTAIRE' | 'CONFESSIONNELLE';
  milieu: 'URBAIN' | 'RURAL';
  adresse: string;
  telephone: string;
  email: string;
  directeur: number | null;
  directeur_nom: string | null;
  secteur: number | null;
  secteur_nom: string | null;
  nombre_enseignants: number;
  nombre_eleves: number;
  nombre_classes: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}