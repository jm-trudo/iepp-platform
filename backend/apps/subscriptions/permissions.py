from rest_framework.permissions import BasePermission
from apps.users.models import Role
from .models import Subscription


class SubscriptionActivePermission(BasePermission):
    """
    Permission globale (ajoutée à DEFAULT_PERMISSION_CLASSES) :
    bloque l'accès à l'API si l'abonnement de la circonscription
    est expiré ou suspendu.

    Exemptions :
    - Utilisateurs non authentifiés : laissé à IsAuthenticated de gérer.
    - Rôle ADMIN : jamais bloqué (doit pouvoir gérer les abonnements).
    - Routes /api/subscriptions/ : jamais bloquées, sinon le Chef IEPP
      ne pourrait plus consulter/renouveler son propre abonnement expiré.
    - Aucun abonnement encore créé : pas de blocage (évite de bloquer
      l'installation initiale avant toute configuration).
    """
    message = "L'abonnement de la circonscription a expiré ou est suspendu. Contactez l'administrateur."

    EXEMPT_PREFIXES = ("/api/subscriptions",)

    def has_permission(self, request, view):
        if request.path.startswith(self.EXEMPT_PREFIXES):
            return True

        user = request.user
        if not user or not user.is_authenticated:
            return True
        if user.role == Role.ADMIN:
            return True

        abonnement = Subscription.objects.order_by("-date_fin").first()
        if not abonnement:
            return True

        abonnement.actualiser_statut()
        return abonnement.est_active()