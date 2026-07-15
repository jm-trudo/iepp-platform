from rest_framework import viewsets, generics, permissions, serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Role, DirectorProfile, AuditLog
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    CustomTokenObtainPairSerializer,
    DirectorSerializer,
)
from .permissions import IsAdminOrChefIEPP
from .permissions import CanCreateTeacherAccount
from rest_framework import serializers
from django.db.models import Q
from apps.schools.models import School

class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/  -> {access, refresh, user}"""
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /api/auth/me/ : profil de l'utilisateur connecté."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("last_name", "first_name")

    def get_permissions(self):
        if self.action == "create":
            return [CanCreateTeacherAccount()]
        return [IsAdminOrChefIEPP()]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all().order_by("last_name", "first_name")
        if user.role == Role.ADMIN:
            return qs
        if user.role == Role.CHEF_IEPP:
            circo = getattr(user, "circonscription_dirigee", None)
            if not circo:
                return qs.filter(id=user.id)
            return qs.filter(
                Q(id=user.id)
                | Q(ecole_dirigee__circonscription=circo)
                | Q(teacher_profile__ecole__circonscription=circo)
                | Q(conseiller_profile__secteur__ecoles__circonscription=circo)
            ).distinct()
        return qs.filter(id=user.id)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        createur = self.request.user
        if createur.role == Role.DIRECTEUR:
            serializer.save(role=Role.INSTITUTEUR)
        elif createur.role == Role.CHEF_IEPP:
            role_demande = serializer.validated_data.get("role")
            if role_demande not in (Role.DIRECTEUR, Role.INSTITUTEUR, Role.CONSEILLER):
                raise serializers.ValidationError(
                    {"role": "Vous ne pouvez créer que des comptes Directeur, Instituteur ou Conseiller."}
                )
            serializer.save()
        else:  # ADMIN
            serializer.save()
    

class DirectorViewSet(viewsets.ModelViewSet):
    """
    Liste et fiches des Directeurs.
    - Admin / Chef IEPP : accès complet (lecture + écriture, y compris date de prise de fonction)
    - Directeur : peut uniquement consulter et modifier SA PROPRE fiche
      (sexe, date de naissance) — la date de prise de fonction reste
      administrative, modifiable seulement par Admin/Chef IEPP.
    """
    serializer_class = DirectorSerializer
    queryset = User.objects.filter(role=Role.DIRECTEUR).select_related(
    "director_profile", "ecole_dirigee"
).prefetch_related("ecole_dirigee")
    

    def get_permissions(self):
        if self.action in ("list", "create", "destroy"):
            return [IsAdminOrChefIEPP()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            return self.queryset
        if user.role == Role.CHEF_IEPP:
            circo = getattr(user, "circonscription_dirigee", None)
            return self.queryset.filter(ecole_dirigee__circonscription=circo) if circo else self.queryset.none()
        return self.queryset.filter(id=user.id)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == Role.DIRECTEUR and user.id != serializer.instance.id:
            raise permissions.PermissionDenied("Vous ne pouvez modifier que votre propre fiche.")
        if user.role == Role.DIRECTEUR:
            # Un directeur ne peut pas s'auto-affecter une date de prise de fonction
            serializer.validated_data.get("director_profile", {}).pop(
                "date_prise_fonction", None
            )
        serializer.save()


class AuditLogSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source="utilisateur.get_full_name", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id", "utilisateur", "utilisateur_nom", "action",
            "modele", "objet_id", "objet_repr", "date_action",
        ]


class AuditLogListView(generics.ListAPIView):
    """GET /api/auth/audit-log/ — réservé Admin/Chef IEPP, lecture seule."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrChefIEPP]
    queryset = AuditLog.objects.select_related("utilisateur")
    filterset_fields = ["action", "modele", "utilisateur"]        