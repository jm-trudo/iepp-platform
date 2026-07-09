from rest_framework import permissions
from apps.users.models import Role


class ClassePermission(permissions.BasePermission):
    """
    - Lecture : tout utilisateur authentifié.
    - Écriture (créer/modifier/supprimer une classe) :
      Admin, Chef IEPP, ou Directeur de l'école concernée.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.DIRECTEUR)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        return obj.ecole.directeur_id == request.user.id


class TeacherManagePermission(permissions.BasePermission):
    """
    Gestion des fiches instituteurs :
    - Admin / Chef IEPP : accès complet.
    - Directeur : peut gérer les instituteurs de SON école.
    - Instituteur : peut consulter/modifier uniquement sa propre fiche
      (hors ecole/classe, réservés à Admin/Chef IEPP/Directeur).
    """
    def has_permission(self, request, view):
        return request.user.role in (
            Role.ADMIN, Role.CHEF_IEPP, Role.DIRECTEUR, Role.INSTITUTEUR
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if user.role == Role.DIRECTEUR:
            profile = getattr(obj, "teacher_profile", None)
            return bool(profile and profile.ecole and profile.ecole.directeur_id == user.id)
        if user.role == Role.INSTITUTEUR:
            return obj.id == user.id
        return False
