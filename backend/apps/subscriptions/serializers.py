from rest_framework import serializers
from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    chef_nom = serializers.CharField(source="chef.get_full_name", read_only=True)
    jours_restants = serializers.ReadOnlyField()
    est_active = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id", "chef", "chef_nom",
            "date_debut", "date_fin", "statut",
            "montant", "reference_paiement",
            "jours_restants", "est_active",
            "notifie_expiration", "date_creation",
        ]
        read_only_fields = ["id", "notifie_expiration", "date_creation"]

    def get_est_active(self, obj):
        return obj.est_active()

    def validate(self, attrs):
        debut = attrs.get("date_debut", getattr(self.instance, "date_debut", None))
        fin = attrs.get("date_fin", getattr(self.instance, "date_fin", None))
        if debut and fin and fin <= debut:
            raise serializers.ValidationError(
                "La date d'expiration doit être postérieure à la date de début."
            )
        return attrs