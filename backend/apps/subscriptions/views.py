from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.users.models import Role
from apps.users.permissions import IsAdmin
from .models import Subscription
from .serializers import SubscriptionSerializer


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "list"):
            return [IsAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Subscription.objects.select_related("chef")
        if user.role == Role.ADMIN:
            return qs
        if user.role == Role.CHEF_IEPP:
            return qs.filter(chef=user)
        return qs.none()

    @action(detail=False, methods=["get"], url_path="mon-statut", permission_classes=[IsAuthenticated])
    def mon_statut(self, request):
        """
        GET /api/subscriptions/mon-statut/
        Consultable par le Chef IEPP concerné (ou l'Admin), même si
        l'abonnement est expiré — c'est ce qui lui permet de voir
        qu'il doit renouveler.
        """
        user = request.user
        if user.role == Role.CHEF_IEPP:
            abonnement = Subscription.objects.filter(chef=user).first()
        elif user.role == Role.ADMIN:
            abonnement = Subscription.objects.order_by("-date_fin").first()
        else:
            return Response({"detail": "Non applicable à votre rôle."}, status=403)

        if not abonnement:
            return Response({"detail": "Aucun abonnement configuré."}, status=404)

        abonnement.actualiser_statut()
        return Response(SubscriptionSerializer(abonnement).data)
