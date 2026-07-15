from django.contrib import admin
from .models import Circonscription


@admin.register(Circonscription)
class CirconscriptionAdmin(admin.ModelAdmin):
    list_display = ("nom", "chef", "date_creation")