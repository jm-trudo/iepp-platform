from django.db import models
from apps.schools.models import School
from apps.teachers.models import Classe, Sexe
from apps.users.fields import EncryptedCharField


class Student(models.Model):
    nom = models.CharField(max_length=100)
    prenoms = models.CharField(max_length=150)
    date_naissance = models.DateField(null=True, blank=True)
    sexe = models.CharField(max_length=1, choices=Sexe.choices, blank=True)

    classe = models.ForeignKey(
        Classe, on_delete=models.CASCADE, related_name="eleves"
    )
    ecole = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="eleves",
        editable=False,  # déduite automatiquement de la classe
    )

    nom_parent = models.CharField(max_length=150, verbose_name="Nom du parent/tuteur", blank=True)
    contact_parent = EncryptedCharField(max_length=255, verbose_name="Contact parent/tuteur", blank=True)

    date_inscription = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Élève"
        verbose_name_plural = "Élèves"
        ordering = ["nom", "prenoms"]

    def __str__(self):
        return f"{self.nom} {self.prenoms} ({self.classe})"

    def save(self, *args, **kwargs):
        # L'école est toujours celle de la classe : on ne la laisse
        # jamais diverger, même si un jour un champ caché est manipulé.
        self.ecole = self.classe.ecole
        super().save(*args, **kwargs)