from rest_framework import permissions
from .models import Role


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.ADMIN)


class IsChefIEPP(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.CHEF_IEPP)


class IsDirecteur(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.DIRECTEUR)


class IsInstituteur(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.INSTITUTEUR)


class IsConseiller(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.CONSEILLER)


class IsAdminOrChefIEPP(permissions.BasePermission):
    """Gestion des comptes utilisateurs : réservée à l'Admin système et au Chef IEPP."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.CHEF_IEPP)
        )
class CanCreateTeacherAccount(permissions.BasePermission):
    """Admin/Chef IEPP créent n'importe quel compte ; le Directeur ne peut
    créer que des comptes Instituteur, forcés côté serveur (voir UserViewSet)."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.DIRECTEUR)
        )