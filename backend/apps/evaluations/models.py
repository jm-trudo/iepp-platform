from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.students.models import Student
from apps.teachers.models import Classe


class Matiere(models.TextChoices):
    LECTURE = "LECTURE", "Lecture"
    EXPRESSION_ECRITE = "EXPRESSION_ECRITE", "Expression écrite"
    POESIE = "POESIE", "Poésie"
    ECRITURE = "ECRITURE", "Écriture"
    DICTEE = "DICTEE", "Dictée"
    MATHEMATIQUES = "MATHEMATIQUES", "Mathématiques"
    EDHC = "EDHC", "EDHC"
    EPS = "EPS", "EPS"
    CHANT = "CHANT", "Chant"
    SCIENCES = "SCIENCES", "Sciences et technologie"
    HISTOIRE_GEO = "HISTOIRE_GEO", "Histoire-Géographie"


class Composition(models.TextChoices):
    COMPOSITION_1 = "COMP1", "Composition 1"
    COMPOSITION_2 = "COMP2", "Composition 2"
    COMPOSITION_3 = "COMP3", "Composition 3"
    COMPOSITION_FINALE = "COMP_FINALE", "Composition finale"


class Note(models.Model):
    eleve = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="notes"
    )
    classe = models.ForeignKey(
        Classe, on_delete=models.CASCADE, related_name="notes",
        editable=False,  # déduite de l'élève, comme School l'est de Classe pour Student
    )
    matiere = models.CharField(max_length=25, choices=Matiere.choices)
    composition = models.CharField(max_length=15, choices=Composition.choices)
    valeur = models.DecimalField(
        max_digits=4, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )
    annee_scolaire = models.CharField(
        max_length=9, help_text="Format : 2025-2026",
    )
    enseignant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name="notes_saisies",
    )
    date_saisie = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        unique_together = ["eleve", "matiere", "composition", "annee_scolaire"]
        ordering = ["eleve", "matiere", "composition"]

    def __str__(self):
        return f"{self.eleve} — {self.get_matiere_display()} — {self.get_composition_display()} : {self.valeur}"

    def clean(self):
        if self.eleve_id and self.classe_id and self.eleve.classe_id != self.classe_id:
            raise ValidationError("La classe doit correspondre à celle de l'élève.")

    def save(self, *args, **kwargs):
        # Comme pour Student.ecole : jamais laissée diverger manuellement.
        self.classe = self.eleve.classe
        super().save(*args, **kwargs)
