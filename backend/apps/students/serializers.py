from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    classe_display = serializers.CharField(source="classe.__str__", read_only=True)
    ecole_nom = serializers.CharField(source="ecole.nom", read_only=True)

    class Meta:
        model = Student
        fields = [
            "id", "nom", "prenoms", "date_naissance", "sexe",
            "classe", "classe_display", "ecole", "ecole_nom",
            "nom_parent", "contact_parent",
            "date_inscription", "date_modification",
        ]
        read_only_fields = ["id", "ecole", "date_inscription", "date_modification"]