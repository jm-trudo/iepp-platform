from rest_framework import viewsets
from apps.users.models import Role
from .models import School, Sector
from .serializers import SchoolSerializer, SectorSerializer
from .permissions import SchoolPermission


class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all().order_by("nom")
    serializer_class = SectorSerializer
    permission_classes = [SchoolPermission]


class SchoolViewSet(viewsets.ModelViewSet):
    serializer_class = SchoolSerializer
    permission_classes = [SchoolPermission]
    filterset_fields = ["type_ecole", "milieu", "secteur"]
    search_fields = ["nom", "code"]

    def get_queryset(self):
        user = self.request.user
        qs = School.objects.select_related("directeur", "secteur").all()

        if user.role in (Role.ADMIN, Role.CHEF_IEPP, Role.CONSEILLER):
            # Vue globale pour l'Admin et le Chef IEPP.
            # Le Conseiller sera restreint à son secteur à la Section 5.
            return qs
        if user.role == Role.DIRECTEUR:
            return qs.filter(directeur=user)
        # Instituteur : restreint à son école dès que le module
        # Enseignants (Section 5) reliera User <-> School.
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == Role.DIRECTEUR:
            serializer.save(directeur=user)
        else:
            serializer.save()
