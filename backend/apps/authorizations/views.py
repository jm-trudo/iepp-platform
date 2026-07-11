from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.models import Role
from .models import AuthorizationRequest, StatutDemande
from .serializers import AuthorizationRequestSerializer, DecisionSerializer
from .permissions import AuthorizationPermission, IsChefOrAdmin
from .pdf import generate_authorization_pdf
from apps.subscriptions.permissions import SubscriptionActivePermission


class AuthorizationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = AuthorizationRequestSerializer
    permission_classes = [AuthorizationPermission, SubscriptionActivePermission]
    filterset_fields = ["statut", "ecole"]

    def get_queryset(self):
        user = self.request.user
        qs = AuthorizationRequest.objects.select_related("agent", "ecole", "chef")
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        return qs.filter(agent=user)

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsChefOrAdmin])
    def accepter(self, request, pk=None):
        return self._decider(request, pk, StatutDemande.ACCEPTEE)

    @action(detail=True, methods=["post"], permission_classes=[IsChefOrAdmin])
    def refuser(self, request, pk=None):
        return self._decider(request, pk, StatutDemande.REFUSEE)

    def _decider(self, request, pk, statut):
        demande = self.get_object()
        if demande.statut != StatutDemande.EN_ATTENTE:
            return Response(
                {"detail": "Cette demande a déjà été traitée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = DecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        demande.statut = statut
        demande.commentaire_chef = serializer.validated_data.get("commentaire", "")
        demande.chef = request.user
        demande.date_decision = timezone.now()
        demande.save()

        return Response(AuthorizationRequestSerializer(demande).data)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        demande = self.get_object()
        if demande.statut == StatutDemande.EN_ATTENTE:
            return Response(
                {"detail": "Le document ne peut être généré qu'une fois la demande tranchée."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        buffer = generate_authorization_pdf(demande)
        filename = f"autorisation_{demande.agent.username}_{demande.id}.pdf"
        return FileResponse(buffer, as_attachment=True, filename=filename)
