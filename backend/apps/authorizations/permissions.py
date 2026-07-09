from rest_framework import permissions
from apps.users.models import Role


class AuthorizationPermission(permissions.BasePermission):
    """
    - Création : tout utilisateur authentifié (soumet sa propre demande).
    - Lecture : l'agent voit ses propres demandes ; Admin/Chef IEPP voient tout.
    - Décision (accepter/refuser) : Admin, Chef IEPP uniquement.
    - Modification/suppression d'une demande déjà tranchée : interdite à tous
      sauf Admin (traçabilité).
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return True
        if request.method in permissions.SAFE_METHODS:
            return obj.agent_id == user.id
        # Modification/suppression : uniquement sa propre demande, et
        # seulement tant qu'elle est encore en attente.
        return obj.agent_id == user.id and obj.statut == "EN_ATTENTE"


class IsChefOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.CHEF_IEPP)
        )
