from rest_framework import viewsets
from apps.users.models import User, Role
from .models import School, Sector, ConseillerProfile
from .serializers import SchoolSerializer, SectorSerializer, ConseillerSerializer
from .permissions import SchoolPermission, ConseillerManagePermission


class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all().order_by("nom")
    serializer_class = SectorSerializer
    permission_classes = [SchoolPermission]


class ConseillerViewSet(viewsets.ModelViewSet):
    serializer_class = ConseillerSerializer
    permission_classes = [ConseillerManagePermission]
    queryset = User.objects.filter(role=Role.CONSEILLER).select_related("conseiller_profile")

    def get_queryset(self):
        user = self.request.user
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return self.queryset
        return self.queryset.filter(id=user.id)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == Role.CONSEILLER:
            serializer.validated_data.get("conseiller_profile", {}).pop("secteur", None)
        serializer.save()


def _secteur_de(user):
    """Utilitaire : renvoie le secteur attribué à un Conseiller, ou None."""
    profile = getattr(user, "conseiller_profile", None)
    return profile.secteur if profile else None


class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [SchoolPermission]
    filterset_fields = ["type_ecole", "milieu", "secteur"]
    search_fields = ["nom", "code"]

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.select_related("directeur", "secteur").all()

        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return qs
        if user.role == Role.CONSEILLER:
         profile = getattr(user, "conseiller_profile", None)
        secteur = profile.secteur if profile else None
        return qs.filter(ecole__secteur=secteur) if secteur else qs.none()
        if user.role == Role.DIRECTEUR:
            return qs.filter(directeur=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == Role.DIRECTEUR:
            serializer.save(directeur=user)
        else:
            serializer.save()