from rest_framework import serializers
from .models import AuthorizationRequest, StatutDemande


class AuthorizationRequestSerializer(serializers.ModelSerializer):
    agent_nom = serializers.CharField(source="agent.get_full_name", read_only=True)
    fonction_agent = serializers.ReadOnlyField()
    ecole_nom = serializers.CharField(source="ecole.nom", read_only=True)
    nombre_jours = serializers.ReadOnlyField()
    chef_nom = serializers.CharField(source="chef.get_full_name", read_only=True)

    class Meta:
        model = AuthorizationRequest
        fields = [
            "id", "agent", "agent_nom", "fonction_agent",
            "ecole", "ecole_nom", "motif",
            "date_depart", "date_retour", "nombre_jours", "piece_jointe",
            "statut", "commentaire_chef", "chef", "chef_nom", "date_decision",
            "date_creation",
        ]
        read_only_fields = [
            "id", "statut", "commentaire_chef", "chef", "date_decision",
            "date_creation", "agent",
        ]

    def validate(self, attrs):
        depart = attrs.get("date_depart", getattr(self.instance, "date_depart", None))
        retour = attrs.get("date_retour", getattr(self.instance, "date_retour", None))
        if depart and retour and retour < depart:
            raise serializers.ValidationError(
                "La date de retour doit être postérieure à la date de départ."
            )
        return attrs


class DecisionSerializer(serializers.Serializer):
    """Utilisé uniquement pour les actions accepter/refuser."""
    commentaire = serializers.CharField(required=False, allow_blank=True)