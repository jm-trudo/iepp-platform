from rest_framework import serializers
from apps.students.models import Student
from .models import Note
from apps.teachers.models import Classe

class NoteSerializer(serializers.ModelSerializer):
    eleve_nom = serializers.CharField(source="eleve.__str__", read_only=True)
    matiere_display = serializers.CharField(source="get_matiere_display", read_only=True)
    composition_display = serializers.CharField(source="get_composition_display", read_only=True)
    enseignant_nom = serializers.CharField(source="enseignant.get_full_name", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id", "eleve", "eleve_nom", "classe",
            "matiere", "matiere_display", "composition", "composition_display",
            "valeur", "annee_scolaire",
            "enseignant", "enseignant_nom",
            "date_saisie", "date_modification",
        ]
        read_only_fields = ["id", "classe", "enseignant", "date_saisie", "date_modification"]


class NoteEntrySerializer(serializers.Serializer):
    """Une ligne de saisie groupée : un élève + sa valeur."""
    eleve = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    valeur = serializers.DecimalField(max_digits=4, decimal_places=2, min_value=0, max_value=20)


class BulkNoteSerializer(serializers.Serializer):
    """
    Saisie groupée pour une classe entière :
    même matière, même composition, même année scolaire, plusieurs élèves.
    """
    classe = serializers.PrimaryKeyRelatedField(queryset=Classe.objects.all())
    matiere = serializers.ChoiceField(choices=Note._meta.get_field("matiere").choices)
    composition = serializers.ChoiceField(choices=Note._meta.get_field("composition").choices)
    annee_scolaire = serializers.CharField(max_length=9)
    notes = NoteEntrySerializer(many=True)

    def validate(self, attrs):
        classe = attrs["classe"]
        for entree in attrs["notes"]:
            if entree["eleve"].classe_id != classe.id:
                raise serializers.ValidationError(
                    f"L'élève {entree['eleve']} n'appartient pas à la classe sélectionnée."
                )
        return attrs