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