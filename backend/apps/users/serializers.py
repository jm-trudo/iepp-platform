from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from django.core.exceptions import ObjectDoesNotExist

class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "role_display", "telephone", "matricule",
            "is_active", "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Utilisé uniquement pour la création d'un compte (mot de passe requis)."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "telephone", "matricule", "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Ajoute le rôle et le nom complet dans le token JWT,
    et renvoie les infos utilisateur avec la réponse de connexion.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.get_full_name() or user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
    
from .models import DirectorProfile


class DirectorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DirectorProfile
        fields = ["sexe", "date_naissance", "date_prise_fonction"]


class DirectorSerializer(serializers.ModelSerializer):
    """
    Fiche directeur complète : identité (User) + informations
    spécifiques (DirectorProfile) + école affectée (lecture seule).
    """
    profile = DirectorProfileSerializer(source="director_profile")
    ecole_affectee = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "telephone", "matricule", "is_active",
            "profile", "ecole_affectee",
        ]
        read_only_fields = ["id"]

    def get_ecole_affectee(self, obj):
        try:
            ecole = obj.ecole_dirigee
        except ObjectDoesNotExist:
         return None
        return {"id": ecole.id, "nom": ecole.nom, "code": ecole.code}

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("director_profile", {})
        instance = super().update(instance, validated_data)
        DirectorProfile.objects.update_or_create(
            user=instance, defaults=profile_data
        )
        return instance
    
