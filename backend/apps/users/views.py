from rest_framework import viewsets, generics, permissions, serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdminOrChefIEPP
from .models import Role, DirectorProfile
from .serializers import DirectorSerializer
from rest_framework import generics
from .models import AuditLog
from .models import User, Role, DirectorProfile, AuditLog


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
    """CRUD des comptes utilisateurs, réservé à l'Admin et au Chef IEPP."""
    queryset = User.objects.all().order_by("last_name", "first_name")
    permission_classes = [IsAdminOrChefIEPP]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer
    

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
    "director_profile"
).prefetch_related("ecole_dirigee")
    

    def get_permissions(self):
        if self.action in ("list", "create", "destroy"):
            return [IsAdminOrChefIEPP()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role in (Role.ADMIN, Role.CHEF_IEPP):
            return self.queryset
        # Un Directeur ne voit que sa propre fiche
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