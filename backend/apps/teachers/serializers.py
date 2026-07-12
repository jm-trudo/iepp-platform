from rest_framework import serializers
from apps.users.models import User, Role
from .models import Classe, TeacherProfile


class ClasseSerializer(serializers.ModelSerializer):
    ecole_nom = serializers.CharField(source="ecole.nom", read_only=True)
    niveau_display = serializers.CharField(source="get_niveau_display", read_only=True)
    nombre_eleves = serializers.SerializerMethodField()

    class Meta:
        model = Classe
        fields = [
            "id", "ecole", "ecole_nom", "niveau", "niveau_display",
            "libelle", "nombre_eleves",
        ]

    def get_nombre_eleves(self, obj):
        if hasattr(obj, "eleves"):
            return obj.eleves.count()
        return 0


class TeacherProfileSerializer(serializers.ModelSerializer):
    ecole_nom = serializers.CharField(source="ecole.nom", read_only=True)
    classe_display = serializers.CharField(source="classe.__str__", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = ["ecole", "ecole_nom", "classe", "classe_display", "sexe", "date_affectation"]


class TeacherSerializer(serializers.ModelSerializer):
    """Fiche instituteur complète : identité (User) + affectation (TeacherProfile)."""
    profile = TeacherProfileSerializer(source="teacher_profile")

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "telephone", "matricule", "is_active", "profile",
        ]
        read_only_fields = ["id"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("teacher_profile", {})
        instance = super().update(instance, validated_data)
        TeacherProfile.objects.update_or_create(
            user=instance, defaults=profile_data
        )
        return instance
