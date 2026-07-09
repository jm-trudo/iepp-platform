from rest_framework import serializers
from apps.users.models import User, Role
from .models import School, Sector


class SectorSerializer(serializers.ModelSerializer):
    conseiller_nom = serializers.SerializerMethodField()
    ecoles_suivies = serializers.SerializerMethodField()

    class Meta:
        model = Sector
        fields = ["id", "nom", "conseiller_nom", "ecoles_suivies"]

    def get_conseiller_nom(self, obj):
        conseiller = getattr(obj, "conseillers", None)
        if conseiller:
            profile = conseiller.first()
            if profile:
                return profile.user.get_full_name() or profile.user.username
        return None

    def get_ecoles_suivies(self, obj):
        return [{"id": e.id, "nom": e.nom} for e in obj.ecoles.all()]


class SchoolSerializer(serializers.ModelSerializer):
    directeur_nom = serializers.SerializerMethodField()
    secteur_nom = serializers.CharField(source="secteur.nom", read_only=True)
    nombre_enseignants = serializers.ReadOnlyField()
    nombre_eleves = serializers.ReadOnlyField()
    nombre_classes = serializers.ReadOnlyField()

    class Meta:
        model = School
        fields = [
            "id", "nom", "code", "type_ecole", "logo", "milieu",
            "adresse", "telephone", "email",
            "directeur", "directeur_nom",
            "secteur", "secteur_nom",
            "nombre_enseignants", "nombre_eleves", "nombre_classes",
            "date_creation", "date_modification",
        ]
        read_only_fields = ["id", "date_creation", "date_modification"]

    def get_directeur_nom(self, obj):
        if obj.directeur:
            return obj.directeur.get_full_name() or obj.directeur.username
        return None

    def validate_directeur(self, value):
        if value and value.role != Role.DIRECTEUR:
            raise serializers.ValidationError(
                "L'utilisateur choisi comme directeur doit avoir le rôle 'Directeur d'école'."
            )
        return value
    
    from apps.users.models import User
from .models import ConseillerProfile


class ConseillerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConseillerProfile
        fields = ["secteur"]


class ConseillerSerializer(serializers.ModelSerializer):
    """Fiche conseiller pédagogique : identité (User) + secteur attribué."""
    profile = ConseillerProfileSerializer(source="conseiller_profile")
    ecoles_suivies = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "telephone", "is_active", "profile", "ecoles_suivies",
        ]
        read_only_fields = ["id"]

    def get_ecoles_suivies(self, obj):
        profile = getattr(obj, "conseiller_profile", None)
        if profile and profile.secteur:
            return [{"id": e.id, "nom": e.nom} for e in profile.secteur.ecoles.all()]
        return []

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("conseiller_profile", {})
        instance = super().update(instance, validated_data)
        ConseillerProfile.objects.update_or_create(
            user=instance, defaults=profile_data
        )
        return instance