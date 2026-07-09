from django.contrib import admin
from .models import School, Sector


@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ("nom",)
    search_fields = ("nom",)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("nom", "code", "type_ecole", "milieu", "directeur", "secteur")
    list_filter = ("type_ecole", "milieu", "secteur")
    search_fields = ("nom", "code")
