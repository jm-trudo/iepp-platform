export type Role = 'ADMIN' | 'CHEF_IEPP' | 'DIRECTEUR' | 'INSTITUTEUR' | 'CONSEILLER';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  role_display: string;
  telephone: string;
  matricule: string;
  is_active: boolean;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}