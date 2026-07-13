export interface Note {
  id: number;
  eleve: number;
  eleve_nom: string;
  classe: number;
  matiere: string;
  matiere_display: string;
  composition: string;
  composition_display: string;
  valeur: number;
  annee_scolaire: string;
  enseignant_nom: string;
}

export const MATIERES = [
  { value: 'LECTURE', label: 'Lecture' },
  { value: 'EXPRESSION_ECRITE', label: 'Expression écrite' },
  { value: 'POESIE', label: 'Poésie' },
  { value: 'ECRITURE', label: 'Écriture' },
  { value: 'DICTEE', label: 'Dictée' },
  { value: 'MATHEMATIQUES', label: 'Mathématiques' },
  { value: 'EDHC', label: 'EDHC' },
  { value: 'EPS', label: 'EPS' },
  { value: 'CHANT', label: 'Chant' },
  { value: 'SCIENCES', label: 'Sciences et technologie' },
  { value: 'HISTOIRE_GEO', label: 'Histoire-Géographie' },
];

export const COMPOSITIONS = [
  { value: 'COMP1', label: 'Composition 1' },
  { value: 'COMP2', label: 'Composition 2' },
  { value: 'COMP3', label: 'Composition 3' },
  { value: 'COMP_FINALE', label: 'Composition finale' },
];

export function anneeScolaireCourante(): string {
  const auj = new Date();
  const mois = auj.getMonth() + 1; // 1-12
  const anneeDebut = mois >= 9 ? auj.getFullYear() : auj.getFullYear() - 1;
  return `${anneeDebut}-${anneeDebut + 1}`;
}