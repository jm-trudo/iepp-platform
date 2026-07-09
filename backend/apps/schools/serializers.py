from rest_framework import serializers
from apps.users.models import User, Role
from .models import School, Sector


class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ["id", "nom"]


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