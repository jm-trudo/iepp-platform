import { Injectable } from '@angular/core';
import { NavItem } from '../models/nav-item.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly TOUS_LES_MENUS: NavItem[] = [
    { label: 'Tableau de bord', icone: 'dashboard', route: '/dashboard', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'INSTITUTEUR', 'CONSEILLER'] },
    { label: 'Écoles', icone: 'apartment', route: '/schools', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'CONSEILLER'] },
    { label: 'Classes', icone: 'meeting_room', route: '/classes', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'INSTITUTEUR', 'CONSEILLER'] },
    { label: 'Enseignants', icone: 'school', route: '/teachers', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR'] },
    { label: 'Élèves', icone: 'groups', route: '/students', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'INSTITUTEUR', 'CONSEILLER'] },
    { label: 'Notes', icone: 'edit_note', route: '/evaluations', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'INSTITUTEUR', 'CONSEILLER'] },
    { label: 'Autorisations', icone: 'assignment', route: '/authorizations', rolesAutorises: ['ADMIN', 'CHEF_IEPP', 'DIRECTEUR', 'INSTITUTEUR', 'CONSEILLER'] },
    { label: 'Abonnement', icone: 'card_membership', route: '/subscriptions', rolesAutorises: ['ADMIN', 'CHEF_IEPP'] },
    { label: 'Utilisateurs', icone: 'manage_accounts', route: '/settings/users', rolesAutorises: ['ADMIN', 'CHEF_IEPP'] },
  ];

  menusPourRole(role: string): NavItem[] {
    return this.TOUS_LES_MENUS.filter((item) => item.rolesAutorises.includes(role));
  }
}