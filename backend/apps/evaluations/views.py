from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from apps.users.models import Role
from .models import Note
from .serializers import NoteSerializer, BulkNoteSerializer
from .permissions import NotePermission
from apps.subscriptions.permissions import SubscriptionActivePermission


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [NotePermission, SubscriptionActivePermission]
    filterset_fields = ["classe", "eleve", "matiere", "composition", "annee_scolaire"]

    def get_queryset(self):
        user = self.request.user
        qs = Note.objects.select_related("eleve", "classe", "enseignant")

        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        if user.role == Role.DIRECTEUR:
            return qs.filter(eleve__ecole__directeur=user)
        if user.role == Role.INSTITUTEUR:
            return qs.filter(classe__enseignants__user=user)
        if user.role == Role.CONSEILLER:
            profile = getattr(user, "conseiller_profile", None)
            secteur = profile.secteur if profile else None
            return qs.filter(eleve__ecole__secteur=secteur) if secteur else qs.none()
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        eleve = serializer.validated_data["eleve"]
        if user.role == Role.INSTITUTEUR and not eleve.classe.enseignants.filter(user=user).exists():
            raise PermissionDenied("Vous ne pouvez saisir des notes que pour votre propre classe.")
        serializer.save(enseignant=user)

    def perform_update(self, serializer):
        user = self.request.user
        eleve = serializer.validated_data.get("eleve", serializer.instance.eleve)
        if user.role == Role.INSTITUTEUR and not eleve.classe.enseignants.filter(user=user).exists():
            raise PermissionDenied("Vous ne pouvez modifier que les notes de votre propre classe.")
        serializer.save(enseignant=user)

    @action(detail=False, methods=["post"], url_path="saisie-groupee")
    def saisie_groupee(self, request):
        """
        Saisie en une seule requête des notes de toute une classe
        pour une matière et une composition données.
        Crée ou met à jour (upsert) selon la contrainte unique_together.
        """
        serializer = BulkNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        classe = data["classe"]
        user = request.user

        if user.role == Role.INSTITUTEUR and not classe.enseignants.filter(user=user).exists():
            raise PermissionDenied("Vous ne pouvez saisir des notes que pour votre propre classe.")
        if user.role not in (Role.ADMIN, Role.CHEF_IEPP, Role.INSTITUTEUR):
            raise PermissionDenied("Rôle non autorisé à saisir des notes.")

        resultats = []
        with transaction.atomic():
            for entree in data["notes"]:
                note, _ = Note.objects.update_or_create(
                    eleve=entree["eleve"],
                    matiere=data["matiere"],
                    composition=data["composition"],
                    annee_scolaire=data["annee_scolaire"],
                    defaults={"valeur": entree["valeur"], "enseignant": user},
                )
                resultats.append(note)

        return Response(
            NoteSerializer(resultats, many=True).data,
            status=status.HTTP_201_CREATED,
        )
