from django.contrib import admin
from .models import AuthorizationRequest


@admin.register(AuthorizationRequest)
class AuthorizationRequestAdmin(admin.ModelAdmin):
    list_display = ("agent", "ecole", "statut", "date_depart", "date_retour", "chef")
    list_filter = ("statut", "ecole")
    search_fields = ("agent__username", "agent__last_name")
