from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    ADMIN = "ADMIN", "Administrateur système"
    CHEF_IEPP = "CHEF_IEPP", "Chef de Circonscription (IEPP)"
    DIRECTEUR = "DIRECTEUR", "Directeur d'école"
    INSTITUTEUR = "INSTITUTEUR", "Instituteur"
    CONSEILLER = "CONSEILLER", "Conseiller pédagogique"


class User(AbstractUser):
    """
    Utilisateur personnalisé de la plateforme.
    Hérite des champs standards Django (username, email, password...)
    et ajoute le rôle métier ainsi que quelques informations de contact.
    """
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.INSTITUTEUR,
        verbose_name="Rôle",
    )
    telephone = models.CharField(max_length=20, blank=True)
    matricule = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
class Sexe(models.TextChoices):
    MASCULIN = "M", "Masculin"
    FEMININ = "F", "Féminin"


class DirectorProfile(models.Model):
    """
    Complément d'information pour les utilisateurs ayant le rôle DIRECTEUR.
    L'école affectée n'est pas dupliquée ici : elle se lit via
    school.directeur (relation déjà définie dans apps.schools.School).
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="director_profile",
        limit_choices_to={"role": Role.DIRECTEUR},
    )
    sexe = models.CharField(max_length=1, choices=Sexe.choices, blank=True)
    date_naissance = models.DateField(null=True, blank=True)
    date_prise_fonction = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de prise de fonction",
    )

    class Meta:
        verbose_name = "Fiche Directeur"
        verbose_name_plural = "Fiches Directeurs"

    def __str__(self):
        return f"Fiche directeur : {self.user.get_full_name() or self.user.username}"