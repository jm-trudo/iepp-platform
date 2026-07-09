from django.contrib import admin
from .models import Note


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("eleve", "matiere", "composition", "valeur", "annee_scolaire", "enseignant")
    list_filter = ("matiere", "composition", "annee_scolaire", "classe")
    search_fields = ("eleve__nom", "eleve__prenoms")
