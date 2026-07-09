from rest_framework import permissions
from apps.users.models import Role


class StudentPermission(permissions.BasePermission):
    """
    - Lecture : Admin, Chef IEPP (vue globale), Directeur (son école),
      Instituteur (sa classe) — filtré au niveau du queryset.
    - Création/Modification/Suppression :
        - Admin, Chef IEPP : partout
        - Instituteur : uniquement les élèves de SA classe
        - Directeur : lecture seule (rôle de supervision)
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return request.user.role in (
                Role.ADMIN, Role.CHEF_IEPP, Role.DIRECTEUR,
                Role.INSTITUTEUR, Role.CONSEILLER,
            )
        return request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.INSTITUTEUR)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if request.method in permissions.SAFE_METHODS:
            if user.role in (Role.ADMIN, Role.CHEF_IEPP):
                return True
            if user.role == Role.DIRECTEUR:
                return obj.ecole.directeur_id == user.id
            if user.role == Role.INSTITUTEUR:
                return obj.classe.enseignants.filter(user=user).exists()
            return False
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if user.role == Role.INSTITUTEUR:
            return obj.classe.enseignants.filter(user=user).exists()
        return False


class StudentCreatePermission(permissions.BasePermission):
    """
    Vérifie, à la création, qu'un Instituteur n'inscrit un élève
    que dans une classe dont il a la charge.
    """

    def validate_classe(self, user, classe):
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if user.role == Role.INSTITUTEUR:
            return classe.enseignants.filter(user=user).exists()
        return False
