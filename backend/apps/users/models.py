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
