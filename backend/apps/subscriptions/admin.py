from django.contrib import admin
from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("chef", "date_debut", "date_fin", "statut", "montant", "jours_restants")
    list_filter = ("statut",)

    def jours_restants(self, obj):
        return obj.jours_restants