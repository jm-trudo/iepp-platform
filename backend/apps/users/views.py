from rest_framework import viewsets, generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdminOrChefIEPP


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
    
from .models import Role, DirectorProfile
from .serializers import DirectorSerializer
from .permissions import IsAdminOrChefIEPP


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