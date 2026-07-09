from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from apps.schools.models import School


class StatutDemande(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    ACCEPTEE = "ACCEPTEE", "Acceptée"
    REFUSEE = "REFUSEE", "Refusée"


class AuthorizationRequest(models.Model):
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="demandes_autorisation",
    )
    ecole = models.ForeignKey(
        School, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="demandes_autorisation",
    )
    motif = models.TextField(verbose_name="Motif de la demande")
    date_depart = models.DateField()
    date_retour = models.DateField()
    piece_jointe = models.FileField(
        upload_to="authorizations/pieces_jointes/", blank=True, null=True
    )

    statut = models.CharField(
        max_length=15, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE
    )
    commentaire_chef = models.TextField(blank=True)
    chef = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="demandes_traitees",
        help_text="Chef IEPP ayant pris la décision",
    )
    date_decision = models.DateTimeField(null=True, blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Demande d'autorisation"
        verbose_name_plural = "Demandes d'autorisation"
        ordering = ["-date_creation"]

    def __str__(self):
        return f"Demande {self.agent} — {self.get_statut_display()}"

    def clean(self):
        if self.date_retour and self.date_depart and self.date_retour < self.date_depart:
            raise ValidationError("La date de retour doit être postérieure à la date de départ.")

    @property
    def nombre_jours(self):
        if self.date_depart and self.date_retour:
            return (self.date_retour - self.date_depart).days + 1
        return None

    @property
    def fonction_agent(self):
        return self.agent.get_role_display()
