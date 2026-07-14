from rest_framework import serializers
from apps.schools.models import School
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

        ecole = attrs.get("ecole")
        if ecole is not None:
            request = self.context.get("request")
            agent = request.user if request else None
            if agent and agent.role not in ("ADMIN", "CHEF_IEPP"):
                ecoles_autorisees = self._ecoles_de_agent(agent)
                if ecole.id not in ecoles_autorisees:
                    raise serializers.ValidationError(
                        {"ecole": "Vous ne pouvez soumettre une demande que pour votre propre école."}
                    )
        return attrs

    def _ecoles_de_agent(self, agent):
        """Renvoie les ids d'écoles légitimes pour cet agent, selon son rôle."""
        ids = set()
        ecole_dirigee = getattr(agent, "ecole_dirigee", None)
        if ecole_dirigee is not None:
            ids.update(ecole_dirigee.values_list("id", flat=True))
        profil_enseignant = getattr(agent, "teacher_profile", None)
        if profil_enseignant and profil_enseignant.ecole_id:
            ids.add(profil_enseignant.ecole_id)
        profil_conseiller = getattr(agent, "conseiller_profile", None)
        if profil_conseiller and profil_conseiller.secteur_id:
            ids.update(
                School.objects.filter(secteur_id=profil_conseiller.secteur_id).values_list("id", flat=True)
            )
        return ids


class DecisionSerializer(serializers.Serializer):
    """Utilisé uniquement pour les actions accepter/refuser."""
    commentaire = serializers.CharField(required=False, allow_blank=True)