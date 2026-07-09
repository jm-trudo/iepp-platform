from rest_framework import permissions
from apps.users.models import Role


class NotePermission(permissions.BasePermission):
    """
    - Lecture : Admin, Chef IEPP (tout) ; Directeur (son école) ;
      Instituteur (sa classe) ; Conseiller (son secteur) — filtré au queryset.
    - Écriture (créer/modifier/supprimer) : Admin, Chef IEPP, ou l'Instituteur
      en charge de la classe de l'élève concerné.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.INSTITUTEUR)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if request.method in permissions.SAFE_METHODS:
            if user.role == Role.DIRECTEUR:
                return obj.eleve.ecole.directeur_id == user.id
            if user.role == Role.INSTITUTEUR:
                return obj.classe.enseignants.filter(user=user).exists()
            if user.role == Role.CONSEILLER:
                profile = getattr(user, "conseiller_profile", None)
                return bool(profile and profile.secteur_id == obj.eleve.ecole.secteur_id)
            return False
        if user.role == Role.INSTITUTEUR:
            return obj.classe.enseignants.filter(user=user).exists()
        return False
