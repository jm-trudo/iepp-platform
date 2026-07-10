from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from .fields import EncryptedCharField


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
    telephone = EncryptedCharField(max_length=255, blank=True)
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
    
class ActionAudit(models.TextChoices):
       CREATION = "CREATION", "Création"
       MODIFICATION = "MODIFICATION", "Modification"
       SUPPRESSION = "SUPPRESSION", "Suppression"


class AuditLog(models.Model):
    """
    Journal des actions : qui a créé/modifié/supprimé quelle donnée, et quand.
    Alimenté automatiquement par les signaux (voir apps/users/signals.py).
    """
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="actions_journalisees",
    )
    action = models.CharField(max_length=15, choices=ActionAudit.choices)
    modele = models.CharField(max_length=100, verbose_name="Modèle concerné")
    objet_id = models.CharField(max_length=50, verbose_name="ID de l'objet")
    objet_repr = models.CharField(max_length=255, blank=True, verbose_name="Représentation de l'objet")
    date_action = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Journal d'action"
        verbose_name_plural = "Journal des actions"
        ordering = ["-date_action"]
        indexes = [
            models.Index(fields=["modele", "objet_id"]),
            models.Index(fields=["-date_action"]),
        ]

    def __str__(self):
        return f"{self.get_action_display()} — {self.modele}#{self.objet_id} par {self.utilisateur}"