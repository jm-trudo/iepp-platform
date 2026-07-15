from django.conf import settings
from django.db import models
from apps.users.models import Role
from apps.circonscriptions.models import Circonscription

class Sector(models.Model):
    nom = models.CharField(max_length=150, unique=True)

    class Meta:
        verbose_name = "Secteur pédagogique"
        verbose_name_plural = "Secteurs pédagogiques"

    def __str__(self):
        return self.nom


class TypeEcole(models.TextChoices):
    PUBLIQUE = "PUBLIQUE", "Publique"
    PRIVEE = "PRIVEE", "Privée"
    COMMUNAUTAIRE = "COMMUNAUTAIRE", "Communautaire"
    CONFESSIONNELLE = "CONFESSIONNELLE", "Confessionnelle"


class Milieu(models.TextChoices):
    URBAIN = "URBAIN", "Urbain"
    RURAL = "RURAL", "Rural"


class School(models.Model):
    nom = models.CharField(max_length=200, verbose_name="Nom de l'école")
    code = models.CharField(max_length=30, unique=True, verbose_name="Code école")
    type_ecole = models.CharField(
        max_length=20,
        choices=TypeEcole.choices,
        default=TypeEcole.PUBLIQUE,
    )
    logo = models.ImageField(upload_to="schools/logos/", blank=True, null=True)

    milieu = models.CharField(
        max_length=10,
        choices=Milieu.choices,
        default=Milieu.URBAIN,
    )
    adresse = models.CharField(max_length=255, blank=True)
    telephone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)

    directeur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ecole_dirigee",
        limit_choices_to={"role": Role.DIRECTEUR},
        verbose_name="Directeur responsable",
    )

    secteur = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ecoles",
        verbose_name="Secteur pédagogique",
    )

    circonscription = models.ForeignKey(
    Circonscription,
    on_delete=models.CASCADE,
    related_name="ecoles",
    # temporaire, pour permettre la migration de données existantes
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "École"
        verbose_name_plural = "Écoles"
        ordering = ["nom"]

    def __str__(self):
        return f"{self.nom} ({self.code})"

    @property
    def nombre_enseignants(self):
        if hasattr(self, "enseignants"):
            return self.enseignants.count()
        return 0

    @property
    def nombre_eleves(self):
        if hasattr(self, "eleves"):
            return self.eleves.count()
        return 0

    @property
    def nombre_classes(self):
        if hasattr(self, "classes"):
            return self.classes.count()
        return 0


class ConseillerProfile(models.Model):
    """
    Complément d'information pour les utilisateurs ayant le rôle CONSEILLER.
    Les écoles suivies se lisent via secteur.ecoles.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conseiller_profile",
    )

    secteur = models.ForeignKey(
        Sector,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conseillers",
    )
    class Meta:
        verbose_name = "Fiche Conseiller pédagogique"
        verbose_name_plural = "Fiches Conseillers pédagogiques"

    def __str__(self):
        return f"Fiche conseiller : {self.user.get_full_name() or self.user.username}"