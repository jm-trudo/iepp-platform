export interface TeacherProfileData {
  ecole?: number;
  ecole_nom?: string;
  classe?: number;
  classe_display?: string;
  sexe?: 'M' | 'F' | '';
  date_affectation?: string;
}

export interface Teacher {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone?: string;
  matricule?: string;
  is_active: boolean;
  profile?: TeacherProfileData;
}