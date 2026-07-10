from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.users.models import Role


class StatutAbonnement(models.TextChoices):
    ACTIF = "ACTIF", "Actif"
    EXPIRE = "EXPIRE", "Expiré"
    SUSPENDU = "SUSPENDU", "Suspendu"


class Subscription(models.Model):
    chef = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="abonnement",
        limit_choices_to={"role": Role.CHEF_IEPP},
    )
    date_debut = models.DateField()
    date_fin = models.DateField(verbose_name="Date d'expiration")
    statut = models.CharField(
        max_length=10, choices=StatutAbonnement.choices, default=StatutAbonnement.ACTIF
    )
    montant = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    reference_paiement = models.CharField(
        max_length=100, blank=True,
        help_text="Réservé à la future intégration de paiement en ligne.",
    )
    notifie_expiration = models.BooleanField(
        default=False,
        help_text="Passe à True une fois la notification d'expiration proche envoyée.",
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Abonnement"
        verbose_name_plural = "Abonnements"
        ordering = ["-date_fin"]

    def __str__(self):
        return f"Abonnement {self.chef} — {self.get_statut_display()} (jusqu'au {self.date_fin})"

    def actualiser_statut(self):
        """Recalcule le statut selon la date du jour (sauf si suspendu manuellement)."""
        if self.statut == StatutAbonnement.SUSPENDU:
            return
        today = timezone.now().date()
        nouveau_statut = (
            StatutAbonnement.ACTIF if self.date_debut <= today <= self.date_fin
            else StatutAbonnement.EXPIRE
        )
        if nouveau_statut != self.statut:
            self.statut = nouveau_statut
            self.save(update_fields=["statut"])

    def est_active(self):
        today = timezone.now().date()
        return self.statut == StatutAbonnement.ACTIF and self.date_debut <= today <= self.date_fin

    @property
    def jours_restants(self):
        return (self.date_fin - timezone.now().date()).days
