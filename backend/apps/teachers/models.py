from django.conf import settings
from django.db import models
from apps.schools.models import School


class Niveau(models.TextChoices):
    PETITE_SECTION = "PS", "Petite Section"
    MOYENNE_SECTION = "MS", "Moyenne Section"
    GRANDE_SECTION = "GS", "Grande Section"
    CP1 = "CP1", "CP1"
    CP2 = "CP2", "CP2"
    CE1 = "CE1", "CE1"
    CE2 = "CE2", "CE2"
    CM1 = "CM1", "CM1"
    CM2 = "CM2", "CM2"


class Classe(models.Model):
    """
    Une classe appartient à une école et correspond à un niveau.
    Ex: CM2 A à l'EPP Cocody 1.
    """
    ecole = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="classes"
    )
    niveau = models.CharField(max_length=3, choices=Niveau.choices)
    libelle = models.CharField(
        max_length=50, blank=True,
        help_text="Ex: 'A', 'B' — pour distinguer plusieurs classes du même niveau",
    )

    class Meta:
        verbose_name = "Classe"
        verbose_name_plural = "Classes"
        unique_together = ["ecole", "niveau", "libelle"]
        ordering = ["ecole", "niveau"]

    def __str__(self):
        suffixe = f" {self.libelle}" if self.libelle else ""
        return f"{self.get_niveau_display()}{suffixe} — {self.ecole.nom}"


class Sexe(models.TextChoices):
    MASCULIN = "M", "Masculin"
    FEMININ = "F", "Féminin"


class TeacherProfile(models.Model):
    """
    Complément d'information pour les utilisateurs ayant le rôle INSTITUTEUR.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    ecole = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="enseignants",
    )
    classe = models.ForeignKey(
        Classe, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="enseignants",
    )
    sexe = models.CharField(max_length=1, choices=Sexe.choices, blank=True)
    date_affectation = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Fiche Instituteur"
        verbose_name_plural = "Fiches Instituteurs"

    def __str__(self):
        return f"Fiche instituteur : {self.user.get_full_name() or self.user.username}"