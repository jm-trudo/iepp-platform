from django.conf import settings
from django.db import models


class Circonscription(models.Model):
    nom = models.CharField(max_length=200, verbose_name="Nom de la circonscription")
    chef = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="circonscription_dirigee",
        limit_choices_to={"role": "CHEF_IEPP"},
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Circonscription"
        verbose_name_plural = "Circonscriptions"

    def __str__(self):
        return self.nom