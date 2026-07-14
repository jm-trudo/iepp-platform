export interface StatistiquesGenerales {
  nombre_ecoles: number;
  nombre_enseignants: number;
  nombre_eleves: number;
  nombre_classes: number;
  nombre_directeurs: number;
  nombre_demandes_en_attente: number;
}

export interface MoyenneMatiere {
  matiere: string;
  matiere_display: string;
  moyenne: number | null;
  nombre_notes: number;
}

export interface ClassementEleve {
  eleve_id: number;
  nom: string;
  prenoms: string;
  ecole: string;
  moyenne: number | null;
  nombre_notes: number;
}

export interface ClassementClasse {
  classe_id: number;
  niveau: string;
  libelle: string;
  ecole: string;
  moyenne: number | null;
  nombre_notes: number;
}

export interface ClassementEcole {
  ecole_id: number;
  ecole_nom: string;
  moyenne: number | null;
  nombre_notes: number;
}

export interface AnalysePedagogique {
  points_forts: MoyenneMatiere[];
  matieres_faibles: MoyenneMatiere[];
  commentaires: string[];
}

export interface DashboardData {
  statistiques_generales: StatistiquesGenerales;
  moyennes_par_matiere: MoyenneMatiere[];
  classement_eleves: ClassementEleve[];
  classement_classes: ClassementClasse[];
  classement_ecoles: ClassementEcole[];
  analyse_pedagogique: AnalysePedagogique;
}