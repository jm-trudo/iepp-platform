from rest_framework import viewsets
from apps.users.models import User, Role
from .models import School, Sector, ConseillerProfile
from .serializers import SchoolSerializer, SectorSerializer, ConseillerSerializer
from .permissions import SchoolPermission, ConseillerManagePermission
from apps.subscriptions.permissions import SubscriptionActivePermission


class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all().order_by("nom")
    serializer_class = SectorSerializer
    permission_classes = [SchoolPermission, SubscriptionActivePermission]


class ConseillerViewSet(viewsets.ModelViewSet):
    serializer_class = ConseillerSerializer
    permission_classes = [SchoolPermission, SubscriptionActivePermission]
    queryset = User.objects.filter(role=Role.CONSEILLER).select_related("conseiller_profile")

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            return self.queryset
        if user.role == Role.CHEF_IEPP:
            circo = getattr(user, "circonscription_dirigee", None)
            return (
                 self.queryset.filter(conseiller_profile__secteur__ecoles__circonscription=circo).distinct()
                 if circo else self.queryset.none()
            )
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
    permission_classes = [SchoolPermission, SubscriptionActivePermission]
    filterset_fields = ["type_ecole", "milieu", "secteur"]
    search_fields = ["nom", "code"]

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.select_related("directeur", "secteur", "circonscription").all()

        if user.role == Role.ADMIN:
           return qs
        if user.role == Role.CHEF_IEPP:
             circo = getattr(user, "circonscription_dirigee", None)
             return qs.filter(circonscription=circo) if circo else qs.none()
        if user.role == Role.CONSEILLER:
           profile = getattr(user, "conseiller_profile", None)
           secteur = profile.secteur if profile else None
           return qs.filter(secteur=secteur) if secteur else qs.none()
        if user.role == Role.DIRECTEUR:
           return qs.filter(directeur=user)
        if user.role == Role.INSTITUTEUR:
           profile = getattr(user, "teacher_profile", None)
           return qs.filter(id=profile.ecole_id) if profile and profile.ecole_id else qs.none()
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == Role.CHEF_IEPP:
            circo = getattr(user, "circonscription_dirigee", None)
            serializer.save(circonscription=circo)
        else:  # ADMIN
            serializer.save()