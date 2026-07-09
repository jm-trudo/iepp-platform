from rest_framework import permissions
from apps.users.models import Role


class SchoolPermission(permissions.BasePermission):
    """
    - Lecture (GET) : tout utilisateur authentifié.
    - Création : Admin, Chef IEPP, ou Directeur (pour créer sa propre école).
    - Modification : Admin, Chef IEPP, ou le Directeur de CETTE école.
    - Suppression : Admin, Chef IEPP uniquement.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.method == "POST":
            return request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.DIRECTEUR)
        if request.method == "DELETE":
            return request.user.role in (Role.ADMIN, Role.CHEF_IEPP)
        return True  # PUT/PATCH : vérifié finement au niveau objet ci-dessous

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if request.method in ("PUT", "PATCH") and request.user.role == Role.DIRECTEUR:
            return obj.directeur_id == request.user.id
        return False
    
class ConseillerManagePermission(permissions.BasePermission):
    """
    - Admin / Chef IEPP : accès complet (y compris affectation du secteur).
    - Conseiller : consultation/modification de sa propre fiche uniquement,
      sans pouvoir s'auto-affecter un secteur.
    """
    def has_permission(self, request, view):
        return request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.CONSEILLER)

    def has_object_permission(self, request, view, obj):
        if request.user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        return obj.id == request.user.id   